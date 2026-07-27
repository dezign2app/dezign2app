import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
import { Code2, Zap, Trash2 } from "lucide-react";
import type { StepNode, LangGraphCanvasNode } from "../types";
import { LocalInput } from "../../shared";

export const LangGraphCanvasStepNode = ({ id, data, selected }: NodeProps<StepNode>) => {
  const stepType = data.stepType || "custom_code";
  const Icon = Code2;
  const { setNodes } = useReactFlow<LangGraphCanvasNode>();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.label || "Node");

  useEffect(() => {
    setNameValue(data.label || "Node");
  }, [data.label]);

  const handleNameSave = () => {
    setIsEditingName(false);
    const trimmed = nameValue.trim() || "Node";
    setNameValue(trimmed);
    if (trimmed !== data.label) {
      setNodes((nds) => nds.map((n) => (n.id === id && n.type === "step" ? { ...n, data: { ...n.data, label: trimmed } } : n)));
    }
  };

  const stateUpdates = data.stateUpdates || [];
  const availableFields = (data.availableStateChannels || []).map((c) => c.key);

  return (
    <div
      className={`rounded-xl bg-card/95 backdrop-blur-md border-2 min-w-[220px] max-w-[280px] p-3 flex flex-col gap-2 transition-all duration-200 shadow-xl relative group ${
        selected ? "border-primary ring-4 ring-primary/20 shadow-primary/10" : "border-border hover:border-border/80"
      }`}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <Handle type="target" position={Position.Left} id="in"
        className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform" />

      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-secondary text-foreground shrink-0">
            <Icon className="w-4 h-4" />
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
                  className="h-6 text-xs bg-background p-1 font-bold flex-1 nodrag"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") {
                      setNameValue(data.label || "Node");
                      setIsEditingName(false);
                    }
                  }}
                />
              </div>
            ) : (
              <span
                className="font-bold text-xs text-foreground truncate max-w-[130px] cursor-pointer hover:text-primary transition-colors nodrag"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                title="Click or double click to rename node"
              >
                {data.label || "Node"}
              </span>
            )}
            <span className="text-[9px] font-mono text-muted-foreground">{data.stepId}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono border border-border/40">
            Node
          </span>
          {data.onDeleteStep && (
            <button
              type="button"
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 nodrag"
              onClick={(e) => {
                e.stopPropagation();
                data.onDeleteStep?.();
              }}
              title="Delete Node"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {data.modelConfig && (
        <div className="text-[10px] font-mono text-muted-foreground/90 bg-secondary/40 px-2 py-1 rounded border border-border/40 truncate">
          {data.modelConfig.provider}:{data.modelConfig.model}
        </div>
      )}

      {/* State Channel Updates Section */}
      <div className="flex flex-col gap-1.5 border-t border-border/50 pt-2 mt-0.5 nodrag">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> State Updates
          </span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {stateUpdates.length}
          </span>
        </div>

        {stateUpdates.length > 0 ? (
          <div className="flex flex-col gap-1">
            {stateUpdates.map((su, idx) => {
              const matchedChannel = (data.availableStateChannels || []).find((c) => c.key === su.channelKey);
              return (
                <div key={idx} className="flex flex-col gap-0.5 bg-amber-500/10 px-2 py-1 rounded text-[10px] font-mono border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold truncate max-w-[120px]">{su.channelKey}</span>
                    <span className="text-[9px] text-muted-foreground uppercase px-1 rounded bg-secondary/50 font-semibold">{su.mode || "set"}</span>
                  </div>
                  {su.value ? (
                    <span className="text-[9px] text-muted-foreground/90 truncate font-mono">{su.value}</span>
                  ) : (
                    matchedChannel && <span className="text-[9px] text-muted-foreground/70 font-mono">type: {matchedChannel.type}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-1 bg-secondary/20 p-1.5 rounded border border-border/30">
            <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
              <span className="font-bold text-foreground">Graph Fields:</span>
              <span className="truncate max-w-[140px]">
                {availableFields.length > 0 ? availableFields.join(", ") : "none"}
              </span>
            </span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} id="out"
        className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform" />
    </div>
  );
};
