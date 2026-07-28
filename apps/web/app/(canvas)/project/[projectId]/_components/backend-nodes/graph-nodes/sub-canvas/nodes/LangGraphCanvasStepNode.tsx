import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow, Edge } from "@xyflow/react";
import { Code2, Zap, Trash2, Brain, ChevronDown, ChevronUp, X, Globe, Link2, GitBranch, Plus, Settings, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import type { StepNode, LangGraphCanvasNode, StepNodeData, LangGraphLLMNode } from "../types";
import {
  SUB_CANVAS_NODE_STEP,
  SUB_CANVAS_NODE_LLM,
  STEP_TYPE_CUSTOM_CODE,
  STEP_TYPE_ROUTER,
  LLM_PROVIDER_OTHER,
} from "../constants";
import { LocalInput, LocalTextarea } from "../../shared";

export const LangGraphCanvasStepNode = ({ id, data, selected }: NodeProps<StepNode>) => {
  const stepType = data.stepType || STEP_TYPE_CUSTOM_CODE;
  const Icon = stepType === STEP_TYPE_ROUTER ? GitBranch : Code2;
  const { setNodes, getNodes, getEdges } = useReactFlow<LangGraphCanvasNode>();
  const allNodes = getNodes();
  const allEdges = getEdges();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.label || "Node");
  const [isLLMExpanded, setIsLLMExpanded] = useState(!!data.modelConfig);

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
        n.id === id && n.type === SUB_CANVAS_NODE_STEP
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
          if (n.id === id && n.type === SUB_CANVAS_NODE_STEP) {
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
        if (n.id === id && n.type === SUB_CANVAS_NODE_STEP) {
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
  const langGraphLLMNodes = allNodes.filter((n: LangGraphCanvasNode): n is LangGraphLLMNode => n.type === SUB_CANVAS_NODE_LLM);

  // Detect edge connected directly from an LLM node to this step node's llm_in handle
  const connectedEdge = allEdges.find(
    (e: Edge) =>
      e.target === id &&
      (e.targetHandle === "llm_in" || !e.targetHandle) &&
      allNodes.some((n: LangGraphCanvasNode) => n.id === e.source && n.type === SUB_CANVAS_NODE_LLM)
  );
  const connectedLLMNode = connectedEdge ? langGraphLLMNodes.find((n: LangGraphLLMNode) => n.id === connectedEdge.source) : null;

  // Selected linked LLM node (via edge connection or explicit dropdown selection)
  const linkedCustomLLM = connectedLLMNode || langGraphLLMNodes.find((n: LangGraphLLMNode) => n.id === data.modelConfig?.customLlmNodeId);

  useEffect(() => {
    setNameValue(data.label || "Node");
  }, [data.label]);

  useEffect(() => {
    if (data.modelConfig) {
      setIsLLMExpanded(true);
    }
  }, [!!data.modelConfig]);

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
      setNodes((nds: LangGraphCanvasNode[]) => nds.map((n: LangGraphCanvasNode) => (n.id === id && n.type === SUB_CANVAS_NODE_STEP ? { ...n, data: { ...n.data, label: trimmed } } : n)));
    }
  };

  const modelConfig = data.modelConfig;

  const handleUpdateModelConfig = (updates: Partial<NonNullable<StepNodeData["modelConfig"]>> | null) => {
    setNodes((nds: LangGraphCanvasNode[]) =>
      nds.map((n: LangGraphCanvasNode) => {
        if (n.id === id && n.type === SUB_CANVAS_NODE_STEP) {
          if (updates === null) {
            const { modelConfig, ...restData } = n.data;
            return { ...n, data: restData };
          }
          return {
            ...n,
            data: {
              ...n.data,
              modelConfig: {
                provider: updates.provider ?? n.data.modelConfig?.provider ?? "groq",
                model: updates.model ?? n.data.modelConfig?.model ?? "llama-3.3-70b-versatile",
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
          ? "border-primary ring-4 ring-primary/20 shadow-primary/10"
          : stepType === STEP_TYPE_ROUTER
          ? "border-sky-500 shadow-sky-500/10"
          : "border-border hover:border-border/80"
      }`}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <Handle type="target" position={Position.Left} id="in"
        className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform" />

      <div className="flex items-center justify-between gap-2 p-3 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`p-1.5 rounded-lg shrink-0 ${stepType === STEP_TYPE_ROUTER ? "bg-sky-500 text-white" : "bg-secondary text-foreground"}`}>
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
        <div className="flex flex-col gap-1.5 border-t border-border/50 pt-2 mt-0.5 nodrag relative px-3">
          {!linkedCustomLLM && (
            <Handle
              type="target"
              position={Position.Left}
              id="llm_in"
              className="!bg-sky-400 !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform !-left-[19px]"
              title="Connect Custom LLM Node"
            />
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                LLM Config
              </span>
              {modelConfig && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLLMExpanded(!isLLMExpanded);
                  }}
                  className="text-sky-400 hover:text-sky-300 p-0.5 nodrag"
                  title="Expand/collapse LLM Config"
                >
                  {isLLMExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {modelConfig && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 truncate max-w-[90px]">
                  {linkedCustomLLM ? linkedCustomLLM.data.label : (modelConfig.provider || "groq")}
                </span>
              )}

              <Switch
                checked={!!modelConfig}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleUpdateModelConfig({ provider: "groq", model: "llama-3.3-70b-versatile", temperature: 0.7 });
                    setIsLLMExpanded(true);
                  } else {
                    handleUpdateModelConfig(null);
                    setIsLLMExpanded(false);
                  }
                }}
                className="nodrag scale-75 origin-right"
              />
            </div>
          </div>

          {modelConfig && isLLMExpanded && (
            <div
              className="flex flex-col gap-2 p-2 rounded-lg bg-secondary/30 border border-border/60 text-xs nodrag"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Connected LLM Info Card if linked */}
              {linkedCustomLLM ? (
                <div className="flex flex-col gap-1 p-2 rounded bg-sky-500/10 border border-sky-500/30 nodrag">
                  <div className="flex items-center justify-between text-[10px] font-bold text-sky-400">
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5" /> {linkedCustomLLM.data.label}
                    </span>
                    <button
                      type="button"
                      className="text-[9px] text-muted-foreground hover:text-destructive px-1 py-0.5 rounded hover:bg-destructive/10 transition-colors"
                      onClick={() => handleUpdateModelConfig({ provider: "groq", customLlmNodeId: undefined })}
                      title="Disconnect Custom LLM"
                    >
                      Unlink
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                    <span className="uppercase font-semibold">{linkedCustomLLM.data.provider}</span>
                    <span className="truncate max-w-[130px]">{linkedCustomLLM.data.baseUrl || "http://localhost:11434/v1"}</span>
                  </div>
                </div>
              ) : (
                /* Provider & Model Row when no custom LLM is linked */
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-medium text-muted-foreground">Provider</label>
                    <Select
                      value={modelConfig.customLlmNodeId ? `node_${modelConfig.customLlmNodeId}` : (modelConfig.provider || "groq")}
                      onValueChange={(val: string) => {
                        if (val.startsWith("node_")) {
                          const nodeId = val.replace("node_", "");
                          const targetNode = langGraphLLMNodes.find((n: LangGraphLLMNode) => n.id === nodeId);
                          if (targetNode) {
                            handleUpdateModelConfig({
                              provider: "other",
                              customLlmNodeId: nodeId,
                              baseUrl: targetNode.data.baseUrl,
                              model: targetNode.data.model || "custom-model",
                              apiKeyHeader: targetNode.data.apiKeyHeader,
                              temperature: targetNode.data.temperature ?? 0.7,
                            });
                          }
                          return;
                        }

                        const provider = val as "groq" | "openai" | "anthropic" | "google" | "other";
                        const defaultModels: Record<string, string> = {
                          groq: "llama-3.3-70b-versatile",
                          openai: "gpt-4o-mini",
                          anthropic: "claude-3-5-sonnet-20241022",
                          google: "gemini-1.5-flash",
                          other: "custom-model",
                        };
                        handleUpdateModelConfig({
                          provider,
                          customLlmNodeId: undefined,
                          model: defaultModels[provider] || modelConfig.model || "",
                          baseUrl: provider === "other" ? (modelConfig.baseUrl || "http://localhost:11434/v1") : undefined,
                        });
                      }}
                    >
                      <SelectTrigger className="h-6 text-[10px] bg-background border border-border/60 rounded px-2 font-medium text-foreground nodrag">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent className="nodrag">
                        <SelectItem value="groq">Groq</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="other">Other (Inline Custom)</SelectItem>

                        {langGraphLLMNodes.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-sky-400 border-t border-border/40 mt-1">
                              Canvas LLM Nodes
                            </div>
                            {langGraphLLMNodes.map((cllm: LangGraphLLMNode) => (
                              <SelectItem key={cllm.id} value={`node_${cllm.id}`}>
                                🔗 {cllm.data.label}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-medium text-muted-foreground">Model</label>
                    <LocalInput
                      className="h-6 text-[10px] bg-background border border-border/60 rounded px-1.5 font-mono text-foreground nodrag"
                      placeholder="e.g. gpt-4o"
                      value={modelConfig.model || ""}
                      onChange={(e) => handleUpdateModelConfig({ model: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Inline Custom LLM Endpoint / Base URL Configuration when provider is "other" and no linked node */}
              {modelConfig.provider === "other" && !modelConfig.customLlmNodeId && (
                <div className="flex flex-col gap-1.5 p-2 rounded bg-background/50 border border-sky-500/20 nodrag">
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Inline Custom LLM
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-medium text-muted-foreground">Base URL / Endpoint</label>
                    <LocalInput
                      className="h-6 text-[10px] bg-background border border-border/60 rounded px-1.5 font-mono text-foreground nodrag"
                      placeholder="e.g. http://localhost:11434/v1"
                      value={modelConfig.baseUrl || ""}
                      onChange={(e) => handleUpdateModelConfig({ baseUrl: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-medium text-muted-foreground">API Key / Auth Header (Optional)</label>
                    <LocalInput
                      type="password"
                      className="h-6 text-[10px] bg-background border border-border/60 rounded px-1.5 font-mono text-foreground nodrag"
                      placeholder="Bearer ... or header value"
                      value={modelConfig.apiKeyHeader || ""}
                      onChange={(e) => handleUpdateModelConfig({ apiKeyHeader: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Temperature & Max Tokens Row */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-medium text-muted-foreground flex justify-between">
                    <span>Temp</span>
                    <span className="font-mono text-sky-400">{modelConfig.temperature ?? 0.7}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    className="h-4 accent-sky-500 cursor-pointer nodrag"
                    value={modelConfig.temperature ?? 0.7}
                    onChange={(e) => handleUpdateModelConfig({ temperature: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-medium text-muted-foreground">Max Tokens</label>
                  <LocalInput
                    type="number"
                    className="h-6 text-[10px] bg-background border border-border/60 rounded px-1.5 font-mono text-foreground nodrag"
                    placeholder="4096"
                    value={modelConfig.maxTokens ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      handleUpdateModelConfig({ maxTokens: val });
                    }}
                  />
                </div>
              </div>

              {/* System Prompt (Textarea) */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-medium text-muted-foreground">System Prompt</label>
                <LocalTextarea
                  className="min-h-[50px] max-h-[120px] text-[10px] bg-background border border-border/60 rounded p-1.5 font-mono text-foreground nodrag resize-y"
                  placeholder="Optional system prompt..."
                  rows={2}
                  value={modelConfig.systemPrompt || ""}
                  onChange={(e) => handleUpdateModelConfig({ systemPrompt: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* State Channel Updates Section - Only for non-router nodes */}
      {stepType !== STEP_TYPE_ROUTER && (
        <div className="flex flex-col gap-1.5 border-t border-border/50 pt-2 mt-0.5 nodrag px-3 pb-3">
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
        <div className="flex flex-col rounded-b-xl overflow-hidden border-t border-border/50">
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

              return (
                <div
                  key={branch.id || bIdx}
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
                          {`${branch.field || "output"} ${branch.operator} '${branch.value ?? ""}'`}
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
                    id={branch.id}
                    className="!w-2.5 !h-2.5 !bg-sky-400 !border-2 !border-background !-right-[5px] hover:!scale-125 transition-transform"
                    style={{ top: "50%" }}
                    title={`Connect route: ${branch.label || "Route"}`}
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

      {stepType !== STEP_TYPE_ROUTER && (
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          className="!bg-primary !w-3.5 !h-3.5 !border-2 !border-background hover:!scale-125 transition-transform"
        />
      )}
    </div>
  );
};

