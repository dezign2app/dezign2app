import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, useReactFlow, Edge } from "@xyflow/react";
import { Code2, Zap, Trash2, Brain, ChevronDown, ChevronUp, X, Globe, Link2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import type { StepNode, LangGraphCanvasNode, StepNodeData, LangGraphLLMNode } from "../types";
import {
  SUB_CANVAS_NODE_STEP,
  SUB_CANVAS_NODE_LLM,
  STEP_TYPE_CUSTOM_CODE,
  LLM_PROVIDER_OTHER,
} from "../constants";
import { LocalInput, LocalTextarea } from "../../shared";

export const LangGraphCanvasStepNode = ({ id, data, selected }: NodeProps<StepNode>) => {
  const stepType = data.stepType || STEP_TYPE_CUSTOM_CODE;
  const Icon = Code2;
  const { setNodes, getNodes, getEdges } = useReactFlow<LangGraphCanvasNode>();
  const allNodes = getNodes();
  const allEdges = getEdges();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.label || "Node");
  const [isLLMExpanded, setIsLLMExpanded] = useState(!!data.modelConfig);

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
      className={`rounded-xl bg-card/95 backdrop-blur-md border-2 min-w-[240px] max-w-[300px] p-3 flex flex-col gap-2 transition-all duration-200 shadow-xl relative group ${
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

      {/* LLM Configuration Option */}
      <div className="flex flex-col gap-1.5 border-t border-border/50 pt-2 mt-0.5 nodrag relative">
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
          <button
            type="button"
            className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-wider hover:text-sky-300 transition-colors nodrag"
            onClick={(e) => {
              e.stopPropagation();
              if (!modelConfig) {
                handleUpdateModelConfig({ provider: "groq", model: "llama-3.3-70b-versatile", temperature: 0.7 });
                setIsLLMExpanded(true);
              } else {
                setIsLLMExpanded(!isLLMExpanded);
              }
            }}
          >
            <Brain className="w-3.5 h-3.5 text-sky-400" />
            <span>LLM Config</span>
            {modelConfig ? (
              isLLMExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />
            ) : (
              <span className="text-[9px] font-mono text-muted-foreground/70 normal-case font-normal">(Off)</span>
            )}
          </button>

          {modelConfig && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 truncate max-w-[90px]">
                {linkedCustomLLM ? linkedCustomLLM.data.label : (modelConfig.provider || "groq")}
              </span>
              <button
                type="button"
                className="text-[9px] text-muted-foreground hover:text-destructive p-0.5 rounded hover:bg-destructive/10 transition-colors nodrag"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateModelConfig(null);
                }}
                title="Remove LLM Config"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
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

