import type { MessagingResourceType, MessagingNodeType } from "./constants";
import type { ServiceTechStack, ServiceTechVersion, WebClientTechStack, WebClientTechVersion, DatabaseEngine, DatabaseEngineVersion, DatabaseORM, DatabaseOrmVersion } from "./techStack";
export type { MessagingResourceType, MessagingNodeType };
export * from "./techStack";

export type HandleKind =
  // --- Entity (schema view) ---
  | "entity-column-source"
  | "entity-column-target"
  | "entity-top-target"
  | "entity-bottom-source"

  // --- Service endpoints ---
  | "endpoint-in"
  | "endpoint-out"

  // --- WebClient events ---
  | "event-source"
  | "pageload-in"
  | "sse-in"
  | "websocket-in"

  // --- Service messaging ---
  | "published-event-out"
  | "consumed-event-in"
  | "consumed-event-out"

  // --- Messaging resource definitions ---
  | "resource-def-in"
  | "resource-def-out"

  // --- Database (Table Reference) ---
  | "database-target"
  | "database-source"

  // --- External API actions ---
  | "action-target"

  // --- Worker Tasks ---
  | "task-in"
  | "task-out"

  // --- Search Indexes ---
  | "index-in"
  | "index-out"

  // --- LangGraph / LLM Nodes ---
  | "llm-in"
  | "llm-out"
  | "step-in"
  | "step-out"

  // --- Fallback ---
  | "unknown";

export type RejectionCode =
  | "UNKNOWN_SOURCE_KIND"
  | "UNKNOWN_TARGET_KIND"
  | "INVALID_KIND_PAIR"
  | "SELF_CONNECTION"
  | "DUPLICATE_EDGE"
  | "SOURCE_NODE_NOT_FOUND"
  | "TARGET_NODE_NOT_FOUND";

export type ValidationResult =
  | { valid: true; edgeType: string; rulesVersion: number; resourceKind?: string }
  | { valid: false; code: RejectionCode; message: string; suggestion?: string; rulesVersion: number };

export type BackendCanvasView = "graph" | "sequence" | "schema";

// --- Backend Canvas Types ---
import type { KafkaTopic, KafkaBrokerConfig, Endpoint, ProcessingStep, WorkerTask, SearchIndexItem, SearchSource, IdentityProvider } from "./schemas";
export type { KafkaTopic, KafkaBrokerConfig, Endpoint, ProcessingStep, WorkerTask, SearchIndexItem, SearchSource, IdentityProvider };

export type RedisStream = {
  id: string;
  kind: "stream";
  name: string;
  description?: string;
  payloadSchema?: Schema;
  version?: string;
};

export type SQSQueue = {
  id: string;
  kind: "queue";
  name: string;
  description?: string;
  payloadSchema?: Schema;
  version?: string;
};



export type RedisStreamsBrokerConfig = {
  consumerGroup?: string;
};

export type SQSBrokerConfig = {
  visibilityTimeout?: string;
  delay?: string;
  fifo?: boolean;
};

export type RedisPubSubChannel = {
  id: string;
  kind: "channel";
  name: string;
  description?: string;
  payloadSchema?: Schema;
  version?: string;
};

export type RedisPubSubBrokerConfig = {
  db?: string;
  namespace?: string;
};

export type BackendNodeType =
  | "service"
  | "database"
  | "queue"
  | "pubsub"
  | "eventstream"
  | "kafka"
  | "redis-streams"
  | "sqs"
  | "redis-pubsub"
  | "redis-cache"
  | "entity"
  | "webClient"
  | "external"
  | "group"
  | "db_ref"
  | "storage"
  // New node types
  | "worker"
  | "serverless"
  | "search_index"
  | "api_gateway"
  | "load_balancer"
  | "webhook"
  | "llm"
  | "mcp_server"
  | "vector_db_ref"
  | "identity_provider"
  | "langgraph"
  | "langgraph_step";

export type LangGraphStateChannel = {
  key: string;
  type: "messages" | "string" | "json" | "number" | "boolean" | "array" | "object";
  reducer: "add_messages" | "append" | "replace" | "merge_object" | "concat_array";
  defaultValue?: string | number | boolean | Record<string, unknown> | unknown[];
};

export type LangGraphInputChannel = {
  key: string;
  type: "string" | "messages" | "json" | "number" | "boolean" | "object" | "array";
  required?: boolean;
  description?: string;
  defaultValue?: string | number | boolean | Record<string, unknown> | unknown[];
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
  id: string;
  toolId?: string;
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
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "is_not_null" | "has_tool_calls" | "expression";
  value?: string;
  isDefault?: boolean;
};

export type LangGraphRouterConfig = {
  branches: LangGraphRouterBranch[];
};

export type LangGraphStepConfig = {
  id: string;
  name: string;
  type: "llm_call" | "tool_node" | "evaluator" | "summarizer" | "custom_code" | "human_gate" | "interrupt" | "vector_search" | "router";
  modelConfig?: {
    provider?: "groq" | "openai" | "anthropic" | "google" | "other" | (string & {});
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
  targets: { id: string; kind: "step" | "port" | "end"; targetHandle?: string }[];
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

// ---------------------------------------------------------------------------
// BackendNode Data — modular sub-types grouped by domain
// ---------------------------------------------------------------------------

/** Core fields present on every canvas node. */
export interface BaseNodeData {
  label: string;
  description?: string;
  isWebClient?: boolean;
  parentId?: string;
  /** Nested position inside a group node. */
  position?: { x: number; y: number };
  /** Position override used in the graph-view layout. */
  graphPosition?: { x: number; y: number };
  // Tech stack & DB engine selection (shared by Service and Database nodes)
  techStack?: ServiceTechStack | WebClientTechStack;
  techVersion?: ServiceTechVersion | WebClientTechVersion;
  dbEngine?: DatabaseEngine;
  dbEngineVersion?: DatabaseEngineVersion;
  orm?: DatabaseORM;
  ormVersion?: DatabaseOrmVersion;
  // Shared visual / misc
  authentication?: string;
  tags?: string[];
}

/** Database entity / table schema fields (canvas type). */
export interface CanvasEntityNodeData {
  isSchemaGroup?: boolean;
  variant?: string;
  dbType?: "relational" | "document" | "vector";
  /** Column definitions stored as part of the node. */
  columns?: {
    name: string;
    type: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    isNotNull?: boolean;
    isUnique?: boolean;
    references?: { table: string; column: string };
  }[];
  indexes?: {
    name: string;
    columns: string;
    isUnique?: boolean;
  }[];
  /** For vector DB entities. */
  embeddingModel?: string;
  dimensions?: number;
  metric?: "Cosine" | "Dot Product" | "Euclidean";
  /** Reference to entity node ID (used by DB Ref nodes). */
  tableRef?: string;
  /** Reference to vector collection (used by Vector DB Ref nodes). */
  collectionRef?: string;
  /** Reference to DB node (used by Vector DB Ref nodes). */
  dbRef?: string;
  /** Seed data rows for the entity. */
  seedRows?: Record<string, string | number | boolean | null>[];
}

/** Service / web-client node fields — endpoints, routing, CORS, etc. (canvas type). */
export interface CanvasServiceNodeData {
  baseUrl?: string;
  cors?: boolean;
  corsOrigins?: string;
  rateLimit?: string;
  timeout?: string;
  port?: string;
  endpoints?: Endpoint[];
  routeGroups?: {
    id: string;
    name: string;
    basePath: string;
    endpoints: Endpoint[];
  }[];
  // Graph-view event/logic lists (for web clients and services)
  events?: UIEventItem[] | { id: string; name: string }[];
  inputs?: { id: string; name: string }[];
  logic?: { id: string; name: string }[];
  outputs?: { id: string; name: string }[];
  actions?: { id: string; name: string }[];
  publishedEvents?: {
    id: string;
    name: string;
    description?: string;
    schema?: string;
    version?: string;
    targetNodeId?: string;
  }[];
  consumedEvents?: {
    id: string;
    name: string;
    description?: string;
    schema?: string;
    retryPolicy?: string;
    version?: string;
    handlerLogic?: string;
    targetNodeId?: string;
  }[];
}

/** Messaging broker node fields — Kafka, SQS, Redis Streams, PubSub, etc. */
export interface MessagingNodeData {
  // Common broker config
  implementation?: string;
  delivery?: string;
  ordering?: string;
  failureHandling?: string;
  retention?: string;
  durable?: boolean;
  // Resources per broker type
  topics?: KafkaTopic[];
  streams?: RedisStream[];
  queues?: SQSQueue[];
  channels?: RedisPubSubChannel[];
  caches?: AnyMessagingResource[];
  buckets?: AnyMessagingResource[];
  messages?: {
    id: string;
    name: string;
    description?: string;
    schema?: string;
    retryPolicy?: string;
    version?: string;
  }[];
  eventChannels?: {
    id: string;
    name: string;
    description?: string;
    schema?: string;
    version?: string;
  }[];
  // Broker-level configs
  kafkaBroker?: KafkaBrokerConfig;
  redisBroker?: RedisStreamsBrokerConfig;
  sqsBroker?: SQSBrokerConfig;
  redisPubSubBroker?: RedisPubSubBrokerConfig;
  // Kafka topic-level
  kafkaPartitions?: string;
  kafkaReplication?: string;
  kafkaCompression?: string;
  kafkaTTL?: string;
  kafkaBatchSize?: string;
  // RabbitMQ
  rabbitExchange?: string;
  rabbitRoutingKey?: string;
  rabbitBindings?: string;
  // SQS
  sqsVisibilityTimeout?: string;
  sqsDelay?: string;
  sqsFifo?: boolean;
  // Redis Streams
  redisConsumerGroup?: string;
  // GCP Pub/Sub
  gcpTopic?: string;
  gcpSubscription?: string;
  // Azure Service Bus
  azureTopic?: string;
  azureSubscription?: string;
}

/** Background worker node fields (canvas type). */
export interface CanvasWorkerNodeData {
  tasks?: WorkerTask[];
  queueSources?: string[];
  concurrency?: number;
  retryPolicy?: string;
  maxRetries?: number;
}

/** Serverless function node fields (canvas type). */
export interface CanvasServerlessNodeData {
  triggerType?: "HTTP" | "Event" | "CRON" | "Queue";
  runtime?: string;
  memoryMb?: number;
  timeoutSec?: number;
}

/** Infrastructure node fields — API Gateway, Load Balancer, Search Index (canvas type). */
export interface CanvasInfrastructureNodeData {
  // API Gateway
  routes?: GatewayRoute[];
  authRules?: AuthRule[];
  authType?: string;
  // Load Balancer
  targetGroups?: { id: string; name: string }[];
  algorithm?: string;
  healthCheckPath?: string;
  // Search Index
  searchSources?: SearchSource[];
  analyzer?: string;
  shards?: number;
  replicas?: number;
  refreshInterval?: string;
  reindexStrategy?: string;
}

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

/** Identity Provider node fields (canvas type). */
export interface CanvasIdentityProviderNodeData {
  provider?: string;
  issuerUrl?: string;
  discoveryUrl?: string;
  jwksUrl?: string;
  audiences?: string[];
  supportedAlgorithms?: string[];
  customCapabilities?: {
    authentication?: boolean;
    userManagement?: boolean;
    identity?: boolean;
    authorization?: boolean;
  };
  customOutputs?: {
    user?: boolean;
    tokens?: boolean;
    claims?: boolean;
  };
}

/** LangGraph Agent node fields — the parent graph node (canvas type). */
export interface CanvasLangGraphNodeData {
  inputChannels?: LangGraphInputChannel[];
  stateChannels?: LangGraphStateChannel[];
  graphSteps?: LangGraphStepConfig[];
  graphEdges?: LangGraphEdgeConfig[];
  outputPorts?: LangGraphOutputPort[];
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
  modelConfig?: LangGraphStepConfig["modelConfig"];
  streamConfig?: LangGraphAgentStreamConfig;
  responseFormat?: LangGraphAgentResponseFormatConfig;
  memoryConfig?: LangGraphAgentMemoryConfig;
  stateUpdates?: {
    channelKey: string;
    mode?: StateUpdateMode;
    value?: string;
  }[];
  tools?: string[];        // Bound tool IDs
  middleware?: string[];   // Bound middleware IDs
  memory?: string[];       // Bound memory / checkpointer / db_ref IDs
  position?: { x: number; y: number };
}

/** LangGraph Step node fields — child step nodes inside a graph (canvas type). */
export interface CanvasLangGraphStepNodeData {
  stepId?: string;
  stepType?: "llm_call" | "tool_node" | "evaluator" | "summarizer" | "custom_code" | "human_gate" | "interrupt" | "vector_search" | "router";
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

/**
 * Composite data payload for every BackendNode.
 * All domain-specific fields are optional; only `BaseNodeData.label` is required.
 * Sub-type interfaces are prefixed with `Canvas` to avoid naming conflicts
 * with the Zod-inferred schema types in `@workspace/canvas/schemas`.
 */
export type BackendNodeData =
  BaseNodeData &
  Partial<
    CanvasEntityNodeData &
    CanvasServiceNodeData &
    MessagingNodeData &
    CanvasWorkerNodeData &
    CanvasServerlessNodeData &
    CanvasInfrastructureNodeData &
    CanvasAINodeData &
    CanvasIdentityProviderNodeData &
    CanvasLangGraphNodeData &
    CanvasLangGraphStepNodeData
  >;

export type BackendNode = {
  id: string;
  type: BackendNodeType;
  position: { x: number; y: number };
  data: BackendNodeData;
  fractionalIndex: string; // For Z-order
  parentId?: string;
  style?: Record<string, string | number | boolean | null | undefined>;
  width?: number;
  height?: number;
  selected?: boolean;
};

export type BackendEdgeType = "connection" | "foreign-key" | "message" | "identity-connection";

export type BackendEdge = {
  id: string;
  source: string;
  target: string;
  type: BackendEdgeType;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  sourceResourceId?: string;
  targetResourceId?: string;
  resourceType?: MessagingResourceType;
  data?: {
    label?: string;
    sequenceOrder?: number;
    sourceCardinality?: "1" | "N";
    targetCardinality?: "1" | "N";
    // --- Identity Connection Fields ---
    protocol?: string;
    grantType?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUris?: string[];
    pkce?: boolean;
    scopes?: string[];
    responseType?: string;
    responseMode?: string;
    notes?: string;
  };
  fractionalIndex: string; // For sequence diagram ordering
};

export type BackendDesignDoc = {
  schemaVersion?: number;
  nodes: BackendNode[];
  edges: BackendEdge[];
};

// --- AI Adapter Types ---

export type CanvasOperation =
  | { op: "add_node"; type: BackendNodeType; label: string; position?: { x: number; y: number }; data?: Partial<BackendNode["data"]> }
  | { op: "update_node"; id: string; changes: Partial<BackendNode> }
  | { op: "delete_node"; id: string }
  | { op: "add_edge"; source: string; target: string; type: BackendEdgeType; data?: Partial<BackendEdge["data"]> }
  | { op: "update_edge"; id: string; changes: Partial<BackendEdge> }
  | { op: "delete_edge"; id: string }
  | { op: "run_auto_layout" }
  | { op: "add_shape"; type: string; x: number; y: number; props: Record<string, string | number | boolean | null> }
  | { op: "update_shape"; id: string; props: Record<string, string | number | boolean | null> }
  | { op: "delete_shape"; id: string };

export interface CanvasAdapter<TDoc> {
  getState: () => TDoc;
  applyOperations: (ops: CanvasOperation[]) => void;
  serialize: () => string; // For AI context
}


// --- Enums & Primitives ---

export type IdPCapabilities = {
  authentication: boolean;
  userManagement: boolean;
  identity: boolean;
  authorization: boolean;
};

export type IdPOutputs = {
  user: boolean;
  tokens: boolean;
  claims: boolean;
};

export type IdentityProviderPreset = {
  provider: string;
  issuerUrl: string;
  discoveryUrl?: string;
  jwksUrl: string;
  supportedAlgorithms: string[];
  capabilities: IdPCapabilities;
  outputs: IdPOutputs;
};

export const IDENTITY_PROVIDER_PRESETS: Record<string, IdentityProviderPreset> = {
  auth0: { 
    provider: "Auth0", 
    issuerUrl: "https://<tenant>.auth0.com/", 
    discoveryUrl: "https://<tenant>.auth0.com/.well-known/openid-configuration",
    jwksUrl: "https://<tenant>.auth0.com/.well-known/jwks.json", 
    supportedAlgorithms: ["RS256"],
    capabilities: { authentication: true, userManagement: true, identity: false, authorization: true },
    outputs: { user: true, tokens: true, claims: true }
  },
  clerk: { 
    provider: "Clerk", 
    issuerUrl: "https://clerk.<your-domain>.com", 
    discoveryUrl: "https://clerk.<your-domain>.com/.well-known/openid-configuration",
    jwksUrl: "https://clerk.<your-domain>.com/.well-known/jwks.json", 
    supportedAlgorithms: ["RS256"],
    capabilities: { authentication: true, userManagement: true, identity: false, authorization: true },
    outputs: { user: true, tokens: true, claims: true }
  },
  keycloak: { 
    provider: "Keycloak", 
    issuerUrl: "https://<domain>/realms/<realm>", 
    discoveryUrl: "https://<domain>/realms/<realm>/.well-known/openid-configuration",
    jwksUrl: "https://<domain>/realms/<realm>/protocol/openid-connect/certs", 
    supportedAlgorithms: ["RS256"],
    capabilities: { authentication: true, userManagement: true, identity: true, authorization: true },
    outputs: { user: true, tokens: true, claims: true }
  },
  okta: { 
    provider: "Okta", 
    issuerUrl: "https://<domain>.okta.com/oauth2/default", 
    discoveryUrl: "https://<domain>.okta.com/oauth2/default/.well-known/openid-configuration",
    jwksUrl: "https://<domain>.okta.com/oauth2/default/v1/keys", 
    supportedAlgorithms: ["RS256"],
    capabilities: { authentication: true, userManagement: true, identity: true, authorization: true },
    outputs: { user: true, tokens: true, claims: true }
  },
  cognito: { 
    provider: "AWS Cognito", 
    issuerUrl: "https://cognito-idp.<region>.amazonaws.com/<pool-id>", 
    discoveryUrl: "https://cognito-idp.<region>.amazonaws.com/<pool-id>/.well-known/openid-configuration",
    jwksUrl: "https://cognito-idp.<region>.amazonaws.com/<pool-id>/.well-known/jwks.json", 
    supportedAlgorithms: ["RS256"],
    capabilities: { authentication: true, userManagement: true, identity: true, authorization: true },
    outputs: { user: true, tokens: true, claims: true }
  },
  firebase: { 
    provider: "Firebase", 
    issuerUrl: "https://securetoken.google.com/<project-id>", 
    discoveryUrl: "https://securetoken.google.com/<project-id>/.well-known/openid-configuration",
    jwksUrl: "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com", 
    supportedAlgorithms: ["RS256"],
    capabilities: { authentication: true, userManagement: true, identity: true, authorization: false },
    outputs: { user: true, tokens: true, claims: true }
  },
  supabase: { 
    provider: "Supabase", 
    issuerUrl: "https://<project-ref>.supabase.co/auth/v1", 
    discoveryUrl: "https://<project-ref>.supabase.co/auth/v1/.well-known/openid-configuration",
    jwksUrl: "https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json", 
    supportedAlgorithms: ["RS256"],
    capabilities: { authentication: true, userManagement: true, identity: true, authorization: true },
    outputs: { user: true, tokens: true, claims: true }
  },
  entraid: { 
    provider: "Azure Entra ID", 
    issuerUrl: "https://login.microsoftonline.com/<tenant-id>/v2.0", 
    discoveryUrl: "https://login.microsoftonline.com/<tenant-id>/v2.0/.well-known/openid-configuration",
    jwksUrl: "https://login.microsoftonline.com/<tenant-id>/discovery/v2.0/keys", 
    supportedAlgorithms: ["RS256"],
    capabilities: { authentication: true, userManagement: true, identity: true, authorization: true },
    outputs: { user: true, tokens: true, claims: true }
  },
  oidc: { 
    provider: "OpenID Connect", 
    issuerUrl: "https://<domain>", 
    discoveryUrl: "https://<domain>/.well-known/openid-configuration",
    jwksUrl: "https://<domain>/.well-known/jwks.json", 
    supportedAlgorithms: ["RS256"],
    capabilities: { authentication: true, userManagement: false, identity: false, authorization: false },
    outputs: { user: true, tokens: true, claims: true }
  },
  custom: { 
    provider: "Custom JWT", 
    issuerUrl: "", 
    discoveryUrl: "",
    jwksUrl: "", 
    supportedAlgorithms: ["RS256"],
    capabilities: { authentication: false, userManagement: false, identity: false, authorization: false },
    outputs: { user: false, tokens: false, claims: false }
  }
} as const;

export type RetryPolicy = "NONE" | "IMMEDIATE" | "EXPONENTIAL";
export type DeliveryGuarantee = "EXACTLY_ONCE" | "AT_LEAST_ONCE" | "AT_MOST_ONCE" | "FIRE_AND_FORGET";
export type EventOrdering = "NONE" | "GLOBAL" | "PER_ENTITY" | "PER_AGGREGATE";
export type EventCategory = "DOMAIN" | "INTEGRATION" | "INTERNAL" | "NOTIFICATION";
export type SchemaVersion = "v1" | "v2" | "v3";

export * from "./techStack";

export type ArchitectureMetadata = {
  createdAt?: number;
  updatedAt?: number;
  createdByAI?: boolean;
};

export type GatewayRoute = {
  id: string;
  name: string;
  method?: string;
  service?: string;
  authRuleId?: string;
};



export type AuthRule =
  | { type: "jwt"; id: string; name: string; description?: string; config: { providerId?: string; algorithms?: string[] } }
  | { type: "oauth2"; id: string; name: string; description?: string; config: { providerId?: string; algorithms?: string[] } }
  | { type: "apiKey"; id: string; name: string; description?: string; config: { headerName?: string } }
  | { type: "mtls"; id: string; name: string; description?: string; config: { clientCa?: string } }
  | { type: "basic"; id: string; name: string; description?: string; config?: Record<string, never> }
  | { type: "none"; id: string; name: string; description?: string; config?: Record<string, never> };

export type Parameter = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  key?: string;
  value?: string;
};

export type Schema = {
  id: string;
  rawJson?: string;
};



export type ProcessingOperation =
  | "passthrough"
  | "validate"
  | "pick"
  | "omit"
  | "rename"
  | "set"
  | "filter"
  | "map"
  | "db_get"
  | "db_get_many"
  | "db_insert"
  | "db_update"
  | "db_delete"
  | "return";

// --- Event Models (Producer-Owned Contracts) ---

export type PublishedEvent = {
  id: string; // The canonical Event ID
  name: string; // e.g., chat.message.sent
  publishedWhen: string; // e.g. "Message successfully persisted"
  
  // Topic Mapping
  brokerNodeId: string; 
  messagingResourceId: string;
  
  // Contract
  payloadSchema: Schema;
  version: SchemaVersion;
  category: EventCategory;
  delivery: DeliveryGuarantee;
  ordering: EventOrdering;
  correlationId?: string;
  
  // Lifecycle
  deprecated: boolean;
  replacementEventId?: string;
  
  metadata?: ArchitectureMetadata;
};

export type ConsumedEvent = {
  id: string; // Consumer instance ID
  eventId: string; // References the PublishedEvent's canonical ID
  
  // Topic Mapping
  brokerNodeId: string; 
  messagingResourceId: string;
  
  // Consumer Behavior
  retryPolicy: RetryPolicy;
  maxRetries?: number;
  deadLetterQueue?: string; // e.g. "chat.failed.messages"
  isIdempotent: boolean;
  
  metadata?: ArchitectureMetadata;
};

// UI Specific Types
export type UIEventItem = {
  id: string;
  name: string;
  event?: string;
  schema?: string;
  testCases?: SimulationTestCase[];
};

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue }
export interface JSONArray extends Array<JSONValue> {}

/** A global simulation scenario. */
export type SimulationTestCase = {
  id: string;
  name: string;
  targetNodeId: string;
  targetEventId?: string;
  request?: {
    headers?: Record<string, string>;
    params?: Record<string, string>;
    body?: JSONValue;
  };
  expectedStatus?: number;
  expectedBody?: JSONValue;
  enabled?: boolean;
  mocks?: Record<string, { returnData: JSONValue; status: number }>;
  expectedPath?: string[];
};

export type AnyMessagingResource = {
  id: string;
  name: string;
  _legacyName?: string;
  kind?: string;
  description?: string;
  publishedWhen?: string;
  payloadSchema?: Schema;
  handlerLogic?: string;
  retryPolicy?: RetryPolicy | string;
  maxRetries?: number;
  deadLetterQueue?: string;
  isIdempotent?: boolean;
  version?: SchemaVersion | string;
  category?: EventCategory | string;
  delivery?: DeliveryGuarantee | string;
  brokerNodeId?: string;
  messagingResourceId?: string;
  
  // Storage specific fields
  storageType?: string;
  storageTypeOther?: string;
  storedDataTypes?: string[];
  storedDataTypesOther?: string;

  // Cache specific fields
  ttl?: string;
  cacheEviction?: string;
  cacheDataType?: string;
  keyPrefix?: string; // legacy, can keep for compatibility
  namespace?: string;
  keyPattern?: string;
  cacheStrategy?: string;
  sourceOfTruth?: string;
  invalidationRules?: string;
  compression?: string;
  serialization?: string;
  maxObjectSize?: string;
  persistence?: string;
  replication?: string;
};



// --- Input Types (for AI tools & Store operations) ---

export interface ParameterInputType {
  id?: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  key?: string;
  value?: string;
}

export interface PublishedEventInputType {
  id?: string;
  name: string;
  kind?: string;
  schema?: string;
  targetNodeId?: string;
  targetResourceId?: string;
}

export interface ConsumedEventInputType {
  id?: string;
  name: string;
  kind?: string;
  schema?: string;
  handlerLogic?: string;
  targetNodeId?: string;
  targetResourceId?: string;
}

export interface EndpointInputType {
  id?: string;
  name: string;
  type: string;
  headers?: ParameterInputType[];
  pathParams?: ParameterInputType[];
  queryParams?: ParameterInputType[];
  requestBody?: { fields: ParameterInputType[] };
  responseBody?: { fields: ParameterInputType[] };
  simulationOutput?: unknown;
  processingSteps?: { id?: string; text: string; operation?: string; config?: Record<string, string | number | boolean | null> }[];
  output?: string;
  businessLogic?: string;
  summary?: string;
  requiredRoles?: string[];
  requiredScopes?: string[];
  audience?: string;
  databaseNodeIds?: string[];
  databaseNodeId?: string;
  publishedEvents?: PublishedEventInputType[];
}

export interface TestCaseItem {
  id?: string;
  testCaseId?: string;
  name?: string;
  targetNodeId?: string;
  nodeId?: string;
  targetEventId?: string;
  request?: {
    headers?: Record<string, string>;
    params?: Record<string, string>;
    body?: unknown;
  };
  expectedStatus?: number;
  expectedBody?: unknown;
}

// BackendNodeData is defined above (composite of all node domain sub-types).
// BackendNodeItem is kept for AI tool / store compatibility.
export interface BackendNodeItem {
  nodeId: string;
  type?: string;
  data?: BackendNodeData;
}

