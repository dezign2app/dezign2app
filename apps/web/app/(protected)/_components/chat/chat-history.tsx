
import { useQuery, useMutation } from "convex/react";
import React, { useState } from "react";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { MessageProgrammingIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import { useChatStore } from "./chat-store";
import { Id } from "@workspace/backend/_generated/dataModel";

export const ChatHistory = () => {
  const conversations = useQuery(api.ai.conversations.listConversations,{orgId:"personal"});
  const deleteConversation = useMutation(api.ai.conversations.deleteConversation);
  const {
    conversationId,
    setConversationId,
    setShowHistory,
    resetStreamingState,
    abortActiveRequest,
  } = useChatStore();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      if (conversationId === id) {
        abortActiveRequest();
        resetStreamingState();
      }

      await deleteConversation({ conversationId: id as Id<"conversations"> });
      if (conversationId === id) {
        setConversationId(null);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  if (!conversations) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Loading history...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <HugeiconsIcon icon={MessageProgrammingIcon} size={32} />
        <p>No conversation history</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto h-full">
      {conversations.map((conversation) => (
        <div
          key={conversation._id}
          className="w-full relative group flex items-start gap-1 p-3 border border-border/50 hover:bg-accent/50 rounded-md cursor-pointer transition-colors"
          onClick={() => {
            if (conversationId !== conversation._id) {
              abortActiveRequest();
              resetStreamingState();
            }
            setConversationId(conversation._id);
            setShowHistory(false);
          }}
        >
          <div className="flex flex-col flex-1 min-w-0 pr-8">
            <span className="font-medium truncate w-full text-left">
              {conversation.title || "Untitled Conversation"}
            </span>
            <span className="text-xs text-muted-foreground text-left">
              {formatDistanceToNow(conversation._creationTime, {
                addSuffix: true,
              })}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
            disabled={isDeleting === conversation._id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(conversation._id);
            }}
          >
            {isDeleting === conversation._id ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};
