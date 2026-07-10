import { Request, Response } from "express";
import { aiAgent } from "./index";
import { inngest } from "../inngest/client";
import { redis } from "../lib/redis";
import { Id } from "@workspace/backend/_generated/dataModel";

// ─── Shared Redis polling helper ────────────────────────────────────────────
export function pipeRedisToSSE(
  streamKey: string,
  res: Response,
  req: Request,
  pushToStream: (payload: any) => void,
  startOffset = 0,
) {
  let lastOffset = startOffset;
  const pollInterval = setInterval(async () => {
    try {
      const items = await redis.lrange(streamKey, lastOffset, -1);
      if (items && items.length > 0) {
        for (const item of items) {
          const parsed = typeof item === "string" ? JSON.parse(item) : item;
          pushToStream(parsed);

          if (parsed.type === "done" || parsed.type === "error") {
            clearInterval(pollInterval);
            res.end();
            return;
          }
        }
        lastOffset += items.length;
      }
    } catch (err) {
      console.error("Error polling background stream:", err);
      clearInterval(pollInterval);
      pushToStream({
        type: "error",
        error: "⚠️ Connection error. Please try again later.",
      });
      pushToStream({ type: "done" });
      res.end();
    }
  }, 1000);

  req.on("close", () => {
    clearInterval(pollInterval);
  });
}

export const aiAgentHandler = async (req: Request, res: Response) => {
  const {
    userMessage,
    conversationId,
    sessionToken,
    workflowId,
    isBuildMode,
    clientMessageId,
  } = req.body;

  const streamKey = `agent:stream:${conversationId}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let streamedPayloadCount = 0;
  const pushToStream = (payload: any) => {
    streamedPayloadCount += 1;
    res.write(`${JSON.stringify(payload)}\n`);
  };

  let fullAiContent = "";
  let fullThinkingContent = "";
  let delegatedToBackground = false;
  try {
    await redis.del(streamKey);

    const events = await aiAgent.streamEvents(
      {
        userMessage,
        conversationId: conversationId || undefined,
        sessionToken,
        intent: null,
        chatHistory: [],
        operations: [],
        error: undefined,
      },
      {
        version: "v2",
        configurable: {
          token: sessionToken,
          thread_id: conversationId || "default",
        },
      },
    );

    for await (const event of events) {
      if (event.event === "on_chain_end") {
        if (event.name === "classifyIntent" && event.data?.output?.intent) {
          const intent = event.data.output.intent;
          const reasoning = event.data.output.intentReasoning;
          console.log("Detected Intent:", intent);
          pushToStream({ type: "intent", intent });

          if (intent === "kanban") {
            console.log("🚀 Triggering Kanban Inngest flow");
            
            // Fetch history to provide context to Inngest
            let chatHistory:{role:string,content:string}[] = [];
            if (conversationId) {
              const { getConvexClient } = await import("./convex-client");
              const { api } = await import("@workspace/backend/_generated/api");
              const client = getConvexClient(sessionToken);
              const messages = await client.query(api.ai.messages.getLastNMessages, {
                conversationId: conversationId as Id<"conversations">,
                n: 10
              });
              chatHistory = (messages || []).map(m => ({
                role: m.role,
                content: m.content,
              }));
            }

            // Immediate feedback while Inngest works
            const thinkingMsg = reasoning ? `🔍 ${reasoning}` : "🔍 Analyzing your Kanban request... hang tight!";
            pushToStream({ type: "thinking", content: thinkingMsg });
            fullThinkingContent += thinkingMsg;

            await inngest.send({
              name: "kanban/action.requested",
              data: {
                userMessage,
                sessionToken,
                conversationId,
                streamKey,
                chatHistory,
                thinkingContent: fullThinkingContent.trim() || undefined,
                clientMessageId,
              },
            });
            delegatedToBackground = true;
            pipeRedisToSSE(streamKey, res, req, pushToStream, streamedPayloadCount);
            return; 
          }

          if (intent === "workflow") {
            console.log("🚀 Triggering Workflow Inngest flow");

            // Immediate feedback with proposed visualization
            const msg1 = reasoning ? `🔍 ${reasoning}\n\n` : "🔍 Analyzing your workflow request...\n\n";
            
            pushToStream({ type: "thinking", content: msg1 });
            
            fullThinkingContent += msg1;

            await inngest.send({
              name: "workflow/action.requested",
              data: {
                userMessage,
                sessionToken,
                conversationId,
                streamKey,
                workflowId,
                isBuildMode,
                thinkingContent: fullThinkingContent.trim() || undefined,
                clientMessageId,
              },
            });
            delegatedToBackground = true;
            pipeRedisToSSE(streamKey, res, req, pushToStream, streamedPayloadCount);
            return;
          }
        }
      }

      if (event.event === "on_chat_model_stream") {
        const chunk = event.data?.chunk;
        const token = chunk?.content;
        // Capture extended-thinking / reasoning tokens (Claude 3.7+, o1-style models)
        const reasoningToken: string | undefined =
          chunk?.additional_kwargs?.reasoning_content ??
          chunk?.additional_kwargs?.thinking ??
          undefined;
        if (event.tags?.includes("chat_stream")) {
          if (reasoningToken) {
            pushToStream({ type: "thinking", content: reasoningToken });
            fullThinkingContent += reasoningToken;
          }
          if (token) {
            pushToStream({ type: "chat_token", content: token });
            fullAiContent += token;
          }
        }
      } else if (event.event === "on_chain_end" && event.name === "LangGraph") {
         if (event.data?.output?.operations) {
            pushToStream({
              type: "response",
              response: { operations: event.data.output.operations },
            });

            const chatOp = event.data.output.operations.find((op: any) => op.type === "chat_response");
            if (chatOp && chatOp.content && !fullAiContent.trim()) {
                fullAiContent = chatOp.content;
            }
          }
      }
    }
  } catch (e: any) {
    console.error("Streaming error:", e);
    const errorMsg = "⚠️ I encountered an error while processing your request.";
    pushToStream({ type: "error", error: errorMsg });
    fullAiContent += (fullAiContent ? "\n\n" : "") + errorMsg;
  } finally {
    if (!delegatedToBackground && fullAiContent.trim() && conversationId) {
      try {
        const { getConvexClient } = await import("./convex-client");
        const { api } = await import("@workspace/backend/_generated/api");
        const client = getConvexClient(sessionToken);
        await client.mutation(api.ai.messages.insertMessage, {
          conversationId: conversationId as Id<"conversations">,
          content: fullAiContent,
          thinking: fullThinkingContent.trim() || undefined,
          role: "AI",
          clientMessageId: clientMessageId || undefined,
        });
      } catch (err) {
        console.error("❌ Failed to persist final AI message:", err);
      }
    }

    if (!delegatedToBackground && !res.writableEnded) {
      pushToStream({ type: "done" });
      res.end();
    }
  }
};
