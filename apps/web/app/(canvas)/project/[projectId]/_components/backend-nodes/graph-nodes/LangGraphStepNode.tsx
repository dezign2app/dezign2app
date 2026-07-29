import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, Connection } from "@xyflow/react";
import { Brain, Trash2, Wrench, Code2, Database, GitBranch, Plus, X } from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { LocalInput, LocalTextarea } from "./shared";

import { 
  DEFAULT_LLM_PROVIDER, 
  DEFAULT_LLM_MODEL, 
  DEFAULT_LLM_TEMPERATURE, 
  HANDLE_LLM_IN, 
  HANDLE_LLM_OUT,
  STEP_TYPE_LLM_CALL,
  STEP_TYPE_TOOL_NODE,
  STEP_TYPE_EVALUATOR,
  STEP_TYPE_SUMMARIZER,
  STEP_TYPE_HUMAN_GATE,
  STEP_TYPE_CUSTOM_CODE,
  STEP_TYPE_VECTOR_SEARCH,
  STEP_TYPE_ROUTER,
} from "@workspace/canvas/constants";

const DEFAULT_STEP_LABEL = "Graph Step";

export const LangGraphStepNode = ({ id, data, selected }: NodeProps<BackendNode>) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const deleteNode = useBackendCanvasStore((s) => s.deleteNode);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.label || DEFAULT_STEP_LABEL);

  useEffect(() => {
    setNameValue(data.label || DEFAULT_STEP_LABEL);
  }, [data.label]);

  const stepType = data.stepType || STEP_TYPE_LLM_CALL;

  const isLLMEnabled = !!data.modelConfig || stepType === STEP_TYPE_LLM_CALL;

  const handleToggleLLMConfig = (enabled: boolean) => {
    if (enabled) {
      updateNode(id, {
        data: {
          ...data,
          modelConfig: data.modelConfig || {
            provider: DEFAULT_LLM_PROVIDER,
            model: DEFAULT_LLM_MODEL,
            temperature: DEFAULT_LLM_TEMPERATURE,
          },
        },
      });
    } else {
      const { modelConfig: _, ...restData } = data;
      updateNode(id, { data: restData });
    }
  };

  const handleUpdateSystemPrompt = (systemPrompt: string) => {
    updateNode(id, {
      data: {
        ...data,
        modelConfig: {
          provider: DEFAULT_LLM_PROVIDER,
          model: DEFAULT_LLM_MODEL,
          temperature: DEFAULT_LLM_TEMPERATURE,
          ...data.modelConfig,
          systemPrompt,
        },
      },
    });
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    const trimmed = nameValue.trim() || DEFAULT_STEP_LABEL;
    setNameValue(trimmed);
    if (trimmed !== data.label) {
      updateNode(id, { data: { ...data, label: trimmed } });
    }
  };

  const handleTypeChange = (newType: string) => {
    updateNode(id, { data: { ...data, stepType: newType as NonNullable<BackendNode["data"]["stepType"]> } });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  return (
    <div
      className={cn(
        "rounded-xl bg-card/95 backdrop-blur-md border-2 min-w-[200px] max-w-[260px] p-3 flex flex-col gap-2 transition-all duration-200 shadow-lg relative group",
        selected
          ? "border-emerald-400 ring-2 ring-emerald-400/20 shadow-emerald-500/10"
          : stepType === STEP_TYPE_ROUTER
          ? "border-sky-500/40 shadow-sky-500/10"
          : "border-emerald-500/30 hover:border-emerald-400/70"
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 relative">
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
          style={{ top: "16px" }}
          title="Incoming connection"
        />
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className={cn(
            "p-1 rounded border shrink-0",
            stepType === STEP_TYPE_ROUTER
              ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          )}>
            {stepType === STEP_TYPE_LLM_CALL && <Brain className="w-3.5 h-3.5" />}
            {stepType === STEP_TYPE_TOOL_NODE && <Wrench className="w-3.5 h-3.5" />}
            {stepType === STEP_TYPE_CUSTOM_CODE && <Code2 className="w-3.5 h-3.5" />}
            {stepType === STEP_TYPE_VECTOR_SEARCH && <Database className="w-3.5 h-3.5" />}
            {stepType === STEP_TYPE_ROUTER && <GitBranch className="w-3.5 h-3.5" />}
            {stepType !== STEP_TYPE_LLM_CALL && stepType !== STEP_TYPE_TOOL_NODE && stepType !== STEP_TYPE_CUSTOM_CODE && stepType !== STEP_TYPE_VECTOR_SEARCH && stepType !== STEP_TYPE_ROUTER && (
              <Brain className="w-3.5 h-3.5" />
            )}
          </div>

          {isEditingName ? (
            <div
              className="nodrag flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <LocalInput
                autoFocus
                className="h-6 text-xs bg-background p-1 font-semibold flex-1 nodrag"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") handleNameSave();
                  if (e.key === "Escape") {
                    setNameValue(data.label || DEFAULT_STEP_LABEL);
                    setIsEditingName(false);
                  }
                }}
              />
            </div>
          ) : (
            <span
              className="font-bold text-xs truncate cursor-pointer hover:text-emerald-400 transition-colors flex-1 min-w-0 nodrag"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              title="Click or double click to rename step"
            >
              {data.label || DEFAULT_STEP_LABEL}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity nodrag"
          onClick={handleDelete}
          title="Delete step node"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Step Type Selector */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground font-medium uppercase">Type</span>
        <Select value={stepType} onValueChange={handleTypeChange}>
          <SelectTrigger className="h-6 text-[10px] w-28 bg-background/50 border-emerald-500/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STEP_TYPE_LLM_CALL}>LLM Reasoner</SelectItem>
            <SelectItem value={STEP_TYPE_TOOL_NODE}>Tool Node</SelectItem>
            <SelectItem value={STEP_TYPE_ROUTER}>Conditional Router</SelectItem>
            <SelectItem value={STEP_TYPE_EVALUATOR}>Evaluator</SelectItem>
            <SelectItem value={STEP_TYPE_SUMMARIZER}>Summarizer</SelectItem>
            <SelectItem value={STEP_TYPE_HUMAN_GATE}>Human Gate</SelectItem>
            <SelectItem value={STEP_TYPE_CUSTOM_CODE}>Custom Code</SelectItem>
            <SelectItem value={STEP_TYPE_VECTOR_SEARCH}>Vector Search</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LLM Config Toggle Section - Only for non-router nodes */}
      {stepType !== STEP_TYPE_ROUTER && (
        <div className="flex flex-col gap-2 border-t border-border/40 pt-2 mt-1 nodrag relative">
          <div className="flex items-center justify-between gap-2">
            <Handle
              type="target"
              position={Position.Left}
              id={HANDLE_LLM_IN}
              isValidConnection={(connection: Connection) => connection.sourceHandle === HANDLE_LLM_OUT || connection.sourceHandle === null || connection.sourceHandle === undefined}
              className="!bg-sky-400 !w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
              title="Connect LLM node"
            />
            <div className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-emerald-400" />
              <Label htmlFor={`llm-switch-${id}`} className="text-[10px] font-semibold text-muted-foreground uppercase cursor-pointer">
                LLM Config
              </Label>
            </div>
            <Switch
              id={`llm-switch-${id}`}
              checked={isLLMEnabled}
              onCheckedChange={handleToggleLLMConfig}
              className="nodrag scale-75 origin-right"
            />
            <Handle
              type="source"
              position={Position.Right}
              id="output"
              className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform !-right-[7px]"
              title="Outgoing connection"
            />
          </div>

          {isLLMEnabled && (
            <div className="flex flex-col gap-1 mt-1 nodrag">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase">
                AI Instructions
              </Label>
              <LocalTextarea
                className="min-h-[60px] text-xs bg-background/50 border-emerald-500/30 p-2 resize-y nodrag placeholder:text-muted-foreground/50 focus-visible:ring-emerald-400/50"
                placeholder="Enter AI instructions..."
                value={data.modelConfig?.systemPrompt || ""}
                onChange={(e) => handleUpdateSystemPrompt(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      )}

      {/* Conditional Routes List - For router nodes */}
      {stepType === STEP_TYPE_ROUTER && (
        <div className="flex flex-col border-t border-border/40 pt-2 mt-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-sky-400 uppercase tracking-wider px-1 mb-1">
            <span className="flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-sky-400" /> Routes
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-4 w-4 text-muted-foreground hover:text-foreground nodrag"
              onClick={(e) => {
                e.stopPropagation();
                const newBranchId = `b_${Date.now()}`;
                const newBranch = {
                  id: newBranchId,
                  label: `Route ${(data.routerConfig?.branches?.length || 0) + 1}`,
                  field: "messages",
                  operator: "eq" as const,
                  value: "",
                  isDefault: false,
                };
                const currentBranches = data.routerConfig?.branches || [];
                updateNode(id, {
                  data: {
                    ...data,
                    routerConfig: { branches: [...currentBranches, newBranch] },
                  },
                });
              }}
              title="Add Route"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex flex-col gap-1">
            {(data.routerConfig?.branches || []).map((branch, bIdx) => {
              const routeId = branch.id || `b_${bIdx}`;
              return (
                <div
                  key={routeId}
                  className="flex items-center justify-between px-2 py-1 bg-background/50 border border-sky-500/30 rounded text-xs relative group/route nodrag"
                >
                  <span className="font-medium text-foreground text-[11px] truncate max-w-[140px]">
                    {branch.label || `Route ${bIdx + 1}`}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-4 w-4 text-muted-foreground hover:text-destructive opacity-0 group-hover/route:opacity-100 transition-opacity nodrag"
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = (data.routerConfig?.branches || []).filter((b) => (b.id || `b_${bIdx}`) !== routeId);
                      updateNode(id, { data: { ...data, routerConfig: { branches: updated } } });
                    }}
                    title="Delete Route"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={routeId}
                    className="!w-3 !h-3 !bg-sky-400 !border-2 !border-background !-right-[6px] hover:!scale-125 transition-transform z-10"
                    style={{ top: "50%" }}
                    title={`Connect route: ${branch.label || `Route ${bIdx + 1}`}`}
                  />
                </div>
              );
            })}

            {(!data.routerConfig?.branches || data.routerConfig.branches.length === 0) && (
              <span className="text-[10px] text-muted-foreground italic text-center py-1">
                No routes defined. Click + to add.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tools Badge - Only for non-router nodes */}
      {stepType !== STEP_TYPE_ROUTER && (data.tools?.length ?? 0) > 0 && (
        <div className="flex items-center justify-between gap-2 border-t border-border/40 py-2 px-1 nodrag">
          <div className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-semibold text-emerald-500 uppercase">
              Tools
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {data.tools?.length} connected
          </span>
        </div>
      )}
    </div>
  );
};
