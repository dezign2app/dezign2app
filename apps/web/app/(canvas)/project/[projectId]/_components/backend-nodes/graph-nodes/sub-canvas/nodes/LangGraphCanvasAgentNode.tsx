import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
import { Bot, Trash2, Cpu, Wrench, Shield, Sparkles } from "lucide-react";
import type { AgentNode, LangGraphCanvasNode } from "../types";
import {
  SUB_CANVAS_NODE_AGENT,
  HANDLE_LLM_IN,
  HANDLE_TOOL_IN,
  HANDLE_MIDDLEWARE_IN,
} from "../constants";
import { LocalInput } from "../../shared";

export const LangGraphCanvasAgentNode = ({ id, data, selected }: NodeProps<AgentNode>) => {
  const { setNodes, getEdges } = useReactFlow<LangGraphCanvasNode>();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.name || "AI Agent");

  useEffect(() => {
    setNameValue(data.name || "AI Agent");
  }, [data.name]);

  const edges = getEdges();
  
  // Calculate connected resources
  const boundLLMs = edges.filter((e) => e.target === id && e.targetHandle === HANDLE_LLM_IN);
  const boundTools = edges.filter((e) => e.target === id && e.targetHandle === HANDLE_TOOL_IN);
  const boundMiddlewares = edges.filter((e) => e.target === id && e.targetHandle === HANDLE_MIDDLEWARE_IN);

  const updateAgentData = (changes: Partial<typeof data>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id && n.type === SUB_CANVAS_NODE_AGENT ? { ...n, data: { ...n.data, ...changes } } : n))
    );
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    let trimmed = nameValue.trim();
    if (!trimmed) trimmed = "AI Agent";
    setNameValue(trimmed);
    if (trimmed !== data.name) {
      updateAgentData({ name: trimmed });
    }
  };

  return (
    <div
      className={`rounded-xl bg-card border-2 min-w-[280px] max-w-[360px] flex flex-col transition-all duration-200 shadow-lg relative group ${
        selected
          ? "border-sky-500 ring-4 ring-sky-500/20 shadow-sky-500/10"
          : "border-sky-500/40 hover:border-sky-500 hover:shadow-sky-500/10"
      }`}
    >
      {/* Target Handles for LLM, Tools, Middleware */}
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_LLM_IN}
        style={{ left: "25%" }}
        className="!bg-sky-400 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect LLM Node (llm_out)"
      />
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_TOOL_IN}
        style={{ left: "50%" }}
        className="!bg-emerald-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect Tool Node (tool_out)"
      />
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_MIDDLEWARE_IN}
        style={{ left: "75%" }}
        className="!bg-purple-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect Middleware Node (middleware_out)"
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
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent rounded-t-xl">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-xl shrink-0 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md">
            <Bot className="w-5 h-5" />
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
                  className="h-6 text-xs bg-background p-1 font-bold font-mono text-sky-500 flex-1 nodrag"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") {
                      setNameValue(data.name || "AI Agent");
                      setIsEditingName(false);
                    }
                  }}
                />
              </div>
            ) : (
              <span
                className="font-bold text-base text-foreground truncate max-w-[150px] font-mono cursor-pointer hover:text-sky-500 transition-colors nodrag flex items-center gap-1 group/title"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                title="Click to edit Agent name"
              >
                {data.name || "AI Agent"}
              </span>
            )}
            <span className="text-[10px] text-sky-500 font-mono font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              createAgent() Composite
            </span>
          </div>
        </div>

        {data.onDeleteAgent && (
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 nodrag"
            onClick={(e) => {
              e.stopPropagation();
              data.onDeleteAgent?.();
            }}
            title="Delete Agent Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body: Connected Component Badges */}
      <div className="p-3 flex flex-col gap-2.5">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-center">
            <Cpu className="w-3.5 h-3.5 text-sky-400 mb-1" />
            <span className="text-[9px] font-semibold text-muted-foreground uppercase">Model</span>
            <span className="text-xs font-bold text-sky-400 font-mono">
              {boundLLMs.length > 0 ? "Bound" : "Default"}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <Wrench className="w-3.5 h-3.5 text-emerald-400 mb-1" />
            <span className="text-[9px] font-semibold text-muted-foreground uppercase">Tools</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {boundTools.length} attached
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
            <Shield className="w-3.5 h-3.5 text-purple-400 mb-1" />
            <span className="text-[9px] font-semibold text-muted-foreground uppercase">Middleware</span>
            <span className="text-xs font-bold text-purple-400 font-mono">
              {boundMiddlewares.length} active
            </span>
          </div>
        </div>

        {data.systemPrompt && (
          <div className="p-2 rounded bg-secondary/30 border border-border/50 text-[10px] text-muted-foreground font-mono truncate">
            Prompt: "{data.systemPrompt}"
          </div>
        )}
      </div>
    </div>
  );
};
