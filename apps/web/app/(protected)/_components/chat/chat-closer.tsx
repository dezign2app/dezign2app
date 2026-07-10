"use client";
import { useEffect } from "react";
import { useChatStore } from "./chat-store";

export const ChatCloser = () => {
  const { setShowAIPopup } = useChatStore();

  useEffect(() => {
    return () => {
      setShowAIPopup(false);
    };
  }, [setShowAIPopup]);

  return null;
};
