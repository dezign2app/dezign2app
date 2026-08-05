import React from "react";
import { Wrench, Trash2 } from "lucide-react";

interface ToolNodeHeaderProps {
  name?: string;
  toolId?: string;
  onDeleteTool: () => void;
}

export function ToolNodeHeader({
  name,
  toolId,
  onDeleteTool,
}: ToolNodeHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground font-mono truncate max-w-[150px]">
              {name || "Tool Node"}
            </h2>
            <p className="text-[10px] font-mono text-muted-foreground opacity-70">
              {toolId}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          onClick={onDeleteTool}
          title="Delete Tool Node"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
