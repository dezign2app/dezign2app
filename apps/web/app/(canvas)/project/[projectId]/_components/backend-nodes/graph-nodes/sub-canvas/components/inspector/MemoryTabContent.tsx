import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { TabsContent } from "@workspace/ui/components/tabs";
import type { LangGraphMemoryConfig } from "@/types/canvas";

interface MemoryTabContentProps {
  memoryConfig: LangGraphMemoryConfig;
  setMemoryConfig: React.Dispatch<React.SetStateAction<LangGraphMemoryConfig>>;
}

export function MemoryTabContent({
  memoryConfig,
  setMemoryConfig,
}: MemoryTabContentProps) {
  return (
    <TabsContent
      value="memory"
      className="flex-1 min-h-0 p-4 overflow-y-auto m-0 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Checkpointer
        </span>
        <Select
          value={memoryConfig.checkpointer || "convex"}
          onValueChange={(v: string) =>
            setMemoryConfig({
              ...memoryConfig,
              checkpointer: v as LangGraphMemoryConfig["checkpointer"],
            })
          }
        >
          <SelectTrigger className="h-8 text-xs bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="convex">Convex DB</SelectItem>
            <SelectItem value="redis">Redis</SelectItem>
            <SelectItem value="postgres">PostgreSQL</SelectItem>
            <SelectItem value="memory">In-Memory</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          Persistence engine for graph checkpointing.
        </span>
      </div>

      <div className="flex items-center justify-between rounded-xl border bg-card/50 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">Auto-Summarize</span>
          <span className="text-xs text-muted-foreground">Compress history to save tokens</span>
        </div>
        <Switch
          checked={memoryConfig.autoSummarize ?? true}
          onCheckedChange={(c) => setMemoryConfig({ ...memoryConfig, autoSummarize: c })}
        />
      </div>
    </TabsContent>
  );
}
