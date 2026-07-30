import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
import { Wrench, Trash2, Box, Server, Globe, Zap, Code2, Sparkles, FileText } from "lucide-react";
import type { ToolNode, LangGraphCanvasNode } from "../types";
import {
  LANGGRAPH_CANVAS_NODE_TOOL,
  HANDLE_TOOL_OUT,
  TOOL_SOURCE_INLINE,
  TOOL_SOURCE_MCP_SERVER,
  TOOL_SOURCE_API_ENDPOINT,
} from "../constants";
import { LocalInput } from "../../../common/shared";

export const LangGraphCanvasToolNode = ({ id, data, selected }: NodeProps<ToolNode>) => {
  const { setNodes } = useReactFlow<LangGraphCanvasNode>();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.name || "my_tool");

  useEffect(() => {
    setNameValue(data.name || "my_tool");
  }, [data.name]);

  const updateToolData = (changes: Partial<typeof data>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id && n.type === LANGGRAPH_CANVAS_NODE_TOOL ? { ...n, data: { ...n.data, ...changes } } : n))
    );
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    let trimmed = nameValue.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!trimmed) trimmed = "my_tool";
    setNameValue(trimmed);
    if (trimmed !== data.name) {
      updateToolData({ name: trimmed });
    }
  };

  const getSourceIcon = () => {
    switch (data.source) {
      case TOOL_SOURCE_MCP_SERVER:
        return <Server className="w-3.5 h-3.5 text-orange-400" />;
      case TOOL_SOURCE_API_ENDPOINT:
        return <Globe className="w-3.5 h-3.5 text-blue-400" />;
      case TOOL_SOURCE_INLINE:
      default:
        return <Box className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getSourceLabel = () => {
    switch (data.source) {
      case TOOL_SOURCE_MCP_SERVER: return "MCP Server";
      case TOOL_SOURCE_API_ENDPOINT: return "API Endpoint";
      case TOOL_SOURCE_INLINE:
      default: return "Inline Code";
    }
  };

  const returnType = data.returnType || "string";

  return (
    <div
      className={`rounded-xl bg-card border-2 min-w-[240px] max-w-[320px] flex flex-col transition-all duration-200 shadow-md relative group ${
        selected
          ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10"
          : "border-border hover:border-emerald-500/40 hover:shadow-emerald-500/5"
      }`}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        id={HANDLE_TOOL_OUT}
        style={{ left: "50%" }}
        className="!bg-emerald-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-bottom-[7px]"
        title="Connect to Step or Agent node tools"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 shrink-0">
            <Wrench className="w-4 h-4" />
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
                  className="h-6 text-xs bg-background p-1 font-bold font-mono text-emerald-500 flex-1 nodrag"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") {
                      setNameValue(data.name || "my_tool");
                      setIsEditingName(false);
                    }
                  }}
                />
              </div>
            ) : (
              <span
                className="font-bold text-sm text-foreground truncate max-w-[130px] font-mono cursor-pointer hover:text-emerald-500 transition-colors nodrag flex items-center gap-1 group/title"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                title="Click to rename tool"
              >
                <span className="truncate">{data.name || "my_tool"}</span>
              </span>
            )}
            <span className="text-[9px] font-mono text-muted-foreground truncate opacity-70">
              Tool Node
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {data.returnDirect && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5" title="Return Direct enabled">
              <Zap className="w-2.5 h-2.5" /> Direct
            </span>
          )}
          {data.headless && (
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono bg-purple-500/10 text-purple-500 border border-purple-500/20">
              Headless
            </span>
          )}
          {data.onDeleteTool && (
            <button
              type="button"
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 nodrag"
              onClick={(e) => {
                e.stopPropagation();
                data.onDeleteTool?.();
              }}
              title="Delete Tool"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body: Configuration Summary */}
      <div className="p-3 flex flex-col gap-2 text-xs">
        {/* Description Summary */}
        <div className="flex flex-col gap-1 bg-secondary/20 p-2 rounded border border-border/50 font-mono">
          <span className="text-[9px] text-muted-foreground uppercase font-sans font-bold flex items-center gap-1">
            <FileText className="w-3 h-3 text-emerald-500" /> Description / Spec
          </span>
          <span className="text-[10.5px] text-foreground leading-snug line-clamp-2 italic">
            {data.description ? `"${data.description}"` : <span className="text-muted-foreground/60 not-italic">No description provided</span>}
          </span>
        </div>

        {/* Configuration Specs Row */}
        <div className="flex items-center justify-between gap-1 text-[10px]">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/30 border border-border/50 font-medium text-foreground">
            {getSourceIcon()}
            <span>{getSourceLabel()}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded bg-secondary/30 border border-border/50 font-medium font-mono text-muted-foreground uppercase">
            <span>Returns:</span>
            <span className="text-emerald-400 font-bold">{returnType}</span>
          </div>
        </div>

        {/* Implementation Mode badge */}
        <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground bg-secondary/10 px-2 py-1 rounded border border-border/40">
          <span className="flex items-center gap-1">
            {data.implementationMode === "code" || data.functionBody ? (
              <>
                <Code2 className="w-3 h-3 text-emerald-400" />
                <span className="text-foreground">Custom Code</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-foreground">AI Natural Spec</span>
              </>
            )}
          </span>
          {data.functionBody && (
            <span className="text-emerald-500 font-semibold">{data.functionBody.split('\n').length} lines</span>
          )}
        </div>
      </div>
    </div>
  );
};
