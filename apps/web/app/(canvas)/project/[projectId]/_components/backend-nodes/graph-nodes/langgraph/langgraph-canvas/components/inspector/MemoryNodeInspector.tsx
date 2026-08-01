import React from "react";
import {
  Database,
  Trash2,
  HardDrive,
  Key,
  Layers,
  Sparkles,
  MessageSquare,
  Sliders,
} from "lucide-react";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import type { MemoryNodeData } from "../../types";
import { LocalInput } from "../../../../common/shared";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { useShallow } from "zustand/react/shallow";

interface MemoryNodeInspectorProps {
  selectedMemoryData: MemoryNodeData;
  onDeleteMemory: () => void;
  onUpdateMemory: (changes: Partial<MemoryNodeData>) => void;
}

export function MemoryNodeInspector({
  selectedMemoryData,
  onDeleteMemory,
  onUpdateMemory,
}: MemoryNodeInspectorProps) {
  const entities = useBackendCanvasStore(
    useShallow((s) =>
      s.nodes.filter(
        (n) => n?.type === "entity" && n.data?.dbType !== "vector",
      ),
    ),
  );
  const checkpointer = selectedMemoryData.checkpointer || "memory";
  const threadIdKey = selectedMemoryData.threadIdKey || "thread_id";
  const threadScope = selectedMemoryData.threadScope || "session";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground font-mono truncate max-w-[170px]">
                {selectedMemoryData.name ||
                  selectedMemoryData.label ||
                  "Memory Saver"}
              </h2>
              <p className="text-[10px] font-mono text-muted-foreground opacity-70">
                {selectedMemoryData.memoryId || selectedMemoryData.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            onClick={onDeleteMemory}
            title="Delete Memory Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Identity & Basic Config */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Memory Configuration
          </h3>
        </div>

        {/* Memory Name */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">
            Node Label / Name
          </Label>
          <LocalInput
            value={selectedMemoryData.name || selectedMemoryData.label || ""}
            onChange={(e) =>
              onUpdateMemory({ name: e.target.value, label: e.target.value })
            }
            className="h-7 text-xs font-mono bg-background"
            placeholder="session_memory_db"
          />
        </div>

        {/* Checkpointer Engine */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Checkpointer Engine
          </Label>
          <Select
            value={checkpointer}
            onValueChange={(val: string) =>
              onUpdateMemory({ checkpointer: val })
            }
          >
            <SelectTrigger className="h-7 text-xs bg-background font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="memory">In-Memory (MemorySaver)</SelectItem>
              {entities.map((e) => (
                <SelectItem key={e.id} value={e.data?.label || e.id}>
                  {e.data?.label || "Untitled Table"} (Schema Entity)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Persists state snapshots and message history across turns for
            agents.
          </p>
        </div>
      </div>

      {/* Session & Thread ID Config */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Session & Thread Key
          </h3>
        </div>

        {/* Thread / Session ID Key Field */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">
            Session / Thread Identifier Key
          </Label>
          <LocalInput
            value={threadIdKey}
            onChange={(e) => onUpdateMemory({ threadIdKey: e.target.value })}
            className="h-7 text-xs font-mono bg-background"
            placeholder="thread_id"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {["thread_id", "session_id", "user_id", "chat_id"].map(
              (keyName) => (
                <button
                  key={keyName}
                  type="button"
                  onClick={() => onUpdateMemory({ threadIdKey: keyName })}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    threadIdKey === keyName
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-300 font-bold"
                      : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  {keyName}
                </button>
              ),
            )}
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight font-mono">
            Key used in runtime graph execution:{" "}
            <code className="text-foreground">{`configurable: { ${threadIdKey || "thread_id"}: "..." }`}</code>
          </p>
        </div>

        {/* Thread Scope */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
            Thread Persistence Scope
          </Label>
          <Select
            value={threadScope}
            onValueChange={(val: "session" | "user" | "global") =>
              onUpdateMemory({ threadScope: val })
            }
          >
            <SelectTrigger className="h-7 text-xs bg-background font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="session">
                Session Level (Unique per chat session)
              </SelectItem>
              <SelectItem value="user">
                User Level (Persists across user login sessions)
              </SelectItem>
              <SelectItem value="global">
                Global Level (Shared across all agent runs)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History Window & Summarization Options */}
      <div className="flex flex-col gap-4 p-3 bg-secondary/10 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            History Window & Limits
          </h3>
        </div>

        {/* Auto Summarize */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/40">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">
              Auto-Summarization
            </span>
            <span className="text-[10px] text-muted-foreground">
              Compress older messages to save LLM context window
            </span>
          </div>
          <Switch
            checked={selectedMemoryData.autoSummarize ?? true}
            onCheckedChange={(c) => onUpdateMemory({ autoSummarize: c })}
          />
        </div>

        {/* Max Window Messages */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold text-foreground">
            Max Window Messages
          </Label>
          <LocalInput
            type="number"
            value={selectedMemoryData.maxWindowMessages ?? 10}
            onChange={(e) =>
              onUpdateMemory({
                maxWindowMessages: parseInt(e.target.value, 10) || 10,
              })
            }
            className="h-7 text-xs font-mono bg-background"
            placeholder="10"
          />
          <p className="text-[10px] text-muted-foreground">
            Maximum recent messages retained before summarizing or trimming.
          </p>
        </div>

        {/* Save Messages Flag */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-background/60 border border-border/40">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">
              Save Message History
            </span>
            <span className="text-[10px] text-muted-foreground">
              Store full turn-by-turn chat history to database
            </span>
          </div>
          <Switch
            checked={selectedMemoryData.saveMessages ?? true}
            onCheckedChange={(c) => onUpdateMemory({ saveMessages: c })}
          />
        </div>
      </div>
    </div>
  );
}
