import React from "react";
import { Sparkles, Code2 } from "lucide-react";
import { LogicMode } from "../types";

interface ModeSelectorProps {
  activeMode: LogicMode;
  onModeSwitch: (mode: LogicMode) => void;
}

export function ModeSelector({ activeMode, onModeSwitch }: ModeSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-2 bg-background/60 p-1 rounded-lg border border-border/50">
      <div className="flex items-center gap-1 w-full">
        <button
          type="button"
          onClick={() => onModeSwitch("natural_language")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all ${
            activeMode === "natural_language"
              ? "bg-secondary text-foreground shadow-sm font-semibold border border-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Natural Language</span>
        </button>

        <button
          type="button"
          onClick={() => onModeSwitch("code")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium transition-all ${
            activeMode === "code"
              ? "bg-secondary text-foreground shadow-sm font-semibold border border-border/50"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code</span>
        </button>
      </div>
    </div>
  );
}
