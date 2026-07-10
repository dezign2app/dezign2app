"use client";

import React from "react";
import { useSubscriptionAccess } from "@/providers/subscription-access-context";
import { AlertCircle } from "lucide-react";

export const ReadOnlyBanner = () => {
  const { showPaywall } = useSubscriptionAccess();

  return (
    <div className="w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-200 px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium z-50">
      <AlertCircle className="w-4 h-4" />
      <span>Your subscription has expired. You are currently in view-only mode.</span>
      <button 
        onClick={() => showPaywall(true)}
        className="ml-2 text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1 rounded-md transition-colors"
      >
        Resubscribe
      </button>
    </div>
  );
};
