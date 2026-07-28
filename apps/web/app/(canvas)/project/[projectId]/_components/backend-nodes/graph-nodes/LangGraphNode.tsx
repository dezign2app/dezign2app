import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
import {
  Network, ShieldCheck, Sparkles, ExternalLink, Trash2, Pencil,
} from "lucide-react";
import type { BackendNode, LangGraphStepConfig, LangGraphStateChannel } from "@/types/canvas";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { LocalInput } from "./shared";
import { LangGraphCanvasModal } from "./LangGraphCanvasModal";

export const LangGraphNode = ({ id, data, selected }: NodeProps<BackendNode>) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const deleteNode = useBackendCanvasStore((s) => s.deleteNode);
  const [editorOpen, setEditorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(data.label === "" || data.label === "Untitled");
  const [name, setName] = useState(data.label || "LangGraph Agent");
  const { setNodes } = useReactFlow<BackendNode>();

  useEffect(() => {
    setName(data.label || "LangGraph Agent");
  }, [data.label]);

  const handleSaveName = () => {
    const finalName = name.trim() || "LangGraph Agent";
    setName(finalName);
    updateNode(id, { data: { ...data, label: finalName } });
    setIsEditing(false);
  };

  const handleOpenEditor = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNodes((nds: BackendNode[]) => nds.map((n: BackendNode) => (n.selected ? { ...n, selected: false } : n)));
    setEditorOpen(true);
  };

  const inputChannels = data.inputChannels || [];
  const stateChannels = data.stateChannels || [];
  const graphSteps = data.graphSteps || [];
  const memoryConfig = data.memoryConfig || { checkpointer: "convex", threadScope: "session", autoSummarize: true, maxWindowMessages: 10 };

  return (
    <>
      <div
        className={cn(
          "rounded-2xl bg-card/95 backdrop-blur-xl border-2 w-[340px] flex flex-col transition-all duration-300 relative shadow-2xl group",
          selected
            ? "border-primary ring-4 ring-primary/20 shadow-primary/10"
            : "border-border hover:border-border/80"
        )}
        onDoubleClick={handleOpenEditor}
      >
        {/* Main Entry Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="input-start"
          className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform"
        />

        {/* Main Exit Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="output-end"
          className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-border/60 rounded-t-2xl">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              {isEditing ? (
                <div
                  className="nodrag"
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <LocalInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-6 text-xs px-1 bg-background/80 font-semibold flex-1 nodrag"
                    autoFocus
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") {
                        setName(data.label || "LangGraph Agent");
                        setIsEditing(false);
                      }
                    }}
                    onBlur={handleSaveName}
                  />
                </div>
              ) : (
                <div
                  className="flex flex-col cursor-pointer flex-1 min-w-0 nodrag group/title"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  title="Click to edit name"
                >
                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-70 truncate text-muted-foreground">
                    LangGraph Agent
                  </span>
                  <span className="font-semibold text-sm truncate text-foreground group-hover/title:text-primary transition-colors">
                    {data.label || "LangGraph Agent"}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">{inputChannels.length} inputs · {graphSteps.length} steps · {stateChannels.length} state fields</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary nodrag"
              onClick={handleOpenEditor}
              title="Open LangGraph Studio"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 nodrag"
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(id);
              }}
              title="Delete Node"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>


        {/* Summary Preview */}
        <div className="p-3 flex flex-col gap-2 nodrag">
          {/* State schema preview */}
          <div className="flex flex-col gap-1 bg-[#006ddd]/10 p-2 rounded-xl border border-[#006ddd]/30">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#006ddd]">
              <span>GRAPH STATE SCHEMA</span>
              <span className="font-mono">{stateChannels.length} fields</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {stateChannels.slice(0, 3).map((ch: LangGraphStateChannel) => (
                <span key={ch.key} className="text-[9px] px-1.5 py-0.5 rounded bg-[#006ddd]/15 text-[#006ddd] font-mono border border-[#006ddd]/30 font-semibold">
                  {ch.key}
                </span>
              ))}
              {stateChannels.length > 3 && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                  +{stateChannels.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Steps mini-list */}
          <div className="flex flex-wrap gap-1.5">
            {graphSteps.slice(0, 4).map((step: LangGraphStepConfig) => {
              const hasUpdates = Boolean(step.stateUpdates && step.stateUpdates.length > 0);
              return (
                <span
                  key={step.id}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-md border font-mono flex items-center gap-1",
                    hasUpdates
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-secondary text-foreground border-border/50"
                  )}
                >
                  {step.name || step.id}
                  {hasUpdates && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                </span>
              );
            })}
            {graphSteps.length > 4 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/40 text-muted-foreground border border-border/50 font-mono">
                +{graphSteps.length - 4} more
              </span>
            )}
          </div>

          {/* Memory badge */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground border border-border/40 font-mono">
              {memoryConfig.checkpointer || "convex"}
            </span>
            <span>checkpointer</span>
            {memoryConfig.autoSummarize && (
              <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border/40 font-mono">auto-summarize</span>
            )}
          </div>

          {/* Open Editor Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs font-semibold border-border hover:bg-secondary gap-2 mt-1 transition-all"
            onClick={handleOpenEditor}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Open LangGraph Studio
            <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* LangGraph Canvas Modal */}
      <LangGraphCanvasModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        nodeId={id}
      />
    </>
  );
};
