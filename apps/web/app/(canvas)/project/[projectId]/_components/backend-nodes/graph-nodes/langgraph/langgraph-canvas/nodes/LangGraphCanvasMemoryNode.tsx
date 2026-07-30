import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
import { Database, Trash2, HardDrive, Key, Layers } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import type { MemoryNode, LangGraphCanvasNode } from "../types";
import { LANGGRAPH_CANVAS_NODE_MEMORY, HANDLE_MEMORY_OUT } from "../constants";
import { LocalInput } from "../../../common/shared";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { useShallow } from "zustand/react/shallow";

export const LangGraphCanvasMemoryNode = ({ id, data, selected }: NodeProps<MemoryNode>) => {
  const { setNodes } = useReactFlow<LangGraphCanvasNode>();
  const entities = useBackendCanvasStore(useShallow((s) => s.nodes.filter((n) => n?.type === "entity" && n.data?.dbType !== "vector")));
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.name || data.label || "Memory Saver");

  useEffect(() => {
    setNameValue(data.name || data.label || "Memory Saver");
  }, [data.name, data.label]);

  const updateMemoryData = (changes: Partial<typeof data>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id && n.type === LANGGRAPH_CANVAS_NODE_MEMORY ? { ...n, data: { ...n.data, ...changes } } : n))
    );
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    let trimmed = nameValue.trim();
    if (!trimmed) trimmed = "Memory Saver";
    setNameValue(trimmed);
    if (trimmed !== data.name) {
      updateMemoryData({ name: trimmed, label: trimmed });
    }
  };

  const checkpointerType = data.checkpointer || "memory";
  const threadIdKey = data.threadIdKey || "thread_id";

  return (
    <div
      className={`rounded-xl bg-card border-2 min-w-[290px] max-w-[380px] flex flex-col transition-all duration-200 shadow-md relative group ${
        selected
          ? "border-amber-500 ring-2 ring-amber-500/20 shadow-amber-500/10"
          : "border-border hover:border-amber-500/40 hover:shadow-amber-500/5"
      }`}
    >
      {/* Connector Handle to Agent Node */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={HANDLE_MEMORY_OUT}
        style={{ left: "50%" }}
        className="!bg-amber-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-bottom-[7px]"
        title="Connect to Agent Node (memory_in)"
      />

      {/* Execution Flow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!bg-foreground !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
        title="Input Flow"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!bg-foreground !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-right-[7px]"
        title="Output Flow"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-t-xl">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-500 shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            {isEditingName ? (
              <div
                className="nodrag"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <LocalInput
                  autoFocus
                  className="h-6 text-xs bg-background p-1 font-bold font-mono text-amber-500 flex-1 nodrag"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") {
                      setNameValue(data.name || "Memory Saver");
                      setIsEditingName(false);
                    }
                  }}
                />
              </div>
            ) : (
              <span
                className="font-bold text-sm text-foreground truncate max-w-[170px] font-mono cursor-pointer hover:text-amber-500 transition-colors nodrag flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                title="Click to edit Memory Saver name"
              >
                {data.name || data.label || "Memory Saver"}
              </span>
            )}
            <span className="text-[10px] text-amber-500 font-mono font-medium flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              Checkpointer Node
            </span>
          </div>
        </div>

        {data.onDeleteMemory && (
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 nodrag"
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteMemory?.();
            }}
            title="Delete Memory Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-3">
        {/* Checkpointer Engine Selection */}
        <div className="flex flex-col gap-1 nodrag">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-500" />
            Checkpointer Saver Engine
          </span>
          <div
            className="nodrag"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Select
              value={checkpointerType}
              onValueChange={(val: string) => updateMemoryData({ checkpointer: val })}
            >
              <SelectTrigger className="h-7 text-xs bg-secondary/30 font-mono">
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
          </div>
        </div>

        {/* Thread / Session ID Field */}
        <div className="flex flex-col gap-1 nodrag">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <Key className="w-3 h-3 text-amber-500" />
            Session / Thread ID Key
          </span>
          <LocalInput
            className="h-7 text-xs bg-secondary/30 border border-border/50 p-1.5 rounded font-mono nodrag"
            placeholder="thread_id"
            value={threadIdKey}
            onChange={(e) => updateMemoryData({ threadIdKey: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <span className="text-[9px] text-muted-foreground font-mono">
            configurable: {`{ ${threadIdKey || "thread_id"}: "..." }`}
          </span>
        </div>

        {/* Auto Summarization */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/50 nodrag">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Auto-Summarize</span>
            <span className="text-[9px] text-muted-foreground">Compress past messages</span>
          </div>
          <div
            className="nodrag"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Switch
              checked={data.autoSummarize ?? true}
              onCheckedChange={(c) => updateMemoryData({ autoSummarize: c })}
              className="scale-80 origin-right"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
