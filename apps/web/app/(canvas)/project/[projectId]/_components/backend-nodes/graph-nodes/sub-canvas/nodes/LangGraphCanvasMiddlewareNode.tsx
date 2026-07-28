import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
import { Shield, Trash2, UserCheck, Gauge, Activity, Code2 } from "lucide-react";
import type { MiddlewareNode, LangGraphCanvasNode } from "../types";
import { SUB_CANVAS_NODE_MIDDLEWARE, HANDLE_MIDDLEWARE_OUT } from "../constants";
import { LocalInput } from "../../shared";

export const LangGraphCanvasMiddlewareNode = ({ id, data, selected }: NodeProps<MiddlewareNode>) => {
  const { setNodes } = useReactFlow<LangGraphCanvasNode>();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.name || "Middleware");

  useEffect(() => {
    setNameValue(data.name || "Middleware");
  }, [data.name]);

  const updateMiddlewareData = (changes: Partial<typeof data>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id && n.type === SUB_CANVAS_NODE_MIDDLEWARE ? { ...n, data: { ...n.data, ...changes } } : n))
    );
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    let trimmed = nameValue.trim();
    if (!trimmed) trimmed = "Middleware";
    setNameValue(trimmed);
    if (trimmed !== data.name) {
      updateMiddlewareData({ name: trimmed });
    }
  };

  const getTypeIcon = () => {
    switch (data.type) {
      case "human_in_the_loop": return <UserCheck className="w-3.5 h-3.5 text-purple-400" />;
      case "rate_limit": return <Gauge className="w-3.5 h-3.5 text-amber-400" />;
      case "logging_tracing": return <Activity className="w-3.5 h-3.5 text-sky-400" />;
      case "custom":
      default: return <Code2 className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (data.type) {
      case "human_in_the_loop": return "Human in the Loop";
      case "rate_limit": return "Rate Limiter";
      case "logging_tracing": return "Logging & Tracing";
      case "custom":
      default: return "Custom Middleware";
    }
  };

  return (
    <div
      className={`rounded-xl bg-card border-2 min-w-[240px] max-w-[320px] flex flex-col transition-all duration-200 shadow-md relative group ${
        selected
          ? "border-purple-500 ring-4 ring-purple-500/20 shadow-purple-500/10"
          : "border-border hover:border-purple-500/50 hover:shadow-purple-500/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 bg-purple-500/5 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg shrink-0 bg-purple-500 text-white shadow-sm">
            <Shield className="w-4 h-4" />
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
                  className="h-6 text-xs bg-background p-1 font-bold font-mono text-purple-500 flex-1 nodrag"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") {
                      setNameValue(data.name || "Middleware");
                      setIsEditingName(false);
                    }
                  }}
                />
              </div>
            ) : (
              <span
                className="font-bold text-sm text-foreground truncate max-w-[130px] font-mono cursor-pointer hover:text-purple-500 transition-colors nodrag flex items-center gap-1 group/title"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                title="Click to edit middleware name"
              >
                {data.name || "Middleware"}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              {getTypeIcon()}
              {getTypeLabel()}
            </span>
          </div>
        </div>

        {data.onDeleteMiddleware && (
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 nodrag"
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteMiddleware?.();
            }}
            title="Delete Middleware Node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 text-xs">
        {data.type === "human_in_the_loop" && (
          <div className="flex flex-col gap-1 text-[11px] text-purple-400 bg-purple-500/5 p-2 rounded border border-purple-500/10 font-mono">
            <span>Approval Interceptor</span>
            {data.humanInTheLoopConfig?.requiredRole && (
              <span className="text-[10px] text-muted-foreground">Role: {data.humanInTheLoopConfig.requiredRole}</span>
            )}
          </div>
        )}

        {data.type === "rate_limit" && (
          <div className="flex items-center justify-between text-[11px] text-amber-500 bg-amber-500/5 p-2 rounded border border-amber-500/10 font-mono">
            <span>Rate Limit</span>
            <span className="font-bold">{data.rateLimitConfig?.requestsPerMinute || 60} req/min</span>
          </div>
        )}

        {data.type === "logging_tracing" && (
          <div className="flex items-center justify-between text-[11px] text-sky-500 bg-sky-500/5 p-2 rounded border border-sky-500/10 font-mono">
            <span>Tracing Level</span>
            <span className="uppercase font-bold">{data.loggingConfig?.logLevel || "info"}</span>
          </div>
        )}
      </div>

      {/* Outbound Middleware handle connecting to Agent */}
      <Handle
        type="source"
        position={Position.Right}
        id={HANDLE_MIDDLEWARE_OUT}
        className="!bg-purple-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-right-[7px]"
        title="Connect to Agent Node (middleware_in)"
      />
    </div>
  );
};
