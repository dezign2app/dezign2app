import React, { useState } from "react";
import { NodeProps, Handle, Position } from "@xyflow/react";
import { Brain, Trash2, Settings, ShieldCheck, Wrench, Code2, Database } from "lucide-react";
import { BackendNode } from "@/types/canvas";
import { cn } from "@workspace/ui/lib/utils";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { useBackendCanvasStore } from "@/lib/stores/backendCanvasStore";

export const LangGraphStepNode = ({ id, data, selected }: NodeProps<BackendNode>) => {
  const updateNode = useBackendCanvasStore((s) => s.updateNode);
  const deleteNode = useBackendCanvasStore((s) => s.deleteNode);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.label || "Graph Step");

  const stepType = data.stepType || "llm_call";

  const handleNameSave = () => {
    setIsEditingName(false);
    if (nameValue.trim() && nameValue !== data.label) {
      updateNode(id, { data: { ...data, label: nameValue.trim() } });
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
        "rounded-xl bg-card/95 backdrop-blur-md border-2 min-w-[200px] max-w-[260px] p-3 flex flex-col gap-2 transition-all duration-200 shadow-lg relative group nodrag",
        selected
          ? "border-emerald-400 ring-2 ring-emerald-400/20 shadow-emerald-500/10"
          : "border-emerald-500/30 hover:border-emerald-400/70"
      )}
    >
      {/* Input Handle on Left (Target) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {stepType === "llm_call" && <Brain className="w-3.5 h-3.5" />}
            {stepType === "tool_node" && <Wrench className="w-3.5 h-3.5" />}
            {stepType === "custom_code" && <Code2 className="w-3.5 h-3.5" />}
            {stepType === "vector_search" && <Database className="w-3.5 h-3.5" />}
            {stepType !== "llm_call" && stepType !== "tool_node" && stepType !== "custom_code" && stepType !== "vector_search" && (
              <Brain className="w-3.5 h-3.5" />
            )}
          </div>

          {isEditingName ? (
            <Input
              autoFocus
              className="h-6 text-xs bg-background p-1"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            />
          ) : (
            <span
              className="font-bold text-xs truncate cursor-pointer hover:text-emerald-400 transition-colors"
              onClick={() => setIsEditingName(true)}
              title="Click to rename step"
            >
              {data.label || "Graph Step"}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* Details Badge */}
      {data.modelConfig && (
        <div className="text-[9px] font-mono text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded border border-border/40 truncate">
          {data.modelConfig.provider || "groq"}:{data.modelConfig.model || "llama-3.3-70b"}
        </div>
      )}

      {/* Output Handle on Right (Source) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-background hover:!scale-125 transition-transform"
      />
    </div>
  );
};
