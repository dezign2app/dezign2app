import React from "react";
import { Network, Save, ArrowLeft, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

import { LocalInput } from "../../shared";

interface LangGraphCanvasHeaderProps {
  label?: string;
  onUpdateLabel?: (label: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function LangGraphCanvasHeader({ label, onUpdateLabel, onSave, onClose }: LangGraphCanvasHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="p-2 rounded-xl bg-secondary text-foreground border border-border">
          <Network className="w-4 h-4" />
        </div>
        {onUpdateLabel ? (
          <LocalInput
            className="h-8 text-base font-bold bg-transparent border-none shadow-none focus-visible:ring-1 focus-visible:ring-ring text-foreground w-[240px] px-1 hover:bg-secondary/40 rounded transition-colors"
            value={label || "LangGraph Agent"}
            onChange={(e) => onUpdateLabel(e.target.value)}
          />
        ) : (
          <span className="font-bold text-base text-foreground tracking-wide">
            {label || "LangGraph Agent Canvas"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="default" size="sm" className="h-8 font-semibold gap-1.5 px-4" onClick={onSave}>
          <Save className="w-4 h-4" /> Save & Apply
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
