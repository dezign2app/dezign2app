"use client";

import { useEffect, useRef } from "react";
import { useRealtime } from "@upstash/realtime/client";
import { useChatStore, RESET_STREAMING_TEXT } from "./chat-store";

export const useChatSync = (conversationId: string | null) => {
  const { 
    setStreamingText, 
    setStreamingThinking,
    sendingMessage,
    resetStreamingState,
  } = useChatStore();

  const processedChunks = useRef<Set<string>>(new Set());

  useEffect(() => {
    resetStreamingState();
    processedChunks.current.clear();
  }, [conversationId, resetStreamingState]);

  useEffect(() => {
    if (!conversationId || sendingMessage) return;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_WORKFLOW_ENGINE_BASE_URL}/ai/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });

        if (!response.ok) {
          let errorMessage = "";
          try {
            const data = await response.json();
            errorMessage = data.message || data.error || "";
          } catch (e) {
            // Ignore parse errors
          }
          setStreamingText(RESET_STREAMING_TEXT);
          setStreamingText(errorMessage ? `⚠️ ${errorMessage}` : "⚠️ Connection error. Please try again later.");
          return;
        }

        const { history } = await response.json();
        
        setStreamingText(RESET_STREAMING_TEXT); // Clear first
        setStreamingThinking(RESET_STREAMING_TEXT); // Clear thinking too
        history.forEach((payload: any) => {
          const chunkId = payload._idx !== undefined ? `idx-${payload._idx}` : JSON.stringify(payload);
          if (!processedChunks.current.has(chunkId)) {
            applyPayload(payload);
            processedChunks.current.add(chunkId);
          }
        });
      } catch (err) {
        console.error("Failed to fetch stream history:", err);
      }
    };

    fetchHistory();
  }, [conversationId, sendingMessage, setStreamingText, setStreamingThinking]);

  const applyPayload = (payload: any) => {
    if (payload.type === "thinking") {
      setStreamingThinking(payload.content);
    } else if (payload.type === "chat_token") {
      setStreamingText(payload.content);
    } else if (payload.type === "error") {
      setStreamingText(payload.error || "⚠️ Something went wrong.");
    } else if (payload.type === "done") {
        setStreamingText(RESET_STREAMING_TEXT);
        setStreamingThinking(RESET_STREAMING_TEXT);
    }
  };

  useRealtime({
    channels: conversationId ? [`agent:realtime:${conversationId}`] : [],
    events: ["message"],
    enabled: !!conversationId && !sendingMessage,
    onData: (data: any) => {
      const content = data.data;
      if (!content) return;

      try {
        const payload = typeof content === "string" ? JSON.parse(content) : content;
        const chunkId = payload._idx !== undefined ? `idx-${payload._idx}` : JSON.stringify(payload);
        
        if (!processedChunks.current.has(chunkId)) {
          applyPayload(payload);
          processedChunks.current.add(chunkId);
        }
      } catch (e) {
        console.error("Failed to parse payload", e);
      }
    }
  });
};
