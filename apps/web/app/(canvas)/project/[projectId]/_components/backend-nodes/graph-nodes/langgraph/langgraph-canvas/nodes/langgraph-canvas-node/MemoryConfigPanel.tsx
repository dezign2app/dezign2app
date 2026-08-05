import React from "react";
import { Database } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import type { Edge } from "@xyflow/react";
import type { LangGraphAgentMemoryConfig } from "@workspace/canvas";

interface MemoryConfigPanelProps {
  memoryConfig: LangGraphAgentMemoryConfig;
  boundMemories: Edge[];
  handleToggleMemory: (enabled: boolean) => void;
}

export const MemoryConfigPanel: React.FC<MemoryConfigPanelProps> = ({
  memoryConfig,
  boundMemories,
  handleToggleMemory,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-950/10 dark:bg-amber-950/20 border border-amber-500/30 nodrag">
      <div className="flex items-center gap-1.5 min-w-0">
        <div
          className={`p-1 rounded shrink-0 ${memoryConfig.enabled !== false ? "bg-amber-500/20 text-amber-500" : "bg-muted/30 text-muted-foreground"}`}
        >
          <Database className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
            Memory & Checkpointer
            {boundMemories.length > 0 ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-semibold shrink-0">
                Node Connected
              </span>
            ) : memoryConfig.enabled !== false ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-semibold shrink-0">
                Active
              </span>
            ) : null}
          </span>
          <span className="text-[9px] text-muted-foreground font-mono truncate">
            {memoryConfig.enabled !== false
              ? "Checkpointing enabled"
              : "Checkpointing disabled"}
          </span>
        </div>
      </div>

      <div
        className="nodrag shrink-0"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Switch
          checked={memoryConfig.enabled !== false}
          onCheckedChange={handleToggleMemory}
          className="scale-90"
        />
      </div>
    </div>
  );
};
