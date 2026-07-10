import React, { useState } from "react";
import { Textarea } from "@workspace/ui/components/textarea";
import { Button } from "@workspace/ui/components/button";
import {
  Cancel01Icon,
  SentIcon,
  ZapIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { toast } from "sonner";
import { useQueryState } from "nuqs";
import { useChatStore } from "./chat-store";

interface ChatFooterProps {
  conversationId: string;
}

export const ChatFooter = ({ conversationId }: ChatFooterProps) => {
  const {
      selectedContext, 
      setSelectedContext, 
      removeContext, 
      setStreamingText, 
      setStreamingThinking,
      setConversationId, 
      sendingMessage, 
      setSendingMessage,
      setStreamingId,
      resetStreamingState,
      setActiveRequestController,
      abortActiveRequest,
  } = useChatStore()
  const params = useParams();
  const projectId = params?.projectId as string;
  const workflowId = params?.workflowId as string;
  const { getToken } = useAuth();
  const [fileId] = useQueryState("fileId")
    
  const createConversation = useMutation(api.ai.conversations.startConversation);

  const insertMessage = useMutation(api.ai.messages.insertMessage);

  const [prompt, setPrompt] = useState("");
  const [isBuildMode, setIsBuildMode] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inputElement = document.getElementById('ai-chat-textarea') as HTMLTextAreaElement;
    const currentPrompt = inputElement ? inputElement.value : prompt;
    if(sendingMessage) return;

    let selectedText = selectedContext.map((context) => context.text).join("\n");
    
    if(!currentPrompt.trim() && !selectedText) return

    setPrompt("");
    if (inputElement) inputElement.value = "";
    setSelectedContext("reset");
    
    try {
        abortActiveRequest();

        let currentConversationId = conversationId;
        
        // 1. Create conversation if valid ID not present
        if (!currentConversationId) {
            // Generate title from first message
            const title = currentPrompt.slice(0, 30) + (currentPrompt.length > 30 ? "..." : "");
            currentConversationId = await createConversation({ organizationId: "personal", title }) as Id<"conversations">;
            setConversationId(currentConversationId);
        }


        setSendingMessage(true)
        resetStreamingState();
        
        const clientMessageId = crypto.randomUUID();
        setStreamingId(clientMessageId);
        const abortController = new AbortController();
        setActiveRequestController(abortController);
        
        // 2. Save User Message
        await insertMessage({
            conversationId: currentConversationId as Id<"conversations">,
            content: currentPrompt,
            role: "USER",
            context: selectedContext,
            clientMessageId,
        });

        const token = await getToken({ template: "convex" }) ?? undefined;

        const response = await fetch(`${process.env.NEXT_PUBLIC_WORKFLOW_ENGINE_BASE_URL}/ai/agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
          body: JSON.stringify({
            userMessage: currentPrompt,
            selectedText,
            projectId,
            conversationId: currentConversationId,
            source: 'ui',
            sessionToken: token,
            workflowId,
            isBuildMode,
            clientMessageId,
            answer: currentPrompt, // Required by route.ts when replyType === "answer"
            replyType: (() => {
               const input = document.getElementById('ai-chat-textarea') as HTMLTextAreaElement;
               if (input?.dataset.replyType === "reject") {
                   delete input.dataset.replyType; // clear it for next time
                   return "reject";
               }
               if (input?.dataset.replyType === "approve") {
                   delete input.dataset.replyType; 
                   return "approve";
               }
               return undefined;
            })(),
          }),
        });

      
    
        if (!response.ok) {
            let errorMsg = "Failed to fetch AI response";
            try {
                const data = await response.json();
                errorMsg = data.message || data.error || errorMsg;
            } catch (e) {}
            
            console.log("Failed to fetch AI response:", errorMsg);
            resetStreamingState();
            setStreamingText(`⚠️ ${errorMsg}`);
            
            // Clear the error message after 5 seconds since it's ephemeral
            setTimeout(() => resetStreamingState(), 5000);
            return;
        }

        // 3. Handle Streaming Response
        if(response.body){
             const streamReader = response.body.getReader();
             const decoder = new TextDecoder();
             let aiResponseText = "";
             let thinkingText = "";
             
             // Batch tokens between animation frames — eliminates mid-stream UI freeze
             let pendingTokens = "";
             let rafId: number | null = null;

             const flushPending = () => {
                 if (!pendingTokens) return;
                 setStreamingText(pendingTokens);
                 pendingTokens = "";
                 rafId = null;
             };

             const scheduleFlush = () => {
                 if (rafId === null) {
                     rafId = requestAnimationFrame(flushPending);
                 }
             };

             // Deduplicate using server-injected _idx so redundant SSE replays are dropped
             const seen = new Set<number>();

             // Buffer carries incomplete lines across chunk boundaries
             let lineBuffer = "";

             while(true) {
                 const { done, value } = await streamReader.read();
                 
                 if (done) {
                     // Cancel any pending RAF and flush remaining tokens synchronously
                     if (rafId !== null) {
                        cancelAnimationFrame(rafId);
                        rafId = null;
                     }
                     flushPending();
                     break;
                 }

                 // Append decoded chunk to buffer, then split on newlines.
                 // lines.pop() removes the last element — it's either empty (chunk ended
                 // with \n) or a partial line to carry forward into the next chunk.
                 lineBuffer += decoder.decode(value, { stream: true });
                 const lines = lineBuffer.split("\n");
                 lineBuffer = lines.pop() ?? ""; // carry forward any incomplete line

                 for (const line of lines) {
                     try {
                          const chatState = useChatStore.getState();
                          const streamWasReplaced =
                              chatState.conversationId !== currentConversationId ||
                              chatState.streamingId !== clientMessageId;

                          if (streamWasReplaced) {
                              abortController.abort();
                              break;
                          }

                          const data = JSON.parse(line);

                          // Drop duplicates — server already stamps _idx on every event
                          if (typeof data._idx === "number") {
                              if (seen.has(data._idx)) continue;
                              seen.add(data._idx);
                          }

                          switch (data.type) {
                              case "thinking": {
                                  // Flush pending chat tokens first, then update thinking
                                  flushPending();
                                  thinkingText += data.content;
                                  setStreamingThinking(data.content);
                                  break;
                              }
                              case "chat_token": {
                                  // Accumulate, don't render yet — RAF will batch-flush
                                  pendingTokens += data.content;
                                  aiResponseText += data.content;
                                  scheduleFlush();
                                  break;
                              }
                              case "response": {
                                  flushPending();
                                  const chatOp = data.response?.operations?.find((op: any) => op.type === "chat_response");
                                  if (chatOp?.content && !aiResponseText.trim()) {
                                      setStreamingText(chatOp.content);
                                      aiResponseText += chatOp.content;
                                  }
                                  break;
                              }
                              case "done": {
                                  if (rafId !== null) {
                                      cancelAnimationFrame(rafId);
                                      rafId = null;
                                  }
                                  flushPending();
                                  break;
                              }
                              case "error": {
                                  flushPending();
                                  const errMsg = data.error || "⚠️ Something went wrong.";
                                  setStreamingText(errMsg);
                                  aiResponseText += errMsg;
                                  break;
                              }
                          }
                     } catch(e) {
                          console.error("Error parsing chunk", e);
                     }
                 }
             }
        }

    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            return;
        }
        console.error("Error in chat flow:", error);
        toast.error("Failed to send message");
    }finally{
        setActiveRequestController(null)
        setSendingMessage(false)
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === " " || e.code === "Space") {
      e.stopPropagation();
    }
  };
  const removeSelectedContext = (id: string) => {
    removeContext(id)
  }

  return (
    <form
      className="w-full shrink-0 bg-sidebar border-t p-1 rounded-b-2xl" 
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full flex justify-between">
        <div className="flex items-center gap-1 overflow-auto hide-scrollbar" style={{paddingBottom:4}}>
          {selectedContext.map((context, index) => (
           <div 
              key={index} 
              className="flex-none bg-accent rounded-lg h-20 relative overflow-hidden p-1"
              style={{
                maxWidth:"5rem"
              }}
            >
              <p className="text-xs break-words overflow-hidden pr-3 text-accent-foreground/80">
                {context.text.length > 50 ? context.text.slice(0, 50) + "..." : context.text}
              </p> 
              
              <Button 
                variant="ghost" 
                className="p-0 h-fit absolute top-0 right-0 hover:bg-background bg-background/80" 
                type="button" 
                onClick={() => removeSelectedContext(context.id)}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} />
              </Button>
            </div>
          ))}
        </div>
        <div className="h-full w-fit flex items-end justify-end gap-1">
          {workflowId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  key="build-mode-toggle"
                  type="button"
                  variant="ghost" 
                  size="icon"
                  className={isBuildMode ? "text-primary bg-primary/10" : "text-muted-foreground"}
                  onClick={() => setIsBuildMode(!isBuildMode)}
                >
                  <HugeiconsIcon icon={isBuildMode ? Layers01Icon : ZapIcon} size={18} strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="z-100">
                {isBuildMode ? "Build Mode: Step-by-Step" : "Instant Mode: Fast"}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={"ghost"} type="submit" disabled={sendingMessage}>
                <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="z-100">Send</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Textarea
        id="ai-chat-textarea"
        className="p-1 h-10 max-h-10"
        placeholder="Describe your thoughts..."
        rows={2}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
    </form>
  );
};
