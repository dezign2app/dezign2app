import React, { Fragment, useEffect } from "react";
import { SentMessage } from "./sent-message";
import { ReceivedMessage } from "./received-message";
import { Doc } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { Conversation, ConversationContent, ConversationScrollButton } from "@workspace/ui/components/ai-elements/conversation";
import { useChatStore, RESET_STREAMING_TEXT } from "./chat-store";

export const ChatBody = ({
  messages,
  loadMore,
  status,
}: {
  messages: Doc<"messages">[];
  loadMore: (numItems: number) => void;
  status: string;
}) => {
  const { 
    streamingText, 
    streamingThinking, 
    sendingMessage, 
    streamingId, 
    setStreamingId,
    setStreamingText,
    setStreamingThinking
  } = useChatStore();

  // Robust Hand-off: Clear streaming state as soon as the persisted message arrives in Convex
  useEffect(() => {
    if (!streamingId || messages.length === 0) return;

    const persistedMessageFound = messages.some(
      (m) => (m as any).clientMessageId === streamingId && m.role === "AI"
    );

    if (persistedMessageFound) {
      setStreamingId(null);
      setStreamingText(RESET_STREAMING_TEXT);
      setStreamingThinking(RESET_STREAMING_TEXT);
    }
  }, [messages, streamingId, setStreamingId, setStreamingText, setStreamingThinking]);

  const renderMessageContent = (
    content: string,
    isLatest: boolean,
    role: string,
    id: string,
    thinking?: string,
  ) => {

    return (
      <Fragment key={id}>
        {role === "AI" && content && (
          <ReceivedMessage
            message={content}
            thinking={thinking}
            defaultReasoningOpen={isLatest && !!thinking}
          />
        )}
        {role === "USER" && content && (
          <SentMessage message={content} />
        )}
      </Fragment>
    );
  };

  return (
    <Conversation className="flex-1 border-t w-full">
      <ConversationContent className="pl-0 pr-3.5 pt-1 gap-4 w-full">
        {status === "CanLoadMore" && (
          <div className="w-full flex justify-center pb-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => loadMore(10)}
            >
              Load previous messages
            </Button>
          </div>
        )}

        {status === "LoadingMore" && (
          <div className="w-full text-center text-xs text-muted-foreground pb-4 py-1.5">
            Loading...
          </div>
        )}
         {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <div className="text-muted-foreground text-xs">Start conversation</div>
            </div>
          )}

        <div className="flex flex-col gap-3 w-full pb-8">
            {messages.map(({ content, role, thinking, _id }, index) => {
                const isLatest = index === messages.length - 1 && !streamingText;
                return renderMessageContent(content, isLatest, role, _id, thinking);
            })}

            {(() => {
                const lastMessage = messages[messages.length - 1];
                const lastIsAI = lastMessage?.role === "AI";
                
                // Stable ID Sync: Only show streaming block if it holds content 
                // AND we haven't seen its persisted counterpart yet
                const isStreamActive = streamingText || streamingThinking;
                
                // If streamingId is null, checking lastIsAI prevents trailing chunks from resurrecting the stream
                // since Convex has already synced the final AI message making lastIsAI true.
                const hasCounterpart = streamingId 
                    ? messages.some(m => (m as any).clientMessageId === streamingId && m.role === "AI") 
                    : lastIsAI;

                return (
                  <Fragment>
                    {/* Live streaming thinking block — shown while AI is thinking, before chat tokens arrive */}
                    {streamingThinking && !hasCounterpart && (
                      <details className="group max-w-[90%] bg-muted/40 border border-border/60 rounded-xl overflow-hidden text-xs" open>
                        <summary className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer select-none list-none text-muted-foreground hover:text-foreground transition-colors">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse group-open:animate-none" />
                          <span className="font-medium">Reasoning...</span>
                          <svg
                            className="ml-auto w-3 h-3 transition-transform group-open:rotate-180"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          >
                            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </summary>
                        <div 
                          className="px-3 py-2 border-t border-border/40 text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap h-48 overflow-y-auto scroll-smooth"
                          ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
                        >
                          {streamingThinking}
                        </div>
                      </details>
                    )}

                    {isStreamActive && !hasCounterpart && !lastIsAI && (
                        renderMessageContent(streamingText, true, "AI", "streaming")
                    )}
                  </Fragment>
                );
            })()}
            
            {(sendingMessage && !streamingText && !streamingThinking) && (
                <div className="text-xs text-muted-foreground italic mt-1">
                    Generating...
                </div>
            )}
        </div>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};
