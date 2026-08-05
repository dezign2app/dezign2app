import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
import { Radio, Zap, Plug, Globe, Trash2 } from "lucide-react";
import type { OutputNode, LangGraphCanvasNode } from "@workspace/canvas";
import { LANGGRAPH_CANVAS_NODE_OUTPUT } from "../constants";

const TRANSPORT_BADGES = {
  sse: {
    label: "SSE Stream",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: Radio,
  },
  websocket: {
    label: "WebSocket Push",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: Plug,
  },
  event: {
    label: "Event Publisher",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: Zap,
  },
  webhook: {
    label: "Webhook Dispatcher",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: Globe,
  },
  rest: {
    label: "REST Response",
    color: "bg-secondary text-foreground border-border/50",
    icon: Radio,
  },
};

export const LangGraphCanvasOutputNode = ({
  id,
  data,
  selected,
}: NodeProps<OutputNode>) => {
  const { setNodes } = useReactFlow<LangGraphCanvasNode>();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(
    data.name || data.label || "Output Channel",
  );

  useEffect(() => {
    setNameValue(data.name || data.label || "Output Channel");
  }, [data.name, data.label]);

  const updateOutputData = (changes: Partial<typeof data>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id && n.type === LANGGRAPH_CANVAS_NODE_OUTPUT
          ? { ...n, data: { ...n.data, ...changes } }
          : n,
      ),
    );
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    let trimmed = nameValue.trim();
    if (!trimmed) trimmed = "Output Channel";
    setNameValue(trimmed);
    if (trimmed !== data.name) {
      updateOutputData({ name: trimmed, label: trimmed });
    }
  };

  const channelType = data.type || "sse";
  const badgeInfo = TRANSPORT_BADGES[channelType] || TRANSPORT_BADGES.sse;
  const TransportIcon = badgeInfo.icon;

  return (
    <div
      className={`rounded-xl bg-card border-2 min-w-[260px] max-w-[340px] flex flex-col transition-all duration-200 shadow-md relative group ${
        selected
          ? "border-primary ring-2 ring-primary/20 shadow-primary/10"
          : "border-border hover:border-primary/40 hover:shadow-primary/5"
      }`}
    >
      {/* Target handle from step nodes */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
        title="Connect execution step output to this channel"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 bg-secondary/30 rounded-t-xl">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1 rounded-md border border-primary/30 bg-primary/10 text-primary shrink-0">
            <TransportIcon className="w-4 h-4" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            {isEditingName ? (
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                autoFocus
                className="bg-background text-foreground text-xs font-bold px-1 py-0.5 rounded border border-primary outline-none w-full"
              />
            ) : (
              <span
                onDoubleClick={() => setIsEditingName(true)}
                className="text-xs font-bold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                title="Double click to rename"
              >
                {data.name || data.label || "Output Channel"}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-mono truncate">
              {data.topicOrEventName || data.targetStateChannel || "Channel"}
            </span>
          </div>
        </div>

        {/* Delete Button */}
        {data.onDeleteOutput && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteOutput?.();
            }}
            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete Output Channel"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 nodrag text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Transport
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${badgeInfo.color}`}
          >
            {badgeInfo.label}
          </span>
        </div>

        {data.targetStateChannel && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Emits State Field:</span>
            <span className="font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
              {data.targetStateChannel}
            </span>
          </div>
        )}

        {data.topicOrEventName && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Topic / Event:</span>
            <span className="font-mono font-semibold text-foreground truncate max-w-[140px]">
              {data.topicOrEventName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
