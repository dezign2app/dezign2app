import React from "react";
import type { MiddlewareNodeData } from "../../types";
import { DEFAULT_MIDDLEWARE_TYPE } from "../../constants";
import {
  GeneralMiddlewareConfig,
  HumanInTheLoopConfig,
  SummarizationConfig,
  ModelCallLimitConfig,
  ToolCallLimitConfig,
  ModelFallbackConfig,
  PiiDetectionConfig,
  TodoListConfig,
  LlmToolSelectorConfig,
  ToolRetryConfig,
  ModelRetryConfig,
  LlmToolEmulatorConfig,
  ContextEditingConfig,
  ProviderToolSearchConfig,
  FilesystemConfig,
  SubagentConfig,
  RateLimitConfig,
  LoggingTracingConfig,
  CustomMiddlewareConfig,
} from "./middleware-configs";

interface MiddlewareNodeInspectorProps {
  selectedMiddlewareData: MiddlewareNodeData;
  onDeleteMiddleware: () => void;
  onUpdateMiddleware: (changes: Partial<MiddlewareNodeData>) => void;
}

export function MiddlewareNodeInspector({
  selectedMiddlewareData,
  onDeleteMiddleware,
  onUpdateMiddleware,
}: MiddlewareNodeInspectorProps) {
  const currentType = selectedMiddlewareData.type || DEFAULT_MIDDLEWARE_TYPE;

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* General Header & Type Selector */}
      <GeneralMiddlewareConfig
        selectedMiddlewareData={selectedMiddlewareData}
        onDeleteMiddleware={onDeleteMiddleware}
        onUpdateMiddleware={onUpdateMiddleware}
      />

      {/* Type-Specific Configurations */}
      {currentType === "human_in_the_loop" && (
        <HumanInTheLoopConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "summarization" && (
        <SummarizationConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "model_call_limit" && (
        <ModelCallLimitConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "tool_call_limit" && (
        <ToolCallLimitConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "model_fallback" && (
        <ModelFallbackConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "pii_detection" && (
        <PiiDetectionConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "todo_list" && (
        <TodoListConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "llm_tool_selector" && (
        <LlmToolSelectorConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "tool_retry" && (
        <ToolRetryConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "model_retry" && (
        <ModelRetryConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "llm_tool_emulator" && (
        <LlmToolEmulatorConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "context_editing" && (
        <ContextEditingConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "provider_tool_search" && (
        <ProviderToolSearchConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "filesystem" && (
        <FilesystemConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "subagent" && (
        <SubagentConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "rate_limit" && (
        <RateLimitConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "logging_tracing" && (
        <LoggingTracingConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
      {currentType === "custom" && (
        <CustomMiddlewareConfig data={selectedMiddlewareData} onUpdate={onUpdateMiddleware} />
      )}
    </div>
  );
}
