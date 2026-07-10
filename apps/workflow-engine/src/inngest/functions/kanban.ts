import { inngest } from "../client";
import { getConvexClient } from "../../ai-agent/convex-client";
import { api } from "@workspace/backend/_generated/api";
import { redis } from "../../lib/redis";
import { getAIModel } from "../../lib/ai-model";
import { Doc } from "@workspace/backend/_generated/dataModel";

const aiModel = getAIModel();

export const handleKanbanAction = inngest.createFunction(
  { id: "handle-kanban-action", name: "Handle Kanban Action" },
  { event: "kanban/action.requested" },
  async ({ event, step }) => {
    const { userMessage, sessionToken, conversationId, streamKey, chatHistory, thinkingContent, clientMessageId } = event.data;

    // 1. Fetch current tasks from Convex
    const currentTasks = await step.run("fetch-tasks", async () => {
      const client = getConvexClient(sessionToken);
      try {
        return await client.query(api.kanban.listTasks, {});
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        return [];
      }
    });

    // 2. Parse the action using LLM with task context
    const actionData = await step.run("parse-kanban-action", async () => {
      const tasksFormatted = currentTasks.map((t: Doc<"kanban_tasks">) => `- ID: ${t._id}, Title: "${t.title}", Status: ${t.status}`).join("\n");
      const historyContext = (chatHistory || [])
        .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");
      
      const prompt = `You are a Kanban board assistant. Parse the user's request into a structured action.
User Message: "${userMessage}"

Recent Conversation Context:
${historyContext || "No previous history."}

Current Tasks on the board:
${tasksFormatted || "No tasks current on the board."}

Available Actions:
- create: { title: string, status: "todo" | "in-progress" | "done" }
- move: { id: string, status: "todo" | "in-progress" | "done", position?: number }
- update: { id: string, title?: string, status?: "todo" | "in-progress" | "done" }
- delete: { id: string }

IMPORTANT: 
- ONLY provide a task ID if the user's mention is an EXACT name match (case-insensitive) to one of the tasks in the list.
- If the name is fuzzy, partial, or semantically related (but NOT an exact match), DO NOT provide an ID. Instead, set the "searchTerm" to the name mentioned and return an error so I can perform a semantic search.
- If no matching task is found at all, return an error in the JSON.
- RECOGNIZING FOLLOW-UPS: If the user's message is a follow-up to a previous AI question (e.g., "yes", "no", "hello"), use the conversation history to determine the intent. For example, if the AI asked "Did you mean hello?", and the user says "yes", the action is "delete" (or whatever was previously discussed) for the "hello" task.

Return ONLY valid JSON:
{
  "action": "create" | "move" | "update" | "delete",
  "params": { ... },
  "confirmationText": "A brief user-friendly message describing what you will do",
  "searchTerm": "If you can't find a matching task ID for move/update/delete, put the task name the user mentioned here so I can search for it semantically",
  "error": "Message if task not found or action invalid"
}
`;
      const response = await aiModel.invoke([{ role: "user", content: prompt }]);
      let text = response.content as string;
      let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    });

    // 3. Execute the action in Convex
    const result = await step.run("execute-convex-action", async () => {
      const client = getConvexClient(sessionToken);
      const { action, params, searchTerm, error } = actionData;

      if (error) {
        // If LLM couldn't find the ID but gave us a search term, try semantic search
        if (searchTerm && (action === "delete" || action === "update" || action === "move")) {
          try {
            const searchResults = await client.action(api.kanban.searchTasks, { query: searchTerm });
            
            if (searchResults && searchResults.length > 0) {
              // If there's a very high confidence single result (score > 0.9), we could act on it.
              // But as per user request, if none or multiple, ask the user to select.
              // For now, we'll always ask if it wasn't an exact match in context.
              const options = searchResults
                .map((t: any, i: number) => `${i + 1}. "${t.title}" (${t.status})`)
                .join("\n");
              
              return { 
                success: false, 
                isClarification: true,
                error: `I couldn't find an exact match for "${searchTerm}". Did you mean one of these?\n\n${options}\n\nPlease tell me the full name of the task you want to ${action}.` 
              };
            }
          } catch (err) {
            console.error("Semantic search failed:", err);
          }
        }
        return { success: false, isClarification: false, error: error };
      }

      try {
        switch (action) {
          case "create":
            await client.mutation(api.kanban.createTask, {
              title: params.title,
              status: params.status || "todo",
            });
            break;
          case "move":
            await client.mutation(api.kanban.moveTask, {
              id: params.id,
              status: params.status,
              position: params.position ?? 1024,
            });
            break;
          case "update":
            await client.mutation(api.kanban.updateTask, {
              id: params.id,
              ...params,
            });
            break;
          case "delete":
            await client.mutation(api.kanban.deleteTask, {
              id: params.id,
            });
            break;
        }
        return { success: true, isClarification: false, error: "" };
      } catch (err: any) {
        console.error("Convex mutation failed:", err);
        return { success: false, isClarification: false, error: err.message };
      }
    });

    // 4. Persist AI response to Convex
    await step.run("persist-ai-response", async () => {
      const client = getConvexClient(sessionToken);
      const content = result.success 
        ? `✅ ${actionData.confirmationText}` 
        : (result as any).isClarification
          ? `❓ ${(result as any).error}`
          : `❌ Failed to perform action: ${(result as any).error || "Unknown error"}`;
      
      if (conversationId) {
        await client.mutation(api.ai.messages.insertMessage, {
          conversationId: conversationId,
          content: content,
          role: "AI",
          thinking: thinkingContent || undefined,
          clientMessageId,
        });
      }
    });

    // 5. Send feedback via Redis (SSE)
    if (streamKey) {
      await step.run("send-sse-feedback", async () => {
        const content = result.success 
          ? `✅ ${actionData.confirmationText}` 
          : (result as any).isClarification
            ? `❓ ${(result as any).error}`
            : `❌ Failed to perform action: ${(result as any).error || "Unknown error"}`;

        await redis.rpush(streamKey, JSON.stringify({ type: "chat_token", content: `\n\n${content}` }));
        await redis.rpush(streamKey, JSON.stringify({ type: "done" }));
      });
    }

    return { result };
  }
);
