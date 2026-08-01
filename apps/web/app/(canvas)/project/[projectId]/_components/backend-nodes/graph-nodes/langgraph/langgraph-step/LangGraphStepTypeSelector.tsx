import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  STEP_TYPE_LLM_CALL,
  STEP_TYPE_TOOL_NODE,
  STEP_TYPE_EVALUATOR,
  STEP_TYPE_SUMMARIZER,
  STEP_TYPE_HUMAN_GATE,
  STEP_TYPE_CUSTOM_CODE,
  STEP_TYPE_VECTOR_SEARCH,
  STEP_TYPE_ROUTER,
} from "@workspace/canvas/constants";

interface LangGraphStepTypeSelectorProps {
  stepType: string;
  onTypeChange: (newType: string) => void;
}

export const LangGraphStepTypeSelector: React.FC<
  LangGraphStepTypeSelectorProps
> = ({ stepType, onTypeChange }) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-muted-foreground font-medium uppercase">
        Type
      </span>
      <Select value={stepType} onValueChange={onTypeChange}>
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
  );
};
