"use client";
import { useChatStore } from "./chat-store";
import { ChatWindow } from "./chat-window";

export const ChatContainer = () => {
  const { showAIPopup, setShowAIPopup } = useChatStore();

  if (!showAIPopup) return null;

  return <ChatWindow onClose={() => setShowAIPopup(false)} />;
};
