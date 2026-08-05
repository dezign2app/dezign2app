export type LangGraphRouterBranch = {
  id: string;
  label: string;
  field: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "is_not_null"
    | "has_tool_calls"
    | "expression";
  value?: string;
  isDefault?: boolean;
  targetId?: string;
};

export type LangGraphRouterConfig = {
  branches: LangGraphRouterBranch[];
};

export type LangGraphStepConfig = {
  id: string;
  name: string;
  type:
    | "llm_call"
    | "tool_node"
    | "evaluator"
    | "summarizer"
    | "custom_code"
    | "human_gate"
    | "interrupt"
    | "vector_search"
    | "router";
  modelConfig?: {
    provider?:
      | "groq"
      | "openai"
      | "anthropic"
      | "google"
      | "other"
      | (string & {});
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    baseUrl?: string;
    url?: string;
    method?: string;
    headersJson?: string;
    bodyJson?: string;
    apiKeyHeader?: string;
    customLlmNodeId?: string;
  };
  humanGateConfig?: {
    approvalPrompt: string;
    timeoutMs?: number;
    requiredRole?: string;
  };
  interruptConfig?: {
    callbackKey: string;
    timeoutMs?: number;
  };
  customCode?: {
    body: string;
    timeoutMs?: number;
    memoryLimitMb?: number;
  };
  routerConfig?: LangGraphRouterConfig;
  tools?: string[];
  retryPolicy?: {
    maxAttempts: number;
    backoffFactor: number;
  };
  stateUpdates?: {
    channelKey: string;
    value?: string;
    mode?: "set" | "append" | "expression";
  }[];
  position?: { x: number; y: number };
};

export type LangGraphEdgeConfig = {
  id: string;
  source: string;
  sourceHandle?: string;
  targetHandle?: string;
  targets: {
    id: string;
    kind: "step" | "port" | "end";
    targetHandle?: string;
  }[];
  condition?: {
    field?: string;
    operator?: string;
    value?: unknown;
  };
  isDefault?: boolean;
  sendConfig?: {
    enabled?: boolean;
    itemsField?: string;
    itemTarget?: { id: string; kind: "step" | "port" | "end" };
    joinStepId?: string;
    batchErrorPolicy?: string;
  };
};
