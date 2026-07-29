import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow } from "@xyflow/react";
import { Bot, Trash2, Cpu, Wrench, Shield, Sparkles, Radio, Check } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import type { AgentNode, LangGraphCanvasNode, LangGraphAgentStreamConfig } from "../types";
import {
  SUB_CANVAS_NODE_AGENT,
  HANDLE_LLM_IN,
  HANDLE_TOOL_IN,
  HANDLE_MIDDLEWARE_IN,
  STREAM_EVENT_TYPES,
  DEFAULT_EVENT_STREAM_SIGNATURE,
  DEFAULT_STREAM_TRANSFORMERS,
  DEFAULT_SELECTED_STREAM_EVENTS,
} from "../constants";
import { LocalInput, LocalTextarea } from "../../shared";

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

  const streamConfig: LangGraphAgentStreamConfig = data.streamConfig || {
    enabled: false,
    version: "v3",
    selectedEvents: DEFAULT_SELECTED_STREAM_EVENTS,
    eventSignature: DEFAULT_EVENT_STREAM_SIGNATURE,
    customTransformers: DEFAULT_STREAM_TRANSFORMERS,
  };

  const updateAgentData = (changes: Partial<typeof data>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id && n.type === SUB_CANVAS_NODE_AGENT ? { ...n, data: { ...n.data, ...changes } } : n))
    );
  };

  const updateStreamConfig = (changes: Partial<LangGraphAgentStreamConfig>) => {
    const updated: LangGraphAgentStreamConfig = {
      version: "v3",
      selectedEvents: DEFAULT_SELECTED_STREAM_EVENTS,
      eventSignature: DEFAULT_EVENT_STREAM_SIGNATURE,
      customTransformers: DEFAULT_STREAM_TRANSFORMERS,
      ...streamConfig,
      ...changes,
    };
    updateAgentData({ streamConfig: updated });
  };

  const handleToggleStreaming = (enabled: boolean) => {
    updateStreamConfig({ enabled });
  };

  const handleToggleEvent = (eventId: string) => {
    const currentEvents = streamConfig.selectedEvents || DEFAULT_SELECTED_STREAM_EVENTS;
    const isSelected = currentEvents.includes(eventId);
    const updated = isSelected
      ? currentEvents.filter((ev) => ev !== eventId)
      : [...currentEvents, eventId];
    updateStreamConfig({ selectedEvents: updated });
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
      className={`rounded-xl bg-card border-2 min-w-[320px] max-w-[420px] flex flex-col transition-all duration-200 shadow-md relative group ${
        selected
          ? "border-sky-500 ring-2 ring-sky-500/20 shadow-sky-500/10"
          : "border-border hover:border-sky-500/40 hover:shadow-sky-500/5"
      }`}
    >
      {/* Target Handles for LLM, Tools, Middleware */}
      <Handle
        type="target"
        position={Position.Bottom}
        id={HANDLE_LLM_IN}
        style={{ left: "25%" }}
        className="!bg-sky-400 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-bottom-[7px]"
        title="Connect LLM Node (llm_out)"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id={HANDLE_TOOL_IN}
        style={{ left: "50%" }}
        className="!bg-emerald-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-bottom-[7px]"
        title="Connect Tool Node (tool_out)"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id={HANDLE_MIDDLEWARE_IN}
        style={{ left: "75%" }}
        className="!bg-purple-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-bottom-[7px]"
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
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50 bg-sky-500/10 text-sky-700 dark:text-sky-400 rounded-t-xl">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1 rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-500 shrink-0">
            <Bot className="w-4 h-4" />
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
                className="font-bold text-base text-foreground truncate max-w-[170px] font-mono cursor-pointer hover:text-sky-500 transition-colors nodrag flex items-center gap-1 group/title"
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

      {/* Body */}
      <div className="p-3 flex flex-col gap-3">
        {/* 1. System Prompt */}
        <div className="flex flex-col gap-1 nodrag">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase">System Prompt</span>
          <LocalTextarea
            className="min-h-[50px] max-h-[100px] text-[11px] bg-secondary/20 border border-border/50 p-2 rounded font-mono leading-relaxed resize-y placeholder:text-muted-foreground/50 nodrag"
            placeholder="System prompt / instructions for this agent..."
            value={data.systemPrompt || ""}
            onChange={(e) => updateAgentData({ systemPrompt: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>

        {/* 2. Event Stream Configuration Panel */}
        <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-cyan-950/10 dark:bg-cyan-950/20 border border-cyan-500/30 nodrag">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`p-1 rounded ${streamConfig.enabled ? "bg-cyan-500/20 text-cyan-500 animate-pulse" : "bg-muted/30 text-muted-foreground"}`}>
                <Radio className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Event Stream
                  {streamConfig.enabled && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
                      v3 Active
                    </span>
                  )}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono">
                  streamEvents(..., version="v3")
                </span>
              </div>
            </div>

            <div
              className="nodrag"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Switch
                checked={Boolean(streamConfig.enabled)}
                onCheckedChange={handleToggleStreaming}
                className="scale-90"
              />
            </div>
          </div>

          {streamConfig.enabled && (
            <div className="flex flex-col gap-2.5 mt-1 pt-2 border-t border-cyan-500/20">
              {/* Event Types / Projections Checklist */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">
                  Stream Event Projections
                </span>
                <div className="flex flex-wrap gap-1">
                  {STREAM_EVENT_TYPES.map((ev) => {
                    const isSelected = (streamConfig.selectedEvents || DEFAULT_SELECTED_STREAM_EVENTS).includes(ev.id);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEvent(ev.id);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        title={`${ev.label}: ${ev.description}`}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 font-semibold"
                            : "bg-secondary/30 border-border/40 text-muted-foreground hover:bg-secondary/50"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-cyan-500 shrink-0" />}
                        <span>{ev.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground pt-1 opacity-80 border-t border-cyan-500/10">
                <span>Configure signature & transformer logic in Inspector sidebar →</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Connected Component Badges at Bottom (aligns directly above bottom handle connectors) */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-secondary/20 border border-border/50 text-center">
            <Cpu className="w-3.5 h-3.5 text-sky-400 mb-1" />
            <span className="text-[9px] font-semibold text-muted-foreground uppercase">Model</span>
            <span className="text-xs font-bold text-foreground font-mono">
              {boundLLMs.length > 0 ? "Bound" : "Default"}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-secondary/20 border border-border/50 text-center">
            <Wrench className="w-3.5 h-3.5 text-emerald-400 mb-1" />
            <span className="text-[9px] font-semibold text-muted-foreground uppercase">Tools</span>
            <span className="text-xs font-bold text-foreground font-mono">
              {boundTools.length} attached
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-secondary/20 border border-border/50 text-center">
            <Shield className="w-3.5 h-3.5 text-purple-400 mb-1" />
            <span className="text-[9px] font-semibold text-muted-foreground uppercase">Middleware</span>
            <span className="text-xs font-bold text-foreground font-mono">
              {boundMiddlewares.length} active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

