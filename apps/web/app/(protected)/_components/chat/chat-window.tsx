"use client";
import React, { useState, useEffect } from "react";
import { ChatHeader } from "./chat-header";
import { ChatBody } from "./chat-body";
import { ChatFooter } from "./chat-footer";
import { cn } from "@workspace/ui/lib/utils";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { usePaginatedQuery } from "convex/react";
import { ChatHistory } from "./chat-history";
import { Resizable } from 're-resizable';
import { useChatStore } from "./chat-store";
import { useChatSync } from "./use-chat-sync";

interface ChatWindowProps {
  onClose?: () => void;
}


export const ChatWindow = ({ onClose }: ChatWindowProps) => {
  const [position, setPosition] = useState({
    x: innerWidth * 0.65,
    y: innerHeight * 0.2,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { conversationId, showHistory } = useChatStore();

  // Handle synchronization with AI agent Redis stream on mount/refresh
  useChatSync(conversationId);

  const { results, status, loadMore } = usePaginatedQuery(
    api.ai.messages.listMessages,
    conversationId ? { conversationId: conversationId as Id<"conversations"> } : "skip",
    { initialNumItems: 10 }
  );

  const messages = [...results].reverse();

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Calculate new position using dragStart offset
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Get window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const cardWidth = 330;
        const cardHeight = 490;

        // Constrain to viewport bounds
        const constrainedX = Math.max(
          0,
          Math.min(newX, windowWidth - cardWidth)
        );
        const constrainedY = Math.max(
          0,
          Math.min(newY, windowHeight - cardHeight)
        );

        setPosition({ x: constrainedX, y: constrainedY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const [size, setSize] = useState({ width: 320, height: 480 });

  return (
    <div
      className={cn(
        "z-50 absolute flex flex-col items-center justify-center overflow-hidden",
        isDragging && "select-none"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: size.width,
        height: size.height,
      }}
    >
      <Resizable
        size={{ width: size.width, height: size.height }}
        onResizeStop={(e, direction, ref, d) => {
          setSize({
            width: size.width + d.width,
            height: size.height + d.height,
          });
        }}
        minWidth={300}
        minHeight={400}
        maxWidth={800}
        maxHeight={700}
        className="flex flex-col border h-full w-full bg-sidebar rounded-xl shadow-2xl"
      >
        <ChatHeader onMouseDown={handleMouseDown} onClose={onClose} />
        {showHistory ? (
          <ChatHistory />
        ) : (
          <>
            <ChatBody messages={messages ?? []} loadMore={loadMore} status={status} />
            <ChatFooter conversationId={conversationId ?? ""} />
          </>
        )}
      </Resizable>
    </div>
  );
};
