export type LangGraphMiddlewareType =
  | "human_in_the_loop"
  | "rate_limit"
  | "logging_tracing"
  | "summarization"
  | "model_call_limit"
  | "tool_call_limit"
  | "model_fallback"
  | "pii_detection"
  | "todo_list"
  | "llm_tool_selector"
  | "tool_retry"
  | "model_retry"
  | "llm_tool_emulator"
  | "context_editing"
  | "provider_tool_search"
  | "filesystem"
  | "subagent"
  | "custom";

export interface LangGraphMiddlewareDefinition {
  id?: string;
  middlewareId?: string;
  name: string;
  type: LangGraphMiddlewareType;

  humanInTheLoopConfig?: {
    interruptOn?: Record<string, boolean>;
    approvalPrompt?: string;
    requiredRole?: string;
  };
  rateLimitConfig?: {
    requestsPerMinute: number;
    windowMs?: number;
  };
  loggingConfig?: {
    logLevel: "debug" | "info" | "warn" | "error";
    tracingTarget?: "langsmith" | "opentelemetry" | "convex";
  };
  summarizationConfig?: {
    model?: string;
    triggerTokens?: number;
    triggerMessages?: number;
    triggerFraction?: number;
    keepMessages?: number;
    keepTokens?: number;
    keepFraction?: number;
    summaryPrompt?: string;
    trimTokensToSummarize?: number;
    summaryPrefix?: string;
  };
  modelCallLimitConfig?: {
    threadLimit?: number;
    runLimit?: number;
    exitBehavior?: "end" | "error";
  };
  toolCallLimitConfig?: {
    toolName?: string;
    threadLimit?: number;
    runLimit?: number;
    exitBehavior?: "continue" | "error" | "end";
  };
  modelFallbackConfig?: {
    fallbackModels?: string[];
  };
  piiConfig?: {
    piiType?: string;
    strategy?: "redact" | "block" | "mask" | "hash";
    detectorPattern?: string;
    applyToInput?: boolean;
    applyToOutput?: boolean;
    applyToToolResults?: boolean;
  };
  todoListConfig?: {
    enableWriteTodos?: boolean;
    autoInjectPrompt?: boolean;
    initialTasks?: string;
  };
  llmToolSelectorConfig?: {
    model?: string;
    maxTools?: number;
    alwaysInclude?: string[];
    systemPrompt?: string;
  };
  toolRetryConfig?: {
    maxRetries?: number;
    backoffFactor?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    jitter?: boolean;
    onFailure?: "continue" | "error";
    tools?: string[];
  };
  modelRetryConfig?: {
    maxRetries?: number;
    backoffFactor?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    jitter?: boolean;
    onFailure?: "continue" | "error";
  };
  toolEmulatorConfig?: {
    model?: string;
    emulatedTools?: string[];
  };
  contextEditingConfig?: {
    triggerTokens?: number;
    keep?: number;
    clearToolInputs?: boolean;
    excludeTools?: string[];
    placeholder?: string;
  };
  providerToolSearchConfig?: {
    searchableTools?: string[];
  };
  filesystemConfig?: {
    backend?: "state" | "store" | "composite";
    memoriesPath?: string;
    systemPrompt?: string;
    customToolDescriptions?: string;
  };
  subagentConfig?: {
    defaultModel?: string;
    defaultTools?: string[];
    subagentsJson?: string;
  };
  customBody?: string;
  implementationMode?: "natural_language" | "code";
  prompt?: string;
  position?: { x: number; y: number };
}
