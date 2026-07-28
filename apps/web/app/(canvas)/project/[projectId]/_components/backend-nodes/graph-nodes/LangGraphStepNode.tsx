import React, { useState, useEffect } from "react";
import { NodeProps, Handle, Position, Connection } from "@xyflow/react";
import { Brain, Trash2, Settings, ShieldCheck, Wrench, Code2, Database } from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";
import { LocalInput } from "./shared";

import { DEFAULT_LLM_PROVIDER, DEFAULT_LLM_MODEL, DEFAULT_LLM_TEMPERATURE, HANDLE_LLM_IN, HANDLE_LLM_OUT } from "@workspace/canvas/constants";

export const LangGraphStepNode = ({ id, data, selected }: NodeProps<BackendNode>) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const deleteNode = useBackendCanvasStore((s) => s.deleteNode);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.label || "Graph Step");

  useEffect(() => {
    setNameValue(data.label || "Graph Step");
  }, [data.label]);

  const stepType = data.stepType || "llm_call";

  const isLLMEnabled = !!data.modelConfig;

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

  const handleNameSave = () => {
    setIsEditingName(false);
    const trimmed = nameValue.trim() || "Graph Step";
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
          : "border-emerald-500/30 hover:border-emerald-400/70"
      )}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2 relative">
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
          title="Incoming connection"
        />
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            {stepType === "llm_call" && <Brain className="w-3.5 h-3.5" />}
            {stepType === "tool_node" && <Wrench className="w-3.5 h-3.5" />}
            {stepType === "custom_code" && <Code2 className="w-3.5 h-3.5" />}
            {stepType === "vector_search" && <Database className="w-3.5 h-3.5" />}
            {stepType !== "llm_call" && stepType !== "tool_node" && stepType !== "custom_code" && stepType !== "vector_search" && (
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
                    setNameValue(data.label || "Graph Step");
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
              {data.label || "Graph Step"}
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
            <SelectItem value="llm_call">LLM Reasoner</SelectItem>
            <SelectItem value="tool_node">Tool Node</SelectItem>
            <SelectItem value="evaluator">Evaluator</SelectItem>
            <SelectItem value="summarizer">Summarizer</SelectItem>
            <SelectItem value="human_gate">Human Gate</SelectItem>
            <SelectItem value="custom_code">Custom Code</SelectItem>
            <SelectItem value="vector_search">Vector Search</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* LLM Config Toggle Section */}
      <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2 mt-1 nodrag relative">
        {isLLMEnabled && (
          <Handle
            type="target"
            position={Position.Left}
            id={HANDLE_LLM_IN}
            isValidConnection={(connection: Connection) => connection.sourceHandle === HANDLE_LLM_OUT}
            className="!bg-sky-400 !w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform !-left-[7px]"
            title="Connect LLM node"
          />
        )}
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
    </div>
  );
};
