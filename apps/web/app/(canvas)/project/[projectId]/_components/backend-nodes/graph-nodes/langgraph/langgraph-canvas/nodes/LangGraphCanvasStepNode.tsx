import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow, Edge, Connection } from "@xyflow/react";
import { Code2, Zap, Trash2, Brain, X, GitBranch, Plus, Settings, Check, Wrench, AlertCircle } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import type { StepNode, LangGraphCanvasNode, StepNodeData, LangGraphLLMNode } from "../types";
import {
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_LLM,
  HANDLE_LLM_IN,
  HANDLE_LLM_OUT,
  HANDLE_TOOL_IN,
  HANDLE_TOOL_OUT,
  LANGGRAPH_CANVAS_NODE_TOOL,
  STEP_TYPE_CUSTOM_CODE,
  STEP_TYPE_ROUTER,
  LLM_PROVIDER_OTHER,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_TEMPERATURE,
} from "../constants";
import { LocalInput, LocalTextarea } from "../../../common/shared";

export const LangGraphCanvasStepNode = ({ id, data, selected }: NodeProps<StepNode>) => {
  const stepType = data.stepType || STEP_TYPE_CUSTOM_CODE;
  const Icon = stepType === STEP_TYPE_ROUTER ? GitBranch : Code2;
  const { setNodes, getNodes, getEdges } = useReactFlow<LangGraphCanvasNode>();
  const allNodes = getNodes();
  const allEdges = getEdges();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.label || "Node");

  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editingRouteName, setEditingRouteName] = useState("");

  const handleAddRoute = () => {
    const newBranchId = `b_${Date.now()}`;
    const newBranch = {
      id: newBranchId,
      label: "",
      field: (data.availableStateChannels || [])[0]?.key || "messages",
      operator: "eq" as const,
      value: "",
      isDefault: false,
    };
    const currentBranches = data.routerConfig?.branches || [];
    setNodes((nds: LangGraphCanvasNode[]) =>
      nds.map((n: LangGraphCanvasNode) =>
        n.id === id && n.type === LANGGRAPH_CANVAS_NODE_STEP
          ? { ...n, data: { ...n.data, routerConfig: { branches: [...currentBranches, newBranch] } } }
          : n
      )
    );
    setEditingRouteId(newBranchId);
    setEditingRouteName("");
  };

  const handleSaveRouteName = (branchId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      handleDeleteRoute(branchId);
    } else {
      setNodes((nds: LangGraphCanvasNode[]) =>
        nds.map((n: LangGraphCanvasNode) => {
          if (n.id === id && n.type === LANGGRAPH_CANVAS_NODE_STEP) {
            const branches = (n.data.routerConfig?.branches || []).map((b) =>
              b.id === branchId ? { ...b, label: trimmed } : b
            );
            return { ...n, data: { ...n.data, routerConfig: { branches } } };
          }
          return n;
        })
      );
    }
    setEditingRouteId(null);
  };

  const handleDeleteRoute = (branchId: string) => {
    setNodes((nds: LangGraphCanvasNode[]) =>
      nds.map((n: LangGraphCanvasNode) => {
        if (n.id === id && n.type === LANGGRAPH_CANVAS_NODE_STEP) {
          const branches = (n.data.routerConfig?.branches || []).filter((b) => b.id !== branchId);
          return { ...n, data: { ...n.data, routerConfig: { branches } } };
        }
        return n;
      })
    );
    if (editingRouteId === branchId) {
      setEditingRouteId(null);
    }
  };

  // Detect LLM nodes on canvas
  const langGraphLLMNodes = allNodes.filter((n: LangGraphCanvasNode): n is LangGraphLLMNode => n.type === LANGGRAPH_CANVAS_NODE_LLM);

  // Detect edge connected directly from an LLM node to this step node's llm_in handle
  const connectedEdge = allEdges.find(
    (e: Edge) =>
      e.target === id &&
      e.targetHandle === HANDLE_LLM_IN &&
      allNodes.some((n: LangGraphCanvasNode) => n.id === e.source && n.type === LANGGRAPH_CANVAS_NODE_LLM)
  );
  const connectedLLMNode = connectedEdge ? langGraphLLMNodes.find((n: LangGraphLLMNode) => n.id === connectedEdge.source) : null;

  // Detect tool nodes on canvas
  const langGraphToolNodes = allNodes.filter((n): n is any => n.type === LANGGRAPH_CANVAS_NODE_TOOL);
  
  // Detect edges connected from tool nodes to this step node's tool_in handle
  const connectedToolEdges = allEdges.filter(
    (e: Edge) =>
      e.target === id &&
      e.targetHandle === HANDLE_TOOL_IN &&
      allNodes.some((n) => n.id === e.source && n.type === LANGGRAPH_CANVAS_NODE_TOOL)
  );
  
  const connectedToolNodes = connectedToolEdges
    .map(e => langGraphToolNodes.find(n => n.id === e.source))
    .filter(Boolean);

  const allToolsDirect = connectedToolNodes.length > 0 && connectedToolNodes.every(n => n.data.returnDirect);
  const someToolsDirect = connectedToolNodes.length > 0 && connectedToolNodes.some(n => n.data.returnDirect) && !allToolsDirect;

  // Selected linked LLM node (via edge connection or explicit dropdown selection)
  const linkedCustomLLM = connectedLLMNode || langGraphLLMNodes.find((n: LangGraphLLMNode) => n.id === data.modelConfig?.customLlmNodeId);

  useEffect(() => {
    setNameValue(data.label || "Node");
  }, [data.label]);

  // Sync connected LLM node data if linked via edge
  useEffect(() => {
    if (connectedLLMNode) {
      handleUpdateModelConfig({
        provider: LLM_PROVIDER_OTHER,
        customLlmNodeId: connectedLLMNode.id,
        baseUrl: connectedLLMNode.data.baseUrl,
        model: connectedLLMNode.data.model || "custom-model",
        apiKeyHeader: connectedLLMNode.data.apiKeyHeader,
        temperature: connectedLLMNode.data.temperature ?? 0.7,
      });
    }
  }, [connectedLLMNode?.id, connectedLLMNode?.data.baseUrl, connectedLLMNode?.data.model]);

  const handleNameSave = () => {
    setIsEditingName(false);
    const trimmed = nameValue.trim() || "Node";
    setNameValue(trimmed);
    if (trimmed !== data.label) {
      setNodes((nds: LangGraphCanvasNode[]) => nds.map((n: LangGraphCanvasNode) => (n.id === id && n.type === LANGGRAPH_CANVAS_NODE_STEP ? { ...n, data: { ...n.data, label: trimmed } } : n)));
    }
  };

  const modelConfig = data.modelConfig;

  const handleUpdateModelConfig = (updates: Partial<NonNullable<StepNodeData["modelConfig"]>> | null) => {
    setNodes((nds: LangGraphCanvasNode[]) =>
      nds.map((n: LangGraphCanvasNode) => {
        if (n.id === id && n.type === LANGGRAPH_CANVAS_NODE_STEP) {
          if (updates === null) {
            const { modelConfig, ...restData } = n.data;
            return { ...n, data: restData };
          }
          return {
            ...n,
            data: {
              ...n.data,
              modelConfig: {
                provider: updates.provider ?? n.data.modelConfig?.provider ?? DEFAULT_LLM_PROVIDER,
                model: updates.model ?? n.data.modelConfig?.model ?? DEFAULT_LLM_MODEL,
                temperature: updates.temperature ?? n.data.modelConfig?.temperature,
                maxTokens: updates.maxTokens ?? n.data.modelConfig?.maxTokens,
                systemPrompt: updates.systemPrompt ?? n.data.modelConfig?.systemPrompt,
                baseUrl: updates.baseUrl ?? n.data.modelConfig?.baseUrl,
                apiKeyHeader: updates.apiKeyHeader ?? n.data.modelConfig?.apiKeyHeader,
                customLlmNodeId: updates.customLlmNodeId ?? n.data.modelConfig?.customLlmNodeId,
              },
            },
          };
        }
        return n;
      })
    );
  };

  const stateUpdates = data.stateUpdates || [];
  const availableFields = (data.availableStateChannels || []).map((c) => c.key);

  return (
    <div
      className={`rounded-xl bg-card border-2 min-w-[260px] max-w-[340px] flex flex-col transition-all duration-200 shadow-md relative group ${
        selected
          ? "border-primary ring-2 ring-primary/20 shadow-primary/10"
          : stepType === STEP_TYPE_ROUTER
          ? "border-sky-500/40 shadow-sky-500/10"
          : "border-border hover:border-border/80"
      }`}
    >
      <div className={`flex items-center justify-between gap-2 p-3 border-b border-border/50 rounded-t-xl relative ${stepType === STEP_TYPE_ROUTER ? "bg-sky-500/10 text-sky-700 dark:text-sky-400" : "bg-secondary/20"}`}>
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
          style={{ top: "22px" }}
          title="Incoming connection"
        />

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`p-1 rounded-md border shrink-0 ${stepType === STEP_TYPE_ROUTER ? "border-sky-500/30 bg-sky-500/10 text-sky-500" : "border-border/60 bg-background text-foreground"}`}>
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
                className="font-bold text-xs text-foreground truncate max-w-[130px] cursor-pointer hover:text-primary transition-colors nodrag flex items-center gap-1 group/title"
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
                title="Click to rename node"
              >
                <span className="truncate">{data.label || "Node"}</span>
              </span>
            )}
            <span className="text-[9px] font-mono text-muted-foreground">{data.stepId}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono border ${stepType === STEP_TYPE_ROUTER ? "bg-sky-500 text-white border-sky-600" : "bg-secondary text-muted-foreground border-border/40"}`}>
            {stepType === STEP_TYPE_ROUTER ? "ROUTER" : "Node"}
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

      {/* LLM Configuration Option - Only for non-router nodes */}
      {stepType !== STEP_TYPE_ROUTER && (
        <div className="flex flex-col gap-1.5 border-t border-border/50 py-2.5 nodrag relative px-3">
          <Handle
            type="target"
            position={Position.Left}
            id={HANDLE_LLM_IN}
            isValidConnection={(connection: Connection) => connection.sourceHandle === HANDLE_LLM_OUT || connection.sourceHandle === null || connection.sourceHandle === undefined}
            className="!bg-sky-400 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
            title="Connect Custom LLM Node"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                LLM Config
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!modelConfig || stepType === "llm_call"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleUpdateModelConfig({ provider: DEFAULT_LLM_PROVIDER, model: DEFAULT_LLM_MODEL, temperature: DEFAULT_LLM_TEMPERATURE });
                  } else {
                    handleUpdateModelConfig(null);
                  }
                }}
                className="nodrag scale-75 origin-right"
              />
            </div>
          </div>

          {(!!modelConfig || stepType === "llm_call") && (
            <div className="flex flex-col gap-1 mt-1 nodrag">
              <span className="text-[10px] text-muted-foreground font-medium uppercase">
                AI Instructions
              </span>
              <LocalTextarea
                className="min-h-[60px] text-xs bg-background/50 border-sky-500/30 p-2 resize-y nodrag placeholder:text-muted-foreground/50 focus-visible:ring-sky-400/50"
                placeholder="Enter AI instructions..."
                value={modelConfig?.systemPrompt || ""}
                onChange={(e) => handleUpdateModelConfig({ systemPrompt: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}
      {/* Tools Configuration Option - Only for non-router nodes */}
      {stepType !== STEP_TYPE_ROUTER && (
        <div className="flex flex-col gap-1.5 border-t border-border/50 py-2.5 nodrag relative px-3">
          <Handle
            type="target"
            position={Position.Left}
            id={HANDLE_TOOL_IN}
            isValidConnection={(connection: Connection) => connection.sourceHandle === HANDLE_TOOL_OUT || connection.sourceHandle === null || connection.sourceHandle === undefined}
            className="!bg-emerald-500 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
            title="Connect Tool Node"
            style={{ top: "30%" }}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                Tools
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {connectedToolNodes.length}
              </span>
            </div>
          </div>

          {connectedToolNodes.length > 0 && (
            <div className="flex flex-col gap-1 mt-1 nodrag">
              {someToolsDirect && (
                <div className="flex items-start gap-1 p-1 rounded bg-amber-500/10 border border-amber-500/20 mb-1" title="All tools invoked in a turn must have Return Direct enabled for short-circuit to take effect.">
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-[8px] text-amber-500 leading-tight font-medium">Partial Return Direct - mixed state</span>
                </div>
              )}
              {allToolsDirect && (
                <div className="flex items-start gap-1 p-1 rounded bg-emerald-500/10 border border-emerald-500/20 mb-1">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-[8px] text-emerald-500 leading-tight font-medium">Direct Short-Circuit Active</span>
                </div>
              )}
              {connectedToolNodes.map((toolNode, idx) => (
                <div key={idx} className="flex items-center justify-between px-2 py-1 bg-background/50 border border-border/50 rounded">
                  <span className="text-[10px] font-mono font-bold text-foreground truncate max-w-[120px]">{toolNode.data.name || "Tool"}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] uppercase px-1 rounded bg-secondary/50 text-muted-foreground font-semibold">
                      {toolNode.data.source === "inline" ? "in" : toolNode.data.source === "mcp_server" ? "mcp" : "api"}
                    </span>
                    {toolNode.data.returnDirect && (
                      <span className="text-[8px] uppercase px-1 rounded bg-emerald-500/20 text-emerald-500 font-semibold" title="Return Direct">
                        dir
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* State Channel Updates Section - Only for non-router nodes */}
      {stepType !== STEP_TYPE_ROUTER && (
        <div className="flex flex-col gap-1.5 border-t border-border/50 pt-2 mt-0.5 nodrag px-3 pb-3 relative">
          <Handle
            type="source"
            position={Position.Right}
            id="out"
            className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-right-[7px]"
            title="Outgoing connection"
          />
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
      )}

      {/* Conditional Routes List (Styled like ServiceNode Endpoints list) */}
      {stepType === STEP_TYPE_ROUTER && (
        <div className="flex flex-col rounded-b-xl border-t border-border/50">
          <div className="px-3 py-1 bg-secondary/40 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center group nodrag">
            <span className="flex items-center gap-1 text-sky-400">
              <GitBranch className="w-3.5 h-3.5" /> Conditional Routes
            </span>
            <div
              className="opacity-0 group-hover:opacity-100 cursor-pointer text-muted-foreground hover:text-foreground transition-all p-0.5 rounded hover:bg-secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleAddRoute();
              }}
              title="Add Conditional Route"
            >
              <Plus className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex flex-col">
            {(data.routerConfig?.branches || []).map((branch, bIdx) => {
              const isEditingThisRoute = editingRouteId === branch.id;
              const routeId = branch.id || `b_${bIdx}`;

              return (
                <div
                  key={routeId}
                  className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 border-border/40 text-xs relative group/row hover:bg-secondary/20 nodrag"
                >
                  {isEditingThisRoute ? (
                    <div
                      className="flex items-center gap-1 w-full pr-5 nodrag"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <LocalInput
                        autoFocus
                        className="h-6 text-xs bg-background flex-1 font-medium nodrag p-1 border border-sky-500/50"
                        placeholder="e.g. If success / Route name"
                        value={editingRouteName}
                        onChange={(e) => setEditingRouteName(e.target.value)}
                        onBlur={() => handleSaveRouteName(branch.id, editingRouteName)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") handleSaveRouteName(branch.id, editingRouteName);
                          if (e.key === "Escape") {
                            if (!branch.label) handleDeleteRoute(branch.id);
                            setEditingRouteId(null);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 shrink-0 nodrag transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveRouteName(branch.id, editingRouteName);
                        }}
                        title="Save route"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="flex flex-col min-w-0 pr-2 cursor-pointer flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRouteId(branch.id);
                          setEditingRouteName(branch.label || "");
                        }}
                      >
                        <span className="font-medium text-foreground text-xs truncate">
                          {branch.label || `Route ${bIdx + 1}`}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground truncate">
                          {`${branch.field ? (branch.field.startsWith("state.") ? branch.field : `state.${branch.field}`) : "state.variable"} ${branch.operator} '${branch.value ?? ""}'`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-all pr-2 shrink-0 nodrag">
                        <button
                          type="button"
                          className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors nodrag"
                          onClick={(e) => {
                            e.stopPropagation();
                            data.onOpenInspectorRoute?.(branch.id);
                          }}
                          title="Open route configuration in sidebar"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors nodrag"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoute(branch.id);
                          }}
                          title="Delete route"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}

                  <Handle
                    type="source"
                    position={Position.Right}
                    id={routeId}
                    className="!w-3 !h-3 !bg-white !border-2 !border-background !-right-[6px] hover:!scale-125 transition-transform z-10"
                    style={{ top: "50%" }}
                    title={`Connect route: ${branch.label || `Route ${bIdx + 1}`}`}
                  />
                </div>
              );
            })}

            {(!data.routerConfig?.branches || data.routerConfig.branches.length === 0) && (
              <div className="text-[10px] text-muted-foreground italic text-center py-2 px-3">
                No routes defined. Click + above to add a route.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

