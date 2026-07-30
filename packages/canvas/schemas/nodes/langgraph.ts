import { z } from "zod";
import { DEFAULT_LLM_PROVIDER, DEFAULT_LLM_MODEL, DEFAULT_LLM_TEMPERATURE } from "../../constants";
import { baseNodeDataSchema } from "./base";

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
  type: z.enum([
    "human_in_the_loop",
    "rate_limit",
    "logging_tracing",
    "summarization",
    "model_call_limit",
    "tool_call_limit",
    "model_fallback",
    "pii_detection",
    "todo_list",
    "llm_tool_selector",
    "tool_retry",
    "model_retry",
    "llm_tool_emulator",
    "context_editing",
    "provider_tool_search",
    "filesystem",
    "subagent",
    "custom",
  ]),
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
  summarizationConfig: z.object({
    model: z.string().optional(),
    triggerTokens: z.number().optional(),
    triggerMessages: z.number().optional(),
    triggerFraction: z.number().optional(),
    keepMessages: z.number().optional(),
    keepTokens: z.number().optional(),
    keepFraction: z.number().optional(),
    summaryPrompt: z.string().optional(),
    trimTokensToSummarize: z.number().optional(),
    summaryPrefix: z.string().optional(),
  }).optional(),
  modelCallLimitConfig: z.object({
    threadLimit: z.number().optional(),
    runLimit: z.number().optional(),
    exitBehavior: z.enum(["end", "error"]).optional(),
  }).optional(),
  toolCallLimitConfig: z.object({
    toolName: z.string().optional(),
    threadLimit: z.number().optional(),
    runLimit: z.number().optional(),
    exitBehavior: z.enum(["continue", "error", "end"]).optional(),
  }).optional(),
  modelFallbackConfig: z.object({
    fallbackModels: z.array(z.string()).optional(),
  }).optional(),
  piiConfig: z.object({
    piiType: z.string().optional(),
    strategy: z.enum(["redact", "block", "mask", "hash"]).optional(),
    detectorPattern: z.string().optional(),
    applyToInput: z.boolean().optional(),
    applyToOutput: z.boolean().optional(),
    applyToToolResults: z.boolean().optional(),
  }).optional(),
  todoListConfig: z.object({
    enableWriteTodos: z.boolean().optional(),
    autoInjectPrompt: z.boolean().optional(),
    initialTasks: z.string().optional(),
  }).optional(),
  llmToolSelectorConfig: z.object({
    model: z.string().optional(),
    maxTools: z.number().optional(),
    alwaysInclude: z.array(z.string()).optional(),
    systemPrompt: z.string().optional(),
  }).optional(),
  toolRetryConfig: z.object({
    maxRetries: z.number().optional(),
    backoffFactor: z.number().optional(),
    initialDelayMs: z.number().optional(),
    maxDelayMs: z.number().optional(),
    jitter: z.boolean().optional(),
    onFailure: z.enum(["continue", "error"]).optional(),
    tools: z.array(z.string()).optional(),
  }).optional(),
  modelRetryConfig: z.object({
    maxRetries: z.number().optional(),
    backoffFactor: z.number().optional(),
    initialDelayMs: z.number().optional(),
    maxDelayMs: z.number().optional(),
    jitter: z.boolean().optional(),
    onFailure: z.enum(["continue", "error"]).optional(),
  }).optional(),
  toolEmulatorConfig: z.object({
    model: z.string().optional(),
    emulatedTools: z.array(z.string()).optional(),
  }).optional(),
  contextEditingConfig: z.object({
    triggerTokens: z.number().optional(),
    keep: z.number().optional(),
    clearToolInputs: z.boolean().optional(),
    excludeTools: z.array(z.string()).optional(),
    placeholder: z.string().optional(),
  }).optional(),
  providerToolSearchConfig: z.object({
    searchableTools: z.array(z.string()).optional(),
  }).optional(),
  filesystemConfig: z.object({
    backend: z.enum(["state", "store", "composite"]).optional(),
    memoriesPath: z.string().optional(),
    systemPrompt: z.string().optional(),
    customToolDescriptions: z.string().optional(),
  }).optional(),
  subagentConfig: z.object({
    defaultModel: z.string().optional(),
    defaultTools: z.array(z.string()).optional(),
    subagentsJson: z.string().optional(),
  }).optional(),
  customBody: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type MiddlewareDefinition = z.infer<typeof middlewareDefinitionSchema>;

export const streamConfigSchema = z.object({
  enabled: z.boolean().optional().default(false),
  version: z.string().optional().default("v3"),
  selectedEvents: z.array(z.string()).optional(),
  eventSignature: z.string().optional(),
  customTransformers: z.string().optional(),
}).optional();

export const memoryDefinitionSchema = z.object({
  id: z.string().optional(),
  memoryId: z.string().optional(),
  name: z.string().default("Memory Saver"),
  checkpointer: z.string().default("memory"),
  threadIdKey: z.string().optional().default("thread_id"),
  threadScope: z.enum(["session", "user", "global"]).optional().default("session"),
  autoSummarize: z.boolean().optional().default(true),
  maxWindowMessages: z.number().optional().default(10),
  saveMessages: z.boolean().optional().default(true),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type MemoryDefinition = z.infer<typeof memoryDefinitionSchema>;

export const agentMemoryConfigSchema = z.object({
  enabled: z.boolean().optional().default(true),
  checkpointer: z.string().optional().default("memory"),
  threadIdKey: z.string().optional().default("thread_id"),
  threadScope: z.enum(["session", "user", "global"]).optional().default("session"),
  autoSummarize: z.boolean().optional().default(true),
  maxWindowMessages: z.number().optional().default(10),
  saveMessages: z.boolean().optional().default(true),
}).optional();
export type AgentMemoryConfig = z.infer<typeof agentMemoryConfigSchema>;

export const agentDefinitionSchema = z.object({
  id: z.string().optional(),
  agentId: z.string().optional(),
  name: z.string(),
  systemPrompt: z.string().optional(),
  modelConfig: z.any().optional(),
  streamConfig: streamConfigSchema,
  memoryConfig: agentMemoryConfigSchema,
  tools: z.array(z.string()).optional().default([]),
  middleware: z.array(z.string()).optional().default([]),
  memory: z.array(z.string()).optional().default([]),
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
  position: z.object({ x: z.number(), y: z.number() }).optional(),
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
    memoryDefinitions: z.array(memoryDefinitionSchema).default([]),
    tools: z.array(z.any()).default([]), // For backwards compatibility if needed
    graphSteps: z.array(graphStepSchema).default([]),
    graphEdges: z.array(graphEdgeSchema).default([]),
    memoryConfig: z
      .object({
        checkpointer: z.string().default("memory"),
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
    const memoryIds = new Set(data.memoryDefinitions.map((m) => m.memoryId || m.id).filter((id): id is string => Boolean(id)));
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
        !agentIds.has(edge.source) &&
        !memoryIds.has(edge.source)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Edge source "${edge.source}" does not exist in graphSteps, customLlmNodes, toolDefinitions, middlewareDefinitions, agentDefinitions, or memoryDefinitions.`,
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

    // 3. Reachability Check (relaxed for interactive canvas editing)
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
