import type { Node, Edge } from "@xyflow/react";
import {
  LANGGRAPH_CANVAS_NODE_STEP,
  LANGGRAPH_CANVAS_NODE_START,
  LANGGRAPH_CANVAS_NODE_END,
  LANGGRAPH_CANVAS_NODE_PORT,
  LANGGRAPH_CANVAS_NODE_STATE_GLOBAL,
  LANGGRAPH_CANVAS_NODE_LLM,
  LANGGRAPH_CANVAS_NODE_TOOL,
  LANGGRAPH_CANVAS_NODE_MIDDLEWARE,
  LANGGRAPH_CANVAS_NODE_NODE,
  LANGGRAPH_CANVAS_NODE_AGENT,
  LANGGRAPH_CANVAS_NODE_MEMORY,
  LANGGRAPH_CANVAS_NODE_OUTPUT,
} from "../constants";

export type LangGraphStateChannel = {
  key: string;
  type:
    | "messages"
    | "string"
    | "json"
    | "number"
    | "boolean"
    | "array"
    | "object";
  reducer:
    | "add_messages"
    | "append"
    | "replace"
    | "merge_object"
    | "concat_array";
  defaultValue?:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | unknown[];
};

export type LangGraphInputChannel = {
  key: string;
  type:
    | "string"
    | "messages"
    | "json"
    | "number"
    | "boolean"
    | "object"
    | "array";
  required?: boolean;
  description?: string;
  defaultValue?:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | unknown[];
};

export type LangGraphOutputPort = {
  id: string;
  label: string;
  description?: string;
};

export type McpServerConnection = {
  id: string;
  name: string;
  url: string;
  transport?: "sse" | "http";
  authRef?: string;
};

export type ToolSource = "inline" | "mcp_server" | "api_endpoint";
export type ToolReturnType = "string" | "object" | "content_blocks" | "command";
export type StateUpdateMode = "set" | "append" | "expression";
export type StoreOperation = "get" | "put" | "delete" | "list";

export type LangGraphToolDefinition = {
  id?: string;
  toolId?: string;
  label?: string;
  name: string;
  description: string;
  inputSchema?: string;

  source: ToolSource;
  endpointUrl?: string;
  mcpConnectionId?: string;
  remoteToolName?: string;

  returnDirect?: boolean;
  returnType?: ToolReturnType;
  outputSchema?: string;
  commandConfig?: {
    stateUpdates: {
      channelKey: string;
      mode?: StateUpdateMode;
      value?: string;
    }[];
  };

  functionBody?: string;
  implementationMode?: "natural_language" | "code";
  prompt?: string;
  executionMode?: "sandboxed_vm" | "disabled";
  headless?: boolean;

  contextAccess?: { enabled?: boolean; fields?: string[] };
  storeAccess?: {
    enabled?: boolean;
    namespace?: string;
    operations?: StoreOperation[];
  };
  streamWriter?: boolean;

  errorHandling?: {
    enabled?: boolean;
    retryCount?: number;
    customErrorMessage?: string;
  };

  position?: { x: number; y: number };
};

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

export type LangGraphMemoryConfig = {
  checkpointer?: "convex" | "redis" | "postgres" | "memory";
  checkpointerConnectionId?: string;
  threadScope?: "session" | "user" | "global";
  autoSummarize?: boolean;
  maxWindowMessages?: number;
  vectorStore?: {
    enabled?: boolean;
    provider?: "convex" | "pinecone" | "pgvector" | "qdrant";
    embeddingModel?: string;
    collection?: string;
    topK?: number;
    similarityThreshold?: number;
  };
};

/** AI / LLM / MCP Server node fields (canvas type). */
export interface CanvasAINodeData {
  // LLM Node
  model?: string;
  temperature?: number;
  maxTokens?: number;
  structuredOutput?: boolean;
  toolCalling?: boolean;
  prompts?: { id: string; name: string }[];
  tools?: { id: string; name: string }[];
  // MCP Server Node
  resources?: { id: string; name: string }[];
  connectionType?: "stdio" | "SSE" | "HTTP";
}

export interface OutputChannelConfig {
  id: string;
  name: string;
  type: "sse" | "websocket" | "event" | "webhook" | "rest";
  topicOrEventName?: string;
  targetStateChannel?: string;
  description?: string;
  streamContentMode?:
    | "ai_node_tokens"
    | "structured_output"
    | "step_output"
    | "full_state";
  sourceStepId?: string;
  boundRouteIds?: string[];
  schemaJson?: string;
  position?: { x: number; y: number };
}

/** LangGraph Agent node fields — the parent graph node (canvas type). */
export interface CanvasLangGraphNodeData {
  label?: string;
  description?: string;
  inputChannels?: LangGraphInputChannel[];
  stateChannels?: LangGraphStateChannel[];
  graphSteps?: LangGraphStepConfig[];
  graphEdges?: LangGraphEdgeConfig[];
  outputPorts?: LangGraphOutputPort[];
  outputChannels?: OutputChannelConfig[];
  memoryConfig?: LangGraphMemoryConfig;
  customLlmNodes?: {
    id: string;
    label: string;
    provider?: string;
    url?: string;
    baseUrl?: string;
    method?: string;
    headersJson?: string;
    bodyJson?: string;
    model?: string;
    apiKeyHeader?: string;
    temperature?: number;
    maxTokens?: number;
    position?: { x: number; y: number };
  }[];
  toolDefinitions?: LangGraphToolDefinition[];
  middlewareDefinitions?: LangGraphMiddlewareDefinition[];
  agentDefinitions?: LangGraphAgentDefinition[];
  memoryDefinitions?: LangGraphMemoryDefinition[];
  mcpServerConnections?: McpServerConnection[];
  startNodePosition?: { x: number; y: number };
  stateNodePosition?: { x: number; y: number };
  endNodePosition?: { x: number; y: number };
  endNodes?: {
    id: string;
    label?: string;
    position?: { x: number; y: number };
  }[];
}

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

export type LangGraphEventStreamType =
  | "stream.messages"
  | "message.text"
  | "message.reasoning"
  | "message.toolCalls"
  | "stream.toolCalls"
  | "stream.values"
  | "stream.output"
  | "stream.subagents"
  | "stream.extensions";

export interface LangGraphAgentStreamConfig {
  enabled?: boolean;
  version?: "v3" | "v2" | string;
  selectedEvents?: string[];
  eventSignature?: string;
  customTransformers?: string;
}

export interface LangGraphAgentResponseFormatConfig {
  enabled?: boolean;
  strategy?: "auto" | "provider" | "tool";
  schemaType?: "json_schema" | "zod" | "standard_schema";
  schemaName?: string;
  schemaJson?: string;
  toolMessageContent?: string;
  handleErrorMode?: "default" | "custom_message" | "disabled";
  customErrorMessage?: string;
}

export interface LangGraphAgentMemoryConfig {
  enabled?: boolean;
  checkpointer?: string;
  threadIdKey?: string;
  threadScope?: "session" | "user" | "global";
  autoSummarize?: boolean;
  maxWindowMessages?: number;
  saveMessages?: boolean;
}

export interface LangGraphMemoryDefinition {
  id?: string;
  memoryId?: string;
  name: string;
  checkpointer: string;
  threadIdKey?: string;
  threadScope?: "session" | "user" | "global";
  autoSummarize?: boolean;
  maxWindowMessages?: number;
  saveMessages?: boolean;
  position?: { x: number; y: number };
}

export interface LangGraphAgentDefinition {
  id?: string;
  agentId?: string;
  name: string;
  systemPrompt?: string;
  llmNodeId?: string;
  modelConfig?: LangGraphStepConfig["modelConfig"];
  llmConfig?: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    temperature?: number;
  };
  stateUpdatesConfig?: {
    enabled?: boolean;
  };
  streamConfig?: LangGraphAgentStreamConfig;
  responseFormat?: LangGraphAgentResponseFormatConfig;
  memoryConfig?: LangGraphAgentMemoryConfig;
  stateUpdates?: {
    channelKey: string;
    mode?: StateUpdateMode;
    value?: string;
  }[];
  tools?: string[]; // Bound tool IDs
  middleware?: string[]; // Bound middleware IDs
  memory?: string[]; // Bound memory / checkpointer / db_ref IDs
  position?: { x: number; y: number };
}

/** LangGraph Step node fields — child step nodes inside a graph (canvas type). */
export interface CanvasLangGraphStepNodeData {
  stepId?: string;
  stepType?:
    | "llm_call"
    | "tool_node"
    | "evaluator"
    | "summarizer"
    | "custom_code"
    | "human_gate"
    | "interrupt"
    | "vector_search"
    | "router";
  modelConfig?: LangGraphStepConfig["modelConfig"];
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
  routerConfig?: LangGraphStepConfig["routerConfig"];
}

export interface LLMConfigState {
  enabled: boolean;
  provider: string;
  model: string;
  temperature: number;
}

export interface StateUpdatesConfigState {
  enabled: boolean;
}

export interface UseLangGraphCanvasNodeReturn {
  isEditingName: boolean;
  setIsEditingName: (editing: boolean) => void;
  nameValue: string;
  setNameValue: (val: string) => void;
  isExpanded: boolean;
  toggleExpand: () => void;
  handleDelete: () => void;
  handleNameSave: () => void;
  boundLLMs: Edge[];
  boundTools: Edge[];
  boundMiddlewares: Edge[];
  boundMemories: Edge[];
  llmConfig: LLMConfigState;
  stateUpdatesConfig: StateUpdatesConfigState;
  streamConfig: LangGraphAgentStreamConfig;
  responseFormat: LangGraphAgentResponseFormatConfig;
  memoryConfig: LangGraphAgentMemoryConfig;
  stateUpdates: Array<{ channelKey: string; mode?: string; value?: string }>;
  availableFields: string[];
  updateAgentData: (changes: Partial<CanvasNodeData>) => void;
  handleToggleLLMConfig: (enabled: boolean) => void;
  handleToggleStateUpdates: (enabled: boolean) => void;
  handleToggleStreaming: (enabled: boolean) => void;
  handleToggleResponseFormat: (enabled: boolean) => void;
  handleToggleMemory: (enabled: boolean) => void;
  handleToggleEvent: (eventId: string) => void;
}

export interface MiddlewareNodeData
  extends LangGraphMiddlewareDefinition,
    Record<string, unknown> {
  label: string;
  onDeleteMiddleware?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
}

export interface MemoryNodeData
  extends LangGraphMemoryDefinition,
    Record<string, unknown> {
  label: string;
  onDeleteMemory?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
}

export interface CanvasNodeData
  extends LangGraphAgentDefinition,
    Record<string, unknown> {
  label: string;
  isExpanded?: boolean;
  llmConfig?: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    temperature?: number;
  };
  stateUpdatesConfig?: {
    enabled?: boolean;
  };
  stateUpdates?: {
    channelKey: string;
    mode?: StateUpdateMode;
    value?: string;
  }[];
  availableStateChannels?: LangGraphStateChannel[];
  onDeleteAgent?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
}

export type AgentNodeData = CanvasNodeData;

export interface LangGraphLLMNodeData extends Record<string, unknown> {
  label: string;
  llmId: string;
  provider?:
    | "openai"
    | "anthropic"
    | "google"
    | "groq"
    | "ollama"
    | "custom"
    | (string & {});
  url?: string;
  baseUrl?: string;
  method?: "POST" | "GET" | "PUT" | string;
  headersJson?: string;
  apiKeyHeader?: string;
  model?: string;
  systemPrompt?: string;
  bodyJson?: string;
  temperature?: number;
  maxTokens?: number;
  onDeleteLLM?: () => void;
}

export type CustomLLMNodeData = LangGraphLLMNodeData;

export interface ToolNodeData extends Record<string, unknown> {
  label: string;
  toolId: string;
  name: string;
  description: string;
  inputSchema?: string;

  source: "inline" | "mcp_server" | "api_endpoint";
  endpointUrl?: string;
  mcpConnectionId?: string;
  remoteToolName?: string;

  returnDirect?: boolean;
  returnType?: "string" | "object" | "content_blocks" | "command";
  outputSchema?: string;
  commandConfig?: {
    stateUpdates: {
      channelKey: string;
      mode?: "set" | "append" | "expression";
      value?: string;
    }[];
  };

  functionBody?: string;
  implementationMode?: "natural_language" | "code";
  prompt?: string;
  executionMode?: "sandboxed_vm" | "disabled";
  headless?: boolean;

  contextAccess?: { enabled?: boolean; fields?: string[] };
  storeAccess?: {
    enabled?: boolean;
    namespace?: string;
    operations?: ("get" | "put" | "delete" | "list")[];
  };
  streamWriter?: boolean;

  errorHandling?: {
    enabled?: boolean;
    retryCount?: number;
    customErrorMessage?: string;
  };

  onDeleteTool?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
}

export interface StepNodeData extends Record<string, unknown> {
  label: string;
  stepId: string;
  stepType: LangGraphStepConfig["type"];
  modelConfig?: LangGraphStepConfig["modelConfig"];
  humanGateConfig?: LangGraphStepConfig["humanGateConfig"];
  customCode?: LangGraphStepConfig["customCode"];
  routerConfig?: LangGraphStepConfig["routerConfig"];
  stateUpdates?: LangGraphStepConfig["stateUpdates"];
  availableStateChannels?: LangGraphStateChannel[];
  activeBranchId?: string;
  onDeleteStep?: () => void;
  onOpenInspector?: () => void;
  onOpenInspectorRoute?: (branchId: string) => void;
  onSelectNode?: () => void;
}

export interface StartNodeData extends Record<string, unknown> {
  label: string;
  inputChannels?: LangGraphInputChannel[];
}

export interface EndNodeData extends Record<string, unknown> {
  label: string;
}

export interface PortNodeData extends Record<string, unknown> {
  label: string;
  portId: string;
}

export interface StateGlobalNodeData extends Record<string, unknown> {
  label: string;
  stateChannels: LangGraphStateChannel[];
  onOpenStateTab?: () => void;
  onAddChannel?: () => void;
}

export interface OutputNodeData
  extends OutputChannelConfig,
    Record<string, unknown> {
  label: string;
  onDeleteOutput?: () => void;
  onOpenInspector?: () => void;
  onSelectNode?: () => void;
}

export type BaseCanvasNodeProps = {
  className?: string;
  style?: React.CSSProperties;
};

export type LangGraphLLMNode = Node<
  LangGraphLLMNodeData,
  typeof LANGGRAPH_CANVAS_NODE_LLM
> &
  BaseCanvasNodeProps;
export type CustomLLMNode = LangGraphLLMNode;

export type StepNode = Node<StepNodeData, typeof LANGGRAPH_CANVAS_NODE_STEP> &
  BaseCanvasNodeProps;

export type StartNode = Node<
  StartNodeData,
  typeof LANGGRAPH_CANVAS_NODE_START
> &
  BaseCanvasNodeProps;

export type EndNode = Node<EndNodeData, typeof LANGGRAPH_CANVAS_NODE_END> &
  BaseCanvasNodeProps;

export type PortNode = Node<PortNodeData, typeof LANGGRAPH_CANVAS_NODE_PORT> &
  BaseCanvasNodeProps;

export type StateGlobalNode = Node<
  StateGlobalNodeData,
  typeof LANGGRAPH_CANVAS_NODE_STATE_GLOBAL
> &
  BaseCanvasNodeProps;

export type ToolNode = Node<ToolNodeData, typeof LANGGRAPH_CANVAS_NODE_TOOL> &
  BaseCanvasNodeProps;

export type MiddlewareNode = Node<
  MiddlewareNodeData,
  typeof LANGGRAPH_CANVAS_NODE_MIDDLEWARE
> &
  BaseCanvasNodeProps;

export type CanvasNode = Node<
  CanvasNodeData,
  typeof LANGGRAPH_CANVAS_NODE_NODE | typeof LANGGRAPH_CANVAS_NODE_AGENT
> &
  BaseCanvasNodeProps;

export type AgentNode = CanvasNode;

export type MemoryNode = Node<
  MemoryNodeData,
  typeof LANGGRAPH_CANVAS_NODE_MEMORY
> &
  BaseCanvasNodeProps;

export type OutputNode = Node<
  OutputNodeData,
  typeof LANGGRAPH_CANVAS_NODE_OUTPUT
> &
  BaseCanvasNodeProps;

export type LangGraphCanvasEdge = Edge & {
  selected?: boolean;
};

export type LangGraphCanvasNodeUnion =
  | StepNode
  | StartNode
  | EndNode
  | PortNode
  | StateGlobalNode
  | LangGraphLLMNode
  | ToolNode
  | MiddlewareNode
  | CanvasNode
  | MemoryNode
  | OutputNode;

export type LangGraphCanvasNode = LangGraphCanvasNodeUnion;

export function getStepData(node: LangGraphCanvasNode): StepNodeData | null {
  if (node.type === LANGGRAPH_CANVAS_NODE_STEP) return node.data;
  return null;
}

export type LangGraphCanvasNodeAddType =
  | LangGraphStepConfig["type"]
  | typeof LANGGRAPH_CANVAS_NODE_LLM
  | typeof LANGGRAPH_CANVAS_NODE_TOOL
  | typeof LANGGRAPH_CANVAS_NODE_MIDDLEWARE
  | typeof LANGGRAPH_CANVAS_NODE_NODE
  | typeof LANGGRAPH_CANVAS_NODE_AGENT
  | typeof LANGGRAPH_CANVAS_NODE_MEMORY
  | typeof LANGGRAPH_CANVAS_NODE_END
  | typeof LANGGRAPH_CANVAS_NODE_OUTPUT;


