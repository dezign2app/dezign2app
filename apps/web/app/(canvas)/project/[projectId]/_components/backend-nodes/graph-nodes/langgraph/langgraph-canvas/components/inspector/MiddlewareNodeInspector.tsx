import React from "react";
import type { MiddlewareNodeData } from "@workspace/canvas";
import {
  DEFAULT_MIDDLEWARE_TYPE,
  MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP,
  MIDDLEWARE_TYPE_SUMMARIZATION,
  MIDDLEWARE_TYPE_MODEL_CALL_LIMIT,
  MIDDLEWARE_TYPE_TOOL_CALL_LIMIT,
  MIDDLEWARE_TYPE_MODEL_FALLBACK,
  MIDDLEWARE_TYPE_PII_DETECTION,
  MIDDLEWARE_TYPE_TODO_LIST,
  MIDDLEWARE_TYPE_LLM_TOOL_SELECTOR,
  MIDDLEWARE_TYPE_TOOL_RETRY,
  MIDDLEWARE_TYPE_MODEL_RETRY,
  MIDDLEWARE_TYPE_LLM_TOOL_EMULATOR,
  MIDDLEWARE_TYPE_CONTEXT_EDITING,
  MIDDLEWARE_TYPE_PROVIDER_TOOL_SEARCH,
  MIDDLEWARE_TYPE_FILESYSTEM,
  MIDDLEWARE_TYPE_SUBAGENT,
  MIDDLEWARE_TYPE_RATE_LIMIT,
  MIDDLEWARE_TYPE_LOGGING_TRACING,
  MIDDLEWARE_TYPE_CUSTOM,
} from "../../constants";
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
      {currentType === MIDDLEWARE_TYPE_HUMAN_IN_THE_LOOP && (
        <HumanInTheLoopConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_SUMMARIZATION && (
        <SummarizationConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_MODEL_CALL_LIMIT && (
        <ModelCallLimitConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_TOOL_CALL_LIMIT && (
        <ToolCallLimitConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_MODEL_FALLBACK && (
        <ModelFallbackConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_PII_DETECTION && (
        <PiiDetectionConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_TODO_LIST && (
        <TodoListConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_LLM_TOOL_SELECTOR && (
        <LlmToolSelectorConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_TOOL_RETRY && (
        <ToolRetryConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_MODEL_RETRY && (
        <ModelRetryConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_LLM_TOOL_EMULATOR && (
        <LlmToolEmulatorConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_CONTEXT_EDITING && (
        <ContextEditingConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_PROVIDER_TOOL_SEARCH && (
        <ProviderToolSearchConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_FILESYSTEM && (
        <FilesystemConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_SUBAGENT && (
        <SubagentConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_RATE_LIMIT && (
        <RateLimitConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_LOGGING_TRACING && (
        <LoggingTracingConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
      {currentType === MIDDLEWARE_TYPE_CUSTOM && (
        <CustomMiddlewareConfig
          data={selectedMiddlewareData}
          onUpdate={onUpdateMiddleware}
        />
      )}
    </div>
  );
}
