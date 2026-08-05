import { z } from "zod";

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
  returnType: z
    .enum(["string", "object", "content_blocks", "command"])
    .optional(),
  outputSchema: z.string().optional(),
  commandConfig: z
    .object({
      stateUpdates: z.array(
        z.object({
          channelKey: z.string(),
          mode: z.enum(["set", "append", "expression"]).optional(),
          value: z.string().optional(),
        }),
      ),
    })
    .optional(),
  functionBody: z.string().optional(),
  executionMode: z.enum(["sandboxed_vm", "disabled"]).optional(),
  headless: z.boolean().optional(),
  contextAccess: z
    .object({
      enabled: z.boolean().optional(),
      fields: z.array(z.string()).optional(),
    })
    .optional(),
  storeAccess: z
    .object({
      enabled: z.boolean().optional(),
      namespace: z.string().optional(),
      operations: z.array(z.enum(["get", "put", "delete", "list"])).optional(),
    })
    .optional(),
  streamWriter: z.boolean().optional(),
  errorHandling: z
    .object({
      enabled: z.boolean().optional(),
      retryCount: z.number().optional(),
      customErrorMessage: z.string().optional(),
    })
    .optional(),
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
  humanInTheLoopConfig: z
    .object({
      interruptOn: z.record(z.boolean()).optional(),
      approvalPrompt: z.string().optional(),
      requiredRole: z.string().optional(),
    })
    .optional(),
  rateLimitConfig: z
    .object({
      requestsPerMinute: z.number(),
      windowMs: z.number().optional(),
    })
    .optional(),
  loggingConfig: z
    .object({
      logLevel: z.enum(["debug", "info", "warn", "error"]),
      tracingTarget: z
        .enum(["langsmith", "opentelemetry", "convex"])
        .optional(),
    })
    .optional(),
  summarizationConfig: z
    .object({
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
    })
    .optional(),
  modelCallLimitConfig: z
    .object({
      threadLimit: z.number().optional(),
      runLimit: z.number().optional(),
      exitBehavior: z.enum(["end", "error"]).optional(),
    })
    .optional(),
  toolCallLimitConfig: z
    .object({
      toolName: z.string().optional(),
      threadLimit: z.number().optional(),
      runLimit: z.number().optional(),
      exitBehavior: z.enum(["continue", "error", "end"]).optional(),
    })
    .optional(),
  modelFallbackConfig: z
    .object({
      fallbackModels: z.array(z.string()).optional(),
    })
    .optional(),
  piiConfig: z
    .object({
      piiType: z.string().optional(),
      strategy: z.enum(["redact", "block", "mask", "hash"]).optional(),
      detectorPattern: z.string().optional(),
      applyToInput: z.boolean().optional(),
      applyToOutput: z.boolean().optional(),
      applyToToolResults: z.boolean().optional(),
    })
    .optional(),
  todoListConfig: z
    .object({
      enableWriteTodos: z.boolean().optional(),
      autoInjectPrompt: z.boolean().optional(),
      initialTasks: z.string().optional(),
    })
    .optional(),
  llmToolSelectorConfig: z
    .object({
      model: z.string().optional(),
      maxTools: z.number().optional(),
      alwaysInclude: z.array(z.string()).optional(),
      systemPrompt: z.string().optional(),
    })
    .optional(),
  toolRetryConfig: z
    .object({
      maxRetries: z.number().optional(),
      backoffFactor: z.number().optional(),
      initialDelayMs: z.number().optional(),
      maxDelayMs: z.number().optional(),
      jitter: z.boolean().optional(),
      onFailure: z.enum(["continue", "error"]).optional(),
      tools: z.array(z.string()).optional(),
    })
    .optional(),
  modelRetryConfig: z
    .object({
      maxRetries: z.number().optional(),
      backoffFactor: z.number().optional(),
      initialDelayMs: z.number().optional(),
      maxDelayMs: z.number().optional(),
      jitter: z.boolean().optional(),
      onFailure: z.enum(["continue", "error"]).optional(),
    })
    .optional(),
  toolEmulatorConfig: z
    .object({
      model: z.string().optional(),
      emulatedTools: z.array(z.string()).optional(),
    })
    .optional(),
  contextEditingConfig: z
    .object({
      triggerTokens: z.number().optional(),
      keep: z.number().optional(),
      clearToolInputs: z.boolean().optional(),
      excludeTools: z.array(z.string()).optional(),
      placeholder: z.string().optional(),
    })
    .optional(),
  providerToolSearchConfig: z
    .object({
      searchableTools: z.array(z.string()).optional(),
    })
    .optional(),
  filesystemConfig: z
    .object({
      backend: z.enum(["state", "store", "composite"]).optional(),
      memoriesPath: z.string().optional(),
      systemPrompt: z.string().optional(),
      customToolDescriptions: z.string().optional(),
    })
    .optional(),
  subagentConfig: z
    .object({
      defaultModel: z.string().optional(),
      defaultTools: z.array(z.string()).optional(),
      subagentsJson: z.string().optional(),
    })
    .optional(),
  customBody: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type MiddlewareDefinition = z.infer<typeof middlewareDefinitionSchema>;
