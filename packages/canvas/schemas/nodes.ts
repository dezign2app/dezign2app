import { z } from "zod";
import { schemaModelSchema } from "./shared";
import { endpointSchema, endpointInputSchema } from "./endpoints";
import { consumedEventSchema, consumedEventInputSchema, publishedEventSchema, publishedEventInputSchema } from "./events";
import {
  ALL_TECH_STACK_VALUES,
  ALL_TECH_VERSION_VALUES,
  ALL_DATABASE_ENGINE_VALUES,
  ALL_DATABASE_ENGINE_VERSION_VALUES,
  ALL_DATABASE_ORM_VALUES,
  ALL_DATABASE_ORM_VERSION_VALUES,
} from "../techStack";
import { ALL_LLM_PROVIDER_VALUES, DEFAULT_LLM_PROVIDER, DEFAULT_LLM_MODEL, DEFAULT_LLM_TEMPERATURE } from "../constants";

export const baseNodeDataSchema = z.object({
  label: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  parentId: z.string().optional(),
  style: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  techStack: z.enum(ALL_TECH_STACK_VALUES).optional(),
  techVersion: z.enum(ALL_TECH_VERSION_VALUES).optional(),
  dbEngine: z.enum(ALL_DATABASE_ENGINE_VALUES).optional(),
  dbEngineVersion: z.enum(ALL_DATABASE_ENGINE_VERSION_VALUES).optional(),
  orm: z.enum(ALL_DATABASE_ORM_VALUES).optional(),
  ormVersion: z.enum(ALL_DATABASE_ORM_VERSION_VALUES).optional(),
});

export const resourceItemSchema = z.object({
  id: z.string().default(""),
  name: z.string(),
  payloadSchema: schemaModelSchema.optional(),
  kind: z.string().optional(),
  storageType: z.string().optional(),
  storageTypeOther: z.string().optional(),
  storedDataTypes: z.array(z.string()).optional(),
  storedDataTypesOther: z.string().optional(),
  ttl: z.string().optional(),
  cacheEviction: z.string().optional(),
  cacheDataType: z.string().optional(),
  keyPrefix: z.string().optional(),
  description: z.string().optional(),
  namespace: z.string().optional(),
  keyPattern: z.string().optional(),
  cacheStrategy: z.string().optional(),
  sourceOfTruth: z.string().optional(),
  invalidationRules: z.string().optional(),
  compression: z.string().optional(),
  serialization: z.string().optional(),
  maxObjectSize: z.string().optional(),
  persistence: z.string().optional(),
  replication: z.string().optional(),
  publishedWhen: z.string().optional(),
  handlerLogic: z.string().optional(),
  retryPolicy: z.string().optional(),
  maxRetries: z.number().optional(),
  deadLetterQueue: z.string().optional(),
  isIdempotent: z.boolean().optional(),
  version: z.string().optional(),
  category: z.string().optional(),
  delivery: z.string().optional(),
  brokerNodeId: z.string().optional(),
  messagingResourceId: z.string().optional(),
  schema: z.string().optional(),
  _legacyName: z.string().optional(),
});

export const simpleDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
}).strict();

export const dbRefDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  tableRef: z.string().optional(),
  graphPosition: z.object({ x: z.number(), y: z.number() }).optional(),
}).strict();

export const dbRefDataInputSchema = dbRefDataSchema;

export const entityDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  dbType: z.enum(["relational", "vector"]).optional(),
  embeddingModel: z.string().optional(),
  dimensions: z.number().optional(),
  metric: z.enum(["Cosine", "Dot Product", "Euclidean"]).optional(),
  columns: z.array(z.object({
    name: z.string(),
    type: z.string(),
    isPrimaryKey: z.boolean().optional(),
    isForeignKey: z.boolean().optional(),
    isNotNull: z.boolean().optional(),
    isUnique: z.boolean().optional(),
    references: z.object({
      table: z.string(),
      column: z.string(),
    }).optional(),
  })),
  indexes: z.array(z.object({
    name: z.string(),
    columns: z.string(),
    isUnique: z.boolean().optional(),
  })).optional(),
}).strict();

export const entityColumnInputSchema = z.object({
  name: z.string(),
  type: z.string(),
  isPrimaryKey: z.boolean().optional(),
  isForeignKey: z.boolean().optional(),
  isNotNull: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  references: z.object({
    table: z.string(),
    column: z.string(),
  }).optional().describe("If this is a foreign key, which table and column it references in this group"),
});

export const entityDataInputSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  dbType: z.enum(["relational", "vector"]).optional(),
  embeddingModel: z.string().optional(),
  dimensions: z.number().optional(),
  metric: z.enum(["Cosine", "Dot Product", "Euclidean"]).optional(),
  columns: z.array(entityColumnInputSchema),
});

export const kafkaTopicSchema = resourceItemSchema.extend({
  kind: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  schema: z.string().optional(),
  payloadSchema: schemaModelSchema.optional(),
  version: z.string().optional(),
});
export type KafkaTopic = z.infer<typeof kafkaTopicSchema>;

export const kafkaTopicInputSchema = kafkaTopicSchema;

export const kafkaBrokerSchema = z.object({
  partitions: z.number().optional(),
  replication: z.number().optional(),
  batchSize: z.string().optional(),
  compression: z.string().optional(),
  ttl: z.string().optional(),
});
export type KafkaBrokerConfig = z.infer<typeof kafkaBrokerSchema>;

export const kafkaDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  topics: z.array(kafkaTopicSchema).optional(),
  kafkaBroker: kafkaBrokerSchema.optional(),
  delivery: z.string().optional(),
  ordering: z.string().optional(),
  retention: z.string().optional(),
}).strict();
export type KafkaNodeData = z.infer<typeof kafkaDataSchema>;

export const kafkaDataInputSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  topics: z.array(kafkaTopicInputSchema).optional(),
  kafkaBroker: kafkaBrokerSchema.optional(),
  delivery: z.string().optional(),
  ordering: z.string().optional(),
  retention: z.string().optional(),
}).strict();

export const sqsDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  queues: z.array(resourceItemSchema).optional(),
  sqsBroker: z.object({
    visibilityTimeout: z.number().optional(),
    delay: z.number().optional(),
    fifo: z.boolean().optional(),
  }).optional(),
  delivery: z.string().optional(),
  failureHandling: z.string().optional(),
}).strict();

export const redisPubSubDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  channels: z.array(resourceItemSchema).optional(),
  redisPubSubBroker: z.object({
    db: z.string().optional(),
    namespace: z.string().optional(),
  }).passthrough().optional(),
  delivery: z.string().optional(),
}).strict();

export const redisStreamsDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  streams: z.array(resourceItemSchema).optional(),
  redisBroker: z.object({
    consumerGroup: z.string().optional(),
  }).optional(),
  delivery: z.string().optional(),
  ordering: z.string().optional(),
  retention: z.string().optional(),
}).strict();

export const redisCacheDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  caches: z.array(resourceItemSchema).optional(),
}).strict();

export const storageDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  buckets: z.array(resourceItemSchema).optional(),
}).strict();

export const externalDataSchema = simpleDataSchema.extend({
  baseUrl: z.string().optional(),
  actions: z.array(resourceItemSchema).optional(),
});

export const clientEventInputSchema = z.object({
  id: z.string().optional().describe("Unique identifier for this event"),
  name: z.string().describe("Logical name of the action (e.g., 'sendMessage', 'fetchData')"),
  event: z.string().optional().describe("The DOM event that triggers it"),
  schema: z.string().optional().describe("Input schema for the API call"),
  targetNodeId: z.string().optional().describe("If this event triggers an API call, specify the target service node ID to AUTOMATICALLY create an edge"),
  targetEndpointId: z.string().optional().describe("If this event triggers an API call, specify the target endpoint ID on the service node to AUTOMATICALLY create an edge"),
  simulationCases: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    request: z.object({
      headers: z.record(z.string()).optional(),
      params: z.record(z.string()).optional(),
      body: z.unknown().optional(),
    }).optional(),
    expectedStatus: z.number().optional(),
    expectedBody: z.unknown().optional(),
    enabled: z.boolean().optional(),
  })).optional().describe("Named repeatable inputs for client-triggered simulations"),
});

export const webClientDataSchema = simpleDataSchema.extend({
  events: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    event: z.string().optional(),
    schema: z.string().optional(),
    simulationCases: z.array(z.object({
      id: z.string(),
      name: z.string(),
      request: z.object({
        headers: z.record(z.string()).optional(),
        params: z.record(z.string()).optional(),
        body: z.unknown().optional(),
      }).optional(),
      expectedStatus: z.number().optional(),
      expectedBody: z.unknown().optional(),
      enabled: z.boolean().optional(),
    })).optional(),
  })).optional(),
});

export const webClientDataInputSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  events: z.array(clientEventInputSchema).optional(),
});

export const serviceDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  techStack: z.string().optional(),
  port: z.string().optional(),
  cors: z.boolean().optional(),
  corsOrigins: z.string().optional(),
  rateLimit: z.string().optional(),
  baseUrl: z.string().optional(),
  endpoints: z.array(endpointSchema).optional(),
  consumedEvents: z.array(consumedEventSchema).optional(),
  publishedEvents: z.array(publishedEventSchema).optional(),
  inputs: z.array(resourceItemSchema).optional(),
  outputs: z.array(resourceItemSchema).optional(),
  logic: z.array(resourceItemSchema).optional(),
  routeGroups: z.array(z.object({
    id: z.string(),
    name: z.string(),
    basePath: z.string(),
    endpoints: z.array(endpointSchema),
  })).optional(),
}).strict();
export type ServiceNodeData = z.infer<typeof serviceDataSchema>;

export const serviceDataInputSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  techStack: z.string().optional(),
  port: z.string().optional(),
  cors: z.boolean().optional(),
  corsOrigins: z.string().optional(),
  rateLimit: z.string().optional(),
  baseUrl: z.string().optional(),
  endpoints: z.array(endpointInputSchema).optional(),
  consumedEvents: z.array(consumedEventInputSchema).optional(),
  publishedEvents: z.array(publishedEventInputSchema).optional(),
  inputs: z.array(z.object({ id: z.string().optional(), name: z.string() }).passthrough()).optional(),
  outputs: z.array(z.object({ id: z.string().optional(), name: z.string() }).passthrough()).optional(),
  logic: z.array(z.object({ id: z.string().optional(), name: z.string() }).passthrough()).optional(),
  routeGroups: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    basePath: z.string(),
    endpoints: z.array(endpointInputSchema),
  }).passthrough()).optional(),
}).passthrough();

export const workerTaskTriggerSchema = z.object({
  id: z.string(),
  type: z.enum(["event", "cron"]),
  value: z.string().optional(),
});
export type WorkerTaskTrigger = z.infer<typeof workerTaskTriggerSchema>;

export const workerTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  triggers: z.array(workerTaskTriggerSchema).optional(),
  inputSchema: schemaModelSchema.optional(),
  outputSchema: schemaModelSchema.optional(),
  retryPolicy: z.string().optional(),
  timeout: z.string().optional(),
});
export type WorkerTask = z.infer<typeof workerTaskSchema>;

// --- Worker Node ---
export const workerDataSchema = baseNodeDataSchema.extend({
  description:   z.string().optional(),
  // Core Resources
  tasks:         z.array(workerTaskSchema).optional(),
  // Implementation
  queueSources:  z.array(z.string()).optional(),          // IDs of broker nodes it pulls from
  // Configuration (Advanced)
  concurrency:   z.number().optional(),
  retryPolicy:   z.enum(["NONE", "EXPONENTIAL_BACKOFF", "FIXED_INTERVAL"]).optional(),
  maxRetries:    z.number().optional(),
  // Tags
  tags:          z.array(z.string()).optional(),
}).strict();
export type WorkerNodeData = z.infer<typeof workerDataSchema>;

// --- Serverless Function Node ---
export const serverlessDataSchema = baseNodeDataSchema.extend({
  description:  z.string().optional(),
  // Core Resources
  endpoints:    z.array(endpointSchema).optional(),
  // Implementation
  triggerType:  z.enum(["HTTP", "Event", "CRON", "Queue"]).optional(),
  runtime:      z.string().optional(),                    // "nodejs20.x", "python3.12", "go1.x"
  // Configuration (Advanced)
  memoryMb:     z.number().optional(),
  timeoutSec:   z.number().optional(),
  // Tags
  tags:         z.array(z.string()).optional(),
}).strict();
export type ServerlessNodeData = z.infer<typeof serverlessDataSchema>;

// --- Vector DB Ref Node (Graph View) ---
export const vectorDbRefDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  collectionRef: z.string().optional(),
  dbRef: z.string().optional(),
}).strict();
export type VectorDbRefNodeData = z.infer<typeof vectorDbRefDataSchema>;

// --- Search Index Node ---
export const searchIndexDataSchema = baseNodeDataSchema.extend({
  description:    z.string().optional(),
  // Core Resources
  searchSources: z.array(z.object({
    id: z.string(),
    sourceType: z.literal("Database"),
    dbTable: z.string(),
    dbPrimaryKey: z.string().optional(),
    dbSyncMode: z.string().optional(),
    indexes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      analyzer: z.string().optional(),
      schema: schemaModelSchema.optional(),
    })),
  })).optional(),
  // Implementation
  implementation: z.enum(["Elasticsearch", "OpenSearch", "Algolia", "Meilisearch", "Typesense", "Other"]).optional(),
  // Configuration (Advanced)
  analyzer:       z.string().optional(),                  // "standard", "english", "icu_analyzer"
  // Tags
  tags:           z.array(z.string()).optional(),
}).strict();
export type SearchIndexNodeData = z.infer<typeof searchIndexDataSchema>;
export type SearchSource = NonNullable<z.infer<typeof searchIndexDataSchema>["searchSources"]>[number];
export type SearchIndexItem = SearchSource["indexes"][number];

// --- API Gateway Node ---
// --- Identity Provider Node ---
export const identityProviderDataSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
}).strict();
export type IdentityProviderNodeData = z.infer<typeof identityProviderDataSchema>;

export const authRuleSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("jwt"),
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    config: z.object({
      providerId: z.string().optional(),
      algorithms: z.array(z.string()).optional(),
    }),
  }),
  z.object({
    type: z.literal("oauth2"),
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    config: z.object({
      providerId: z.string().optional(),
      algorithms: z.array(z.string()).optional(),
    }),
  }),
  z.object({
    type: z.literal("apiKey"),
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    config: z.object({
      headerName: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("mtls"),
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    config: z.object({
      clientCa: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("basic"),
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    config: z.object({}).strict().optional(),
  }),
  z.object({
    type: z.literal("none"),
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    config: z.object({}).strict().optional(),
  }),
]);

export const gatewayRouteSchema = resourceItemSchema.extend({
  method: z.string().optional(),
  service: z.string().optional(),
  authRuleId: z.string().optional(),
});

const routeGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  basePath: z.string(),
  endpoints: z.array(endpointSchema).optional(),
});

export const apiGatewayDataSchema = baseNodeDataSchema.extend({
  description:    z.string().optional(),
  // Core Resources
  routes:         z.array(gatewayRouteSchema).optional(),
  endpoints:      z.array(endpointSchema).optional(), // Kept for backwards compatibility
  routeGroups:    z.array(routeGroupSchema).optional(), // Kept for backwards compatibility
  authRules:      z.array(authRuleSchema).optional(),
  // Implementation
  implementation: z.enum(["AWS API Gateway", "Kong", "Nginx", "Traefik", "Custom", "Other"]).optional(),
  // Security
  // Kept for backwards compatibility with older gateway nodes.
  authType:       z.enum(["None", "JWT", "API Key", "OAuth2", "mTLS"]).optional(),
  // Configuration (Advanced)
  rateLimit:      z.string().optional(),                  // "1000/min", "100/s"
  timeout:        z.string().optional(),
  cors:           z.boolean().optional(),
  corsOrigins:    z.string().optional(),
  // Tags
  tags:           z.array(z.string()).optional(),
}).strict();
export type ApiGatewayNodeData = z.infer<typeof apiGatewayDataSchema>;

// --- Load Balancer Node ---
export const loadBalancerDataSchema = baseNodeDataSchema.extend({
  description:     z.string().optional(),
  // Core Resources
  targetGroups:    z.array(resourceItemSchema).optional(),
  // Implementation
  implementation:  z.enum(["AWS ALB", "AWS NLB", "Nginx", "HAProxy", "Cloudflare", "Other"]).optional(),
  // Configuration (Advanced)
  algorithm:       z.enum(["Round Robin", "Least Connections", "IP Hash", "Random"]).optional(),
  healthCheckPath: z.string().optional(),                 // "/health", "/ping"
  // Tags
  tags:            z.array(z.string()).optional(),
}).strict();
export type LoadBalancerNodeData = z.infer<typeof loadBalancerDataSchema>;

// --- Webhook Node ---
export const webhookDataSchema = baseNodeDataSchema.extend({
  description:    z.string().optional(),
  // Core Resources
  events:         z.array(resourceItemSchema).optional(),
  // Security
  authentication: z.enum(["None", "HMAC", "Bearer", "Basic", "Custom"]).optional(),
  // Tags
  tags:           z.array(z.string()).optional(),
}).strict();
export type WebhookNodeData = z.infer<typeof webhookDataSchema>;

// --- LLM Node ---
export const llmDataSchema = baseNodeDataSchema.extend({
  description:     z.string().optional(),
  // Core Resources (Basic)
  prompts:         z.array(resourceItemSchema).optional(),
  // Implementation (Basic)
  implementation:  z.enum(ALL_LLM_PROVIDER_VALUES).optional(),
  model:           z.string().optional(),                 // "gpt-4o", "claude-3-5-sonnet", etc.
  // Configuration (Advanced)
  temperature:     z.number().optional(),
  maxTokens:       z.number().optional(),
  structuredOutput: z.boolean().optional(),
  toolCalling:     z.boolean().optional(),
  tools:           z.array(resourceItemSchema).optional(),
  // Tags
  tags:            z.array(z.string()).optional(),
}).strict();
export type LlmNodeData = z.infer<typeof llmDataSchema>;

// --- MCP Server Node ---
export const mcpServerDataSchema = baseNodeDataSchema.extend({
  description:    z.string().optional(),
  // Core Resources (Basic)
  tools:          z.array(resourceItemSchema).optional(),
  resources:      z.array(resourceItemSchema).optional(),
  prompts:        z.array(resourceItemSchema).optional(),
  // Implementation (Advanced)
  connectionType: z.enum(["stdio", "SSE", "HTTP"]).optional(),
  // Security (Advanced)
  authentication: z.enum(["None", "Bearer", "API Key", "OAuth2"]).optional(),
  // Tags
  tags:           z.array(z.string()).optional(),
}).strict();
export type McpServerNodeData = z.infer<typeof mcpServerDataSchema>;

// ----------------------------------------------------------------------------
// LANGGRAPH AGENT SCHEMAS & TOPOLOGY VALIDATOR (v2.5)
// ----------------------------------------------------------------------------
export const leafComparisonSchema = z.object({
  field: z.string(),
  operator: z.enum([
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "contains",
    "in",
    "is_not_null",
    "has_tool_calls",
  ]),
  value: z.any().optional(),
});

export type LeafComparison = z.infer<typeof leafComparisonSchema>;

export type ConditionAst =
  | LeafComparison
  | { and: ConditionAst[] }
  | { or: ConditionAst[] }
  | { not: ConditionAst };

export const conditionAstSchema: z.ZodType<ConditionAst> = z.lazy(() =>
  z.union([
    leafComparisonSchema,
    z.object({ and: z.array(conditionAstSchema) }),
    z.object({ or: z.array(conditionAstSchema) }),
    z.object({ not: conditionAstSchema }),
  ])
);

export const graphEdgeTargetSchema = z.object({
  id: z.string(),
  kind: z.enum(["step", "port", "end"]),
  targetHandle: z.string().optional(),
});
export type GraphEdgeTarget = z.infer<typeof graphEdgeTargetSchema>;

export const sendConfigSchema = z.object({
  enabled: z.boolean().default(false),
  itemsField: z.string(),
  itemTarget: graphEdgeTargetSchema,
  joinStepId: z.string(),
  batchErrorPolicy: z.enum(["fail_fast", "ignore_failures", "collect_errors"]).default("fail_fast"),
});
export type SendConfig = z.infer<typeof sendConfigSchema>;

export const graphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  targets: z.array(graphEdgeTargetSchema).default([]),
  condition: conditionAstSchema.optional(),
  isDefault: z.boolean().default(false),
  sendConfig: sendConfigSchema.optional(),
});
export type GraphEdge = z.infer<typeof graphEdgeSchema>;

export const toolDefinitionSchema = z.object({
  id: z.string().optional(),
  toolId: z.string().optional(),
  label: z.string().optional().default("Tool"),
  name: z.string(),
  description: z.string(),
  source: z.enum(["inline", "mcp_server", "canvas_edge", "api_endpoint"]),
  inputSchema: z.string().optional(),
  endpointUrl: z.string().optional(),
  mcpConnectionId: z.string().optional(),
  remoteToolName: z.string().optional(),
  returnDirect: z.boolean().optional(),
  returnType: z.enum(["string", "object", "content_blocks", "command"]).optional(),
  outputSchema: z.string().optional(),
  commandConfig: z.object({
    stateUpdates: z.array(z.object({
      channelKey: z.string(),
      mode: z.enum(["set", "append", "expression"]).optional(),
      value: z.string().optional(),
    }))
  }).optional(),
  functionBody: z.string().optional(),
  executionMode: z.enum(["sandboxed_vm", "disabled"]).optional(),
  headless: z.boolean().optional(),
  contextAccess: z.object({
    enabled: z.boolean().optional(),
    fields: z.array(z.string()).optional(),
  }).optional(),
  storeAccess: z.object({
    enabled: z.boolean().optional(),
    namespace: z.string().optional(),
    operations: z.array(z.enum(["get", "put", "delete", "list"])).optional(),
  }).optional(),
  streamWriter: z.boolean().optional(),
  errorHandling: z.object({
    enabled: z.boolean().optional(),
    retryCount: z.number().optional(),
    customErrorMessage: z.string().optional(),
  }).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type ToolDefinition = z.infer<typeof toolDefinitionSchema>;

export const middlewareDefinitionSchema = z.object({
  id: z.string().optional(),
  middlewareId: z.string().optional(),
  name: z.string(),
  type: z.enum(["human_in_the_loop", "rate_limit", "logging_tracing", "custom"]),
  humanInTheLoopConfig: z.object({
    interruptOn: z.record(z.boolean()).optional(),
    approvalPrompt: z.string().optional(),
    requiredRole: z.string().optional(),
  }).optional(),
  rateLimitConfig: z.object({
    requestsPerMinute: z.number(),
    windowMs: z.number().optional(),
  }).optional(),
  loggingConfig: z.object({
    logLevel: z.enum(["debug", "info", "warn", "error"]),
    tracingTarget: z.enum(["langsmith", "opentelemetry", "convex"]).optional(),
  }).optional(),
  customBody: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type MiddlewareDefinition = z.infer<typeof middlewareDefinitionSchema>;

export const agentDefinitionSchema = z.object({
  id: z.string().optional(),
  agentId: z.string().optional(),
  name: z.string(),
  systemPrompt: z.string().optional(),
  modelConfig: z.any().optional(),
  tools: z.array(z.string()).optional().default([]),
  middleware: z.array(z.string()).optional().default([]),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type AgentDefinition = z.infer<typeof agentDefinitionSchema>;

export const vectorStoreConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["convex", "pinecone", "pgvector", "qdrant"]).default("convex"),
  embeddingModel: z.string().default("text-embedding-3-small"),
  collection: z.string().default("agent_memories"),
  topK: z.number().default(5),
  similarityThreshold: z.number().default(0.75),
});
export type VectorStoreConfig = z.infer<typeof vectorStoreConfigSchema>;

export const inputChannelSchema = z.object({
  key: z.string(),
  type: z.enum(["string", "messages", "json", "number", "boolean", "object", "array"]).default("string"),
  required: z.boolean().default(true),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
});
export type InputChannel = z.infer<typeof inputChannelSchema>;

export const outputPortSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});
export type OutputPort = z.infer<typeof outputPortSchema>;

export const graphStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    "llm_call",
    "tool_node",
    "evaluator",
    "summarizer",
    "custom_code",
    "human_gate",
    "interrupt",
    "vector_search",
    "router",
  ]),
  modelConfig: z
    .object({
      provider: z.string().optional().default(DEFAULT_LLM_PROVIDER),
      model: z.string().default(DEFAULT_LLM_MODEL),
      temperature: z.number().default(DEFAULT_LLM_TEMPERATURE),
      maxTokens: z.number().default(4000),
      systemPrompt: z.string().optional(),
      baseUrl: z.string().optional(),
      url: z.string().optional(),
      method: z.string().optional(),
      headersJson: z.string().optional(),
      bodyJson: z.string().optional(),
      apiKeyHeader: z.string().optional(),
      customLlmNodeId: z.string().optional(),
    })
    .optional(),
  humanGateConfig: z
    .object({
      approvalPrompt: z.string(),
      timeoutMs: z.number().optional(),
      requiredRole: z.string().optional(),
    })
    .optional(),
  interruptConfig: z
    .object({
      callbackKey: z.string(),
      expectedPayloadSchema: z.record(z.any()).optional(),
      timeoutMs: z.number().default(86400000),
    })
    .optional(),
  vectorSearchConfig: vectorStoreConfigSchema.optional(),
  customCode: z
    .object({
      body: z.string(),
      timeoutMs: z.number().default(1000),
      memoryLimitMb: z.number().default(128),
    })
    .optional(),
  routerConfig: z
    .object({
      branches: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          field: z.string(),
          operator: z.enum([
            "eq",
            "neq",
            "gt",
            "gte",
            "lt",
            "lte",
            "contains",
            "is_not_null",
            "has_tool_calls",
            "expression",
          ]),
          value: z.string().optional(),
          isDefault: z.boolean().optional(),
        })
      ),
    })
    .optional(),
  tools: z.array(z.string()).default([]),
  retryPolicy: z
    .object({
      maxAttempts: z.number().default(3),
      backoffFactor: z.number().default(2),
    })
    .optional(),
  stateUpdates: z
    .array(
      z.object({
        channelKey: z.string(),
        value: z.string().optional(),
        mode: z.enum(["set", "append", "expression"]).optional(),
      })
    )
    .optional(),
});
export type GraphStep = z.infer<typeof graphStepSchema>;

export const langgraphDataSchema = baseNodeDataSchema
  .extend({
    version: z.number().default(2),
    recursionLimit: z.number().default(25),
    stepTimeoutMs: z.number().default(30000),

    inputChannels: z.array(inputChannelSchema).default([]),

    stateChannels: z
      .array(
        z.object({
          key: z.string(),
          type: z.enum(["messages", "string", "json", "number", "boolean"]),
          reducer: z.enum(["add_messages", "append", "replace", "merge_object", "concat_array"]),
          defaultValue: z.any(),
        })
      )
      .default([
        { key: "messages", type: "messages", reducer: "add_messages", defaultValue: [] },
        { key: "summary", type: "string", reducer: "replace", defaultValue: "" },
        { key: "intent", type: "string", reducer: "replace", defaultValue: "" },
      ]),

    outputPorts: z
      .array(outputPortSchema)
      .default([
        { id: "tool_call", label: "Tool Output Port" },
        { id: "human_gate", label: "Human Approval Port" },
        { id: "completed", label: "Completed Output Port" },
        { id: "error", label: "Error Output Port" },
      ]),

    toolDefinitions: z.array(toolDefinitionSchema).default([]),
    middlewareDefinitions: z.array(middlewareDefinitionSchema).default([]),
    agentDefinitions: z.array(agentDefinitionSchema).default([]),
    tools: z.array(z.any()).default([]), // For backwards compatibility if needed
    graphSteps: z.array(graphStepSchema).default([]),
    graphEdges: z.array(graphEdgeSchema).default([]),
    memoryConfig: z
      .object({
        checkpointer: z.enum(["memory", "redis", "convex", "postgres"]).default("convex"),
        checkpointerConnectionId: z.string().optional(),
        threadScope: z.enum(["session", "user", "global"]).default("session"),
        autoSummarize: z.boolean().default(true),
        maxWindowMessages: z.number().default(10),
        vectorStore: vectorStoreConfigSchema.optional(),
      })
      .default({}),
    customLlmNodes: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          provider: z.string().optional(),
          url: z.string().optional(),
          baseUrl: z.string().optional(),
          method: z.string().optional(),
          headersJson: z.string().optional(),
          bodyJson: z.string().optional(),
          model: z.string().optional(),
          apiKeyHeader: z.string().optional(),
          temperature: z.number().optional(),
          maxTokens: z.number().optional(),
          position: z.object({ x: z.number(), y: z.number() }).optional(),
        })
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    const stepIds = new Set(data.graphSteps.map((s) => s.id));
    const toolIds = new Set(data.toolDefinitions.map((t) => t.toolId || t.id).filter((id): id is string => Boolean(id)));
    const middlewareIds = new Set(data.middlewareDefinitions.map((m) => m.middlewareId || m.id).filter((id): id is string => Boolean(id)));
    const agentIds = new Set(data.agentDefinitions.map((a) => a.agentId || a.id).filter((id): id is string => Boolean(id)));
    const portIds = new Set(data.outputPorts.map((p) => p.id));
    const customLlmIds = new Set(data.customLlmNodes?.map((l) => l.id) || []);

    // 1. Enforce Step Type Restrictions on retryPolicy & Tool Integrity
    data.graphSteps.forEach((step, idx) => {
      if (
        ["human_gate", "interrupt", "custom_code"].includes(step.type) &&
        step.retryPolicy !== undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Step type "${step.type}" cannot have a retryPolicy. Retries are restricted to llm_call, tool_node, vector_search, evaluator, and summarizer.`,
          path: ["graphSteps", idx, "retryPolicy"],
        });
      }

      step.tools.forEach((toolId, tIdx) => {
        if (!toolIds.has(toolId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Step "${step.id}" references undefined tool ID "${toolId}".`,
            path: ["graphSteps", idx, "tools", tIdx],
          });
        }
      });
    });

    // 2. Validate Edge Topologies, Mutual Exclusivity, & sendConfig
    const sourcesWithConditionalEdge = new Set<string>();
    const sourcesWithDefaultOrUnconditional = new Set<string>();

    data.graphEdges.forEach((edge, idx) => {
      if (edge.isDefault && edge.condition !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `An edge cannot be marked as isDefault: true while also having a condition defined.`,
          path: ["graphEdges", idx, "isDefault"],
        });
      }

      if (
        edge.source !== "START" &&
        !stepIds.has(edge.source) &&
        !customLlmIds.has(edge.source) &&
        !toolIds.has(edge.source) &&
        !middlewareIds.has(edge.source) &&
        !agentIds.has(edge.source)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Edge source "${edge.source}" does not exist in graphSteps, customLlmNodes, toolDefinitions, middlewareDefinitions, or agentDefinitions.`,
          path: ["graphEdges", idx, "source"],
        });
      }

      if (edge.condition !== undefined) {
        sourcesWithConditionalEdge.add(edge.source);
      }
      if (edge.isDefault || edge.condition === undefined) {
        if (edge.isDefault && sourcesWithDefaultOrUnconditional.has(edge.source)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Multiple edges from source "${edge.source}" marked as isDefault or unconditional.`,
            path: ["graphEdges", idx, "isDefault"],
          });
        }
        sourcesWithDefaultOrUnconditional.add(edge.source);
      }

      if (edge.sendConfig?.enabled) {
        if (edge.targets.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Edge cannot have both targets and sendConfig.enabled=true simultaneously.`,
            path: ["graphEdges", idx, "targets"],
          });
        }

        if (!edge.sendConfig.joinStepId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `When sendConfig.enabled is true, joinStepId must be specified.`,
            path: ["graphEdges", idx, "sendConfig", "joinStepId"],
          });
        } else if (!stepIds.has(edge.sendConfig.joinStepId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `sendConfig joinStepId "${edge.sendConfig.joinStepId}" does not exist in graphSteps.`,
            path: ["graphEdges", idx, "sendConfig", "joinStepId"],
          });
        }

        const itemTarget = edge.sendConfig.itemTarget;
        if (
          itemTarget.kind === "step" &&
          itemTarget.id !== "END" &&
          !stepIds.has(itemTarget.id) &&
          !customLlmIds.has(itemTarget.id) &&
          !toolIds.has(itemTarget.id) &&
          !middlewareIds.has(itemTarget.id) &&
          !agentIds.has(itemTarget.id)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `sendConfig itemTarget step "${itemTarget.id}" does not exist in graphSteps, customLlmNodes, toolDefinitions, middlewareDefinitions, or agentDefinitions.`,
            path: ["graphEdges", idx, "sendConfig", "itemTarget", "id"],
          });
        } else if (itemTarget.kind === "port" && !portIds.has(itemTarget.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `sendConfig itemTarget port "${itemTarget.id}" does not exist in outputPorts.`,
            path: ["graphEdges", idx, "sendConfig", "itemTarget", "id"],
          });
        }
      }

      edge.targets.forEach((target, tIdx) => {
        if (target.kind === "step") {
          if (target.id === "END") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Target with id "END" must use kind: "end" instead of kind: "step".`,
              path: ["graphEdges", idx, "targets", tIdx, "kind"],
            });
          } else if (
            !stepIds.has(target.id) &&
            !customLlmIds.has(target.id) &&
            !toolIds.has(target.id) &&
            !middlewareIds.has(target.id) &&
            !agentIds.has(target.id)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Edge target step "${target.id}" does not exist in graphSteps, customLlmNodes, toolDefinitions, middlewareDefinitions, or agentDefinitions.`,
              path: ["graphEdges", idx, "targets", tIdx, "id"],
            });
          }
        } else if (target.kind === "port" && !portIds.has(target.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Edge target port "${target.id}" does not exist in outputPorts.`,
            path: ["graphEdges", idx, "targets", tIdx, "id"],
          });
        }
      });
    });

    sourcesWithConditionalEdge.forEach((source) => {
      if (!sourcesWithDefaultOrUnconditional.has(source)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Source "${source}" has conditional edges but no default/unconditional fallback branch (isDefault: true). Graph execution would dead-end at runtime.`,
          path: ["graphEdges"],
        });
      }
    });

    // 3. Reachability Check (BFS from START)
    if (data.graphSteps.length > 0) {
      const visited = new Set<string>();
      const queue: string[] = ["START"];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (visited.has(curr)) continue;
        visited.add(curr);

        const outgoing = data.graphEdges.filter((e) => e.source === curr);
        outgoing.forEach((e) => {
          if (e.sendConfig?.enabled) {
            if (e.sendConfig.itemTarget.kind === "step") {
              queue.push(e.sendConfig.itemTarget.id);
            }
            if (e.sendConfig.joinStepId) {
              queue.push(e.sendConfig.joinStepId);
            }
          }
          e.targets.forEach((t) => {
            if (t.kind === "step") queue.push(t.id);
          });
        });
      }

      data.graphSteps.forEach((step, idx) => {
        if (!visited.has(step.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Orphaned step "${step.id}" is unreachable from START.`,
            path: ["graphSteps", idx],
          });
        }
      });
    }
  });

export type LangGraphNodeData = z.infer<typeof langgraphDataSchema>;

export const langgraphStepDataSchema = baseNodeDataSchema.extend({
  stepId: z.string().optional(),
  stepType: z.string().optional(),
  modelConfig: z.any().optional(),
  humanGateConfig: z.any().optional(),
  interruptConfig: z.any().optional(),
  customCode: z.any().optional(),
});

export const nodeDataSchemas: Record<string, z.ZodSchema> = {
  queue: simpleDataSchema,
  pubsub: simpleDataSchema,
  eventstream: simpleDataSchema,
  kafka: kafkaDataSchema,
  sqs: sqsDataSchema,
  "redis-pubsub": redisPubSubDataSchema,
  "redis-streams": redisStreamsDataSchema,
  "redis-cache": redisCacheDataSchema,
  entity: entityDataSchema,
  service: serviceDataSchema,
  db_ref: dbRefDataSchema,
  webClient: webClientDataSchema,
  external: externalDataSchema,
  group: simpleDataSchema,
  storage: storageDataSchema,
  // New nodes
  worker: workerDataSchema,
  serverless: serverlessDataSchema,
  search_index: searchIndexDataSchema,
  api_gateway: apiGatewayDataSchema,
  load_balancer: loadBalancerDataSchema,
  webhook: webhookDataSchema,
  llm: llmDataSchema,
  mcp_server: mcpServerDataSchema,
  vector_db_ref: vectorDbRefDataSchema,
  identity_provider: identityProviderDataSchema,
  langgraph: langgraphDataSchema,
  langgraph_step: langgraphStepDataSchema,
};
