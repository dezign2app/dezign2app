import React, { useState, useEffect } from "react";
import {
  NodeProps,
  Handle,
  Position,
  useReactFlow,
  Connection,
} from "@xyflow/react";
import {
  Bot,
  Trash2,
  Cpu,
  Wrench,
  Shield,
  Sparkles,
  Radio,
  Check,
  FileJson,
  Layers,
  Database,
  HardDrive,
  Key,
  Zap,
  Brain,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Plus,
  X,
} from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import type {
  CanvasNode,
  LangGraphCanvasNodeUnion,
  LangGraphAgentStreamConfig,
  LangGraphAgentResponseFormatConfig,
} from "../types";
import type { LangGraphAgentMemoryConfig } from "@/types/canvas";
import {
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  HANDLE_LLM_IN,
  HANDLE_LLM_OUT,
  HANDLE_TOOL_IN,
  HANDLE_TOOL_OUT,
  HANDLE_MIDDLEWARE_IN,
  HANDLE_MIDDLEWARE_OUT,
  HANDLE_MEMORY_IN,
  HANDLE_MEMORY_OUT,
  STREAM_EVENT_TYPES,
  DEFAULT_EVENT_STREAM_SIGNATURE,
  DEFAULT_STREAM_TRANSFORMERS,
  DEFAULT_SELECTED_STREAM_EVENTS,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_TEMPERATURE,
} from "../constants";
import { LocalInput, LocalTextarea } from "../../../common";

export const LangGraphCanvasNode = ({
  id,
  data,
  selected,
}: NodeProps<CanvasNode>) => {
  const { setNodes, getEdges } = useReactFlow<LangGraphCanvasNodeUnion>();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.name || "Node");
  const [isExpanded, setIsExpanded] = useState(data.isExpanded ?? false);

  useEffect(() => {
    setNameValue(data.name || "Node");
  }, [data.name]);

  useEffect(() => {
    if (data.isExpanded !== undefined) {
      setIsExpanded(data.isExpanded);
    }
  }, [data.isExpanded]);

  const toggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    updateAgentData({ isExpanded: next });
  };

  const edges = getEdges();

  // Calculate connected resources
  const boundLLMs = edges.filter(
    (e) => e.target === id && e.targetHandle === HANDLE_LLM_IN,
  );
  const boundTools = edges.filter(
    (e) => e.target === id && e.targetHandle === HANDLE_TOOL_IN,
  );
  const boundMiddlewares = edges.filter(
    (e) => e.target === id && e.targetHandle === HANDLE_MIDDLEWARE_IN,
  );
  const boundMemories = edges.filter(
    (e) => e.target === id && e.targetHandle === HANDLE_MEMORY_IN,
  );

  const llmConfig = {
    enabled:
      data.llmConfig?.enabled !== undefined
        ? data.llmConfig.enabled
        : data.modelConfig !== undefined
          ? true
          : true,
    provider:
      data.llmConfig?.provider ||
      data.modelConfig?.provider ||
      DEFAULT_LLM_PROVIDER,
    model:
      data.llmConfig?.model || data.modelConfig?.model || DEFAULT_LLM_MODEL,
    temperature:
      data.llmConfig?.temperature ??
      data.modelConfig?.temperature ??
      DEFAULT_LLM_TEMPERATURE,
  };

  const stateUpdatesConfig = {
    enabled: data.stateUpdatesConfig?.enabled !== false,
  };

  const streamConfig: LangGraphAgentStreamConfig = data.streamConfig || {
    enabled: false,
    version: "v3",
    selectedEvents: DEFAULT_SELECTED_STREAM_EVENTS,
    eventSignature: DEFAULT_EVENT_STREAM_SIGNATURE,
    customTransformers: DEFAULT_STREAM_TRANSFORMERS,
  };

  const responseFormat: LangGraphAgentResponseFormatConfig =
    data.responseFormat || {
      enabled: false,
      strategy: "auto",
      schemaType: "json_schema",
      schemaJson: "",
      handleErrorMode: "default",
    };

  const memoryConfig: LangGraphAgentMemoryConfig = data.memoryConfig || {
    enabled: true,
    checkpointer: "memory",
    threadIdKey: "thread_id",
    threadScope: "session",
    autoSummarize: true,
    saveMessages: true,
  };

  const stateUpdates = data.stateUpdates || [];
  const availableFields = (data.availableStateChannels || []).map((c) => c.key);

  const updateAgentData = (changes: Partial<typeof data>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id &&
        (n.type === LANGGRAPH_CANVAS_NODE_NODE ||
          n.type === LANGGRAPH_CANVAS_NODE_AGENT)
          ? { ...n, data: { ...n.data, ...changes } }
          : n,
      ),
    );
  };

  const handleToggleLLMConfig = (enabled: boolean) => {
    const updatedLLMConfig = {
      ...llmConfig,
      enabled,
    };
    const updatedModelConfig = enabled
      ? data.modelConfig || {
          provider: DEFAULT_LLM_PROVIDER,
          model: DEFAULT_LLM_MODEL,
          temperature: DEFAULT_LLM_TEMPERATURE,
        }
      : undefined;
    updateAgentData({
      llmConfig: updatedLLMConfig,
      modelConfig: updatedModelConfig,
    });
  };

  const handleToggleStateUpdates = (enabled: boolean) => {
    updateAgentData({
      stateUpdatesConfig: {
        ...stateUpdatesConfig,
        enabled,
      },
    });
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

  const updateResponseFormat = (
    changes: Partial<LangGraphAgentResponseFormatConfig>,
  ) => {
    const updated: LangGraphAgentResponseFormatConfig = {
      enabled: false,
      strategy: "auto",
      schemaType: "json_schema",
      schemaJson: "",
      handleErrorMode: "default",
      ...responseFormat,
      ...changes,
    };
    updateAgentData({ responseFormat: updated });
  };

  const updateMemoryConfig = (changes: Partial<LangGraphAgentMemoryConfig>) => {
    const updated: LangGraphAgentMemoryConfig = {
      enabled: true,
      checkpointer: "convex",
      threadIdKey: "thread_id",
      threadScope: "session",
      autoSummarize: true,
      saveMessages: true,
      ...memoryConfig,
      ...changes,
    };
    updateAgentData({ memoryConfig: updated });
  };

  const handleToggleStreaming = (enabled: boolean) => {
    updateStreamConfig({ enabled });
  };

  const handleToggleResponseFormat = (enabled: boolean) => {
    updateResponseFormat({ enabled });
  };

  const handleToggleMemory = (enabled: boolean) => {
    updateMemoryConfig({ enabled });
  };

  const handleToggleEvent = (eventId: string) => {
    const currentEvents =
      streamConfig.selectedEvents || DEFAULT_SELECTED_STREAM_EVENTS;
    const isSelected = currentEvents.includes(eventId);
    const updated = isSelected
      ? currentEvents.filter((ev) => ev !== eventId)
      : [...currentEvents, eventId];
    updateStreamConfig({ selectedEvents: updated });
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    let trimmed = nameValue.trim();
    if (!trimmed) trimmed = "Node";
    setNameValue(trimmed);
    if (trimmed !== data.name) {
      updateAgentData({ name: trimmed });
    }
  };

  return (
    <div
      className={`rounded-xl bg-card border-2 min-w-[340px] max-w-[440px] flex flex-col transition-all duration-200 shadow-md relative group ${
        selected
          ? "border-sky-500 ring-2 ring-sky-500/20 shadow-sky-500/10"
          : "border-border hover:border-sky-500/40 hover:shadow-sky-500/5"
      }`}
    >
      {/* Target Handles for LLM, Tools, Middleware, Memory */}
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_LLM_IN}
        style={{ left: "12.5%" }}
        isValidConnection={(connection: Connection) =>
          connection.sourceHandle === HANDLE_LLM_OUT ||
          Boolean(connection.source?.startsWith("llm_"))
        }
        className="!bg-sky-400 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect LLM (llm_out)"
      />
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_TOOL_IN}
        style={{ left: "37.5%" }}
        isValidConnection={(connection: Connection) =>
          connection.sourceHandle === HANDLE_TOOL_OUT ||
          Boolean(connection.source?.startsWith("tool_"))
        }
        className="!bg-emerald-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect Tool Node (tool_out)"
      />
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_MIDDLEWARE_IN}
        style={{ left: "62.5%" }}
        isValidConnection={(connection: Connection) =>
          connection.sourceHandle === HANDLE_MIDDLEWARE_OUT ||
          Boolean(connection.source?.startsWith("mw_"))
        }
        className="!bg-purple-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect Middleware (middleware_out)"
      />
      <Handle
        type="target"
        position={Position.Top}
        id={HANDLE_MEMORY_IN}
        style={{ left: "87.5%" }}
        isValidConnection={(connection: Connection) =>
          connection.sourceHandle === HANDLE_MEMORY_OUT ||
          Boolean(
            connection.source?.startsWith("mem_") ||
            connection.source?.startsWith("db_"),
          )
        }
        className="!bg-amber-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-top-[7px]"
        title="Connect Memory / DB Ref Node (memory_out)"
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
                      setNameValue(data.name || "Node");
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
                title="Click to edit Node name"
              >
                {data.name || "Node"}
              </span>
            )}
            <span className="text-[10px] text-sky-500 font-mono font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              LangGraph Node
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 transition-colors shrink-0 nodrag"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            title={isExpanded ? "Collapse Node" : "Expand Node"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 nodrag"
            onClick={(e) => {
              e.stopPropagation();
              if (data.onDeleteAgent) {
                data.onDeleteAgent();
              } else {
                setNodes((nds) => nds.filter((n) => n.id !== id));
              }
            }}
            title="Delete Node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-3">
        {/* Connected Component Badges at Top */}
        <div className="grid grid-cols-4 gap-1 pb-1">
          <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-secondary/20 border border-border/50 text-center">
            <Cpu className="w-3.5 h-3.5 text-sky-400 mb-0.5" />
            <span className="text-[8px] font-semibold text-muted-foreground uppercase">
              Model
            </span>
            <span className="text-[10px] font-bold text-foreground font-mono truncate max-w-full">
              {boundLLMs.length > 0
                ? "Bound"
                : llmConfig.enabled !== false
                  ? "Default"
                  : "Off"}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-secondary/20 border border-border/50 text-center">
            <Wrench className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
            <span className="text-[8px] font-semibold text-muted-foreground uppercase">
              Tools
            </span>
            <span className="text-[10px] font-bold text-foreground font-mono truncate max-w-full">
              {boundTools.length} attached
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-secondary/20 border border-border/50 text-center">
            <Shield className="w-3.5 h-3.5 text-purple-400 mb-0.5" />
            <span className="text-[8px] font-semibold text-muted-foreground uppercase">
              Middleware
            </span>
            <span className="text-[10px] font-bold text-foreground font-mono truncate max-w-full">
              {boundMiddlewares.length} active
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-secondary/20 border border-border/50 text-center">
            <Database className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
            <span className="text-[8px] font-semibold text-muted-foreground uppercase">
              Memory
            </span>
            <span className="text-[10px] font-bold text-foreground font-mono truncate max-w-full">
              {boundMemories.length > 0
                ? "Bound"
                : memoryConfig.enabled !== false
                  ? memoryConfig.checkpointer || "memory"
                  : "Off"}
            </span>
          </div>
        </div>

        {/* Expand / Collapse Action Bar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-secondary/30 hover:bg-secondary/60 text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border/40 transition-colors nodrag"
        >
          {isExpanded ? (
            <>
              <span>Hide Details</span>
              <ChevronUp className="w-3 h-3 text-sky-500" />
            </>
          ) : (
            <>
              <span>Show Details & Config</span>
              <ChevronDown className="w-3 h-3 text-sky-500" />
            </>
          )}
        </button>

        {isExpanded && (
          <>
            {/* 1. LLM Configuration Panel */}
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-sky-500/5 border border-sky-500/20 nodrag">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`p-1 rounded shrink-0 ${llmConfig.enabled !== false ? "bg-sky-500/20 text-sky-500" : "bg-muted/30 text-muted-foreground"}`}
                  >
                    <Brain className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                      LLM Config
                      {boundLLMs.length > 0 ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-semibold shrink-0">
                          Bound Edge
                        </span>
                      ) : llmConfig.enabled !== false ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-semibold shrink-0">
                          {llmConfig.provider || "default"}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono truncate">
                      {llmConfig.enabled !== false
                        ? "Model execution enabled"
                        : "LLM config disabled"}
                    </span>
                  </div>
                </div>

                <div
                  className="nodrag shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={llmConfig.enabled !== false}
                    onCheckedChange={handleToggleLLMConfig}
                    className="scale-90"
                  />
                </div>
              </div>

              {llmConfig.enabled !== false && (
                <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-sky-500/20 nodrag">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase">
                    System Prompt
                  </span>
                  <LocalTextarea
                    className="min-h-[50px] max-h-[100px] text-[11px] bg-secondary/20 border border-border/50 p-2 rounded font-mono leading-relaxed resize-y placeholder:text-muted-foreground/50 nodrag"
                    placeholder="System prompt / instructions for this node..."
                    value={data.systemPrompt || ""}
                    onChange={(e) =>
                      updateAgentData({ systemPrompt: e.target.value })
                    }
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>

            {/* 2. State Channel Updates Panel */}
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 nodrag">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`p-1 rounded shrink-0 ${stateUpdatesConfig.enabled !== false ? "bg-amber-500/20 text-amber-500" : "bg-muted/30 text-muted-foreground"}`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                      State Updates
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono font-bold shrink-0">
                        {stateUpdates.length}
                      </span>
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono truncate">
                      {stateUpdatesConfig.enabled !== false
                        ? "Graph state mutation active"
                        : "State updates disabled"}
                    </span>
                  </div>
                </div>

                <div
                  className="nodrag shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={stateUpdatesConfig.enabled !== false}
                    onCheckedChange={handleToggleStateUpdates}
                    className="scale-90"
                  />
                </div>
              </div>

              {stateUpdatesConfig.enabled !== false && (
                <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-amber-500/20">
                  {stateUpdates.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {stateUpdates.map((su, idx) => {
                        const matchedChannel = (
                          data.availableStateChannels || []
                        ).find((c) => c.key === su.channelKey);
                        return (
                          <div
                            key={idx}
                            className="flex flex-col gap-0.5 bg-amber-500/10 px-2 py-1 rounded text-[10px] font-mono border border-amber-500/20"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-amber-400 font-bold truncate max-w-[140px]">
                                {su.channelKey}
                              </span>
                              <span className="text-[9px] text-muted-foreground uppercase px-1 rounded bg-secondary/50 font-semibold">
                                {su.mode || "set"}
                              </span>
                            </div>
                            {su.value ? (
                              <span className="text-[9px] text-muted-foreground/90 truncate font-mono">
                                {su.value}
                              </span>
                            ) : (
                              matchedChannel && (
                                <span className="text-[9px] text-muted-foreground/70 font-mono">
                                  type: {matchedChannel.type}
                                </span>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 bg-secondary/20 p-1.5 rounded border border-border/30">
                      <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                        <span className="font-bold text-foreground">
                          Graph Fields:
                        </span>
                        <span className="truncate max-w-[180px]">
                          {availableFields.length > 0
                            ? availableFields.join(", ")
                            : "none"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Memory / Checkpointer Panel */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-950/10 dark:bg-amber-950/20 border border-amber-500/30 nodrag">
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className={`p-1 rounded shrink-0 ${memoryConfig.enabled !== false ? "bg-amber-500/20 text-amber-500" : "bg-muted/30 text-muted-foreground"}`}
                >
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                    Memory & Checkpointer
                    {boundMemories.length > 0 ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-semibold shrink-0">
                        Node Connected
                      </span>
                    ) : memoryConfig.enabled !== false ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-semibold shrink-0">
                        Active
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono truncate">
                    {memoryConfig.enabled !== false
                      ? "Checkpointing enabled"
                      : "Checkpointing disabled"}
                  </span>
                </div>
              </div>

              <div
                className="nodrag shrink-0"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Switch
                  checked={memoryConfig.enabled !== false}
                  onCheckedChange={handleToggleMemory}
                  className="scale-90"
                />
              </div>
            </div>

            {/* 4. Structured Output / Response Format Panel */}
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-secondary/20 border border-border/50 nodrag">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={`p-1 rounded shrink-0 ${responseFormat.enabled ? "bg-sky-500/20 text-sky-500" : "bg-muted/30 text-muted-foreground"}`}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                      Structured Output
                      {responseFormat.enabled && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-semibold shrink-0">
                          {responseFormat.strategy === "provider"
                            ? "providerStrategy"
                            : responseFormat.strategy === "tool"
                              ? "toolStrategy"
                              : "responseFormat"}
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono truncate">
                      responseFormat → state.structuredResponse
                    </span>
                  </div>
                </div>

                <div
                  className="nodrag shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={Boolean(responseFormat.enabled)}
                    onCheckedChange={handleToggleResponseFormat}
                    className="scale-90"
                  />
                </div>
              </div>

              {responseFormat.enabled && (
                <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-foreground font-semibold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-sky-500" />
                      Format: JSON Schema
                    </span>
                    <span className="text-muted-foreground text-[9px]">
                      Mode: {responseFormat.strategy || "auto"}
                    </span>
                  </div>

                  {responseFormat.toolMessageContent && (
                    <p className="text-[9px] font-mono text-muted-foreground bg-background/60 p-1.5 rounded border border-border/40 truncate">
                      <span className="text-sky-500 font-semibold">
                        toolMsg:
                      </span>{" "}
                      "{responseFormat.toolMessageContent}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground pt-0.5 opacity-80">
                    <span>
                      Edit schema & retry options in Inspector sidebar →
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Event Stream Configuration Panel */}
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-cyan-950/10 dark:bg-cyan-950/20 border border-cyan-500/30 nodrag">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`p-1 rounded ${streamConfig.enabled ? "bg-cyan-500/20 text-cyan-500 animate-pulse" : "bg-muted/30 text-muted-foreground"}`}
                  >
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
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">
                      Stream Event Projections
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {STREAM_EVENT_TYPES.map((ev) => {
                        const isSelected = (
                          streamConfig.selectedEvents ||
                          DEFAULT_SELECTED_STREAM_EVENTS
                        ).includes(ev.id);
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
                            {isSelected && (
                              <Check className="w-2.5 h-2.5 text-cyan-500 shrink-0" />
                            )}
                            <span>{ev.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground pt-1 opacity-80 border-t border-cyan-500/10">
                    <span>
                      Configure signature & transformer logic in Inspector
                      sidebar →
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
