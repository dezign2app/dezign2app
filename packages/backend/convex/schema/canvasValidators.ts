import { v } from "convex/values";
import { zodToConvex } from "convex-helpers/server/zod";
import { 
  serviceDataSchema,
  dbRefDataSchema,
  webClientDataSchema,
  externalDataSchema,
  simpleDataSchema,
  entityDataSchema,
  kafkaDataSchema,
  sqsDataSchema,
  redisPubSubDataSchema,
  redisStreamsDataSchema,
  redisCacheDataSchema,
  storageDataSchema,
  edgeDataSchema,
  simulationTestCaseSchema,
  // New nodes
  workerDataSchema,
  serverlessDataSchema,
  searchIndexDataSchema,
  apiGatewayDataSchema,
  loadBalancerDataSchema,
  webhookDataSchema,
  llmDataSchema,
  mcpServerDataSchema,
  vectorDbRefDataSchema,
  endpointSchema,
  identityProviderDataSchema,
  langgraphDataSchema,
  langgraphStepDataSchema,
  identityProviderSchema,
  publishedEventSchema,
  consumedEventSchema,
} from "@workspace/canvas/schemas";

// Test Case Data Validator
export const backendTestCaseDataValidator = zodToConvex(simulationTestCaseSchema);

// Edge Data Validator
export const backendEdgeDataValidator = zodToConvex(edgeDataSchema);

export const langgraphConvexDataValidator = v.object({
  label: v.optional(v.string()),
  description: v.optional(v.string()),
  parentId: v.optional(v.string()),
  position: v.optional(v.object({ x: v.number(), y: v.number() })),
  style: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null()))),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  version: v.optional(v.number()),
  recursionLimit: v.optional(v.number()),
  stepTimeoutMs: v.optional(v.number()),
  inputChannels: v.optional(
    v.array(
      v.object({
        key: v.string(),
        type: v.string(),
        required: v.optional(v.boolean()),
        description: v.optional(v.string()),
        defaultValue: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null(), v.array(v.union(v.string(), v.number(), v.boolean(), v.null())), v.record(v.string(), v.any()))),
      })
    )
  ),
  stateChannels: v.optional(
    v.array(
      v.object({
        key: v.string(),
        type: v.string(),
        reducer: v.string(),
        defaultValue: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null(), v.array(v.union(v.string(), v.number(), v.boolean(), v.null())))),
      })
    )
  ),
  outputPorts: v.optional(
    v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        description: v.optional(v.string()),
      })
    )
  ),
  tools: v.optional(
    v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        source: v.string(),
        endpointUrl: v.optional(v.string()),
      })
    )
  ),
  customLlmNodes: v.optional(
    v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        provider: v.optional(v.string()),
        url: v.optional(v.string()),
        baseUrl: v.optional(v.string()),
        method: v.optional(v.string()),
        headersJson: v.optional(v.string()),
        bodyJson: v.optional(v.string()),
        model: v.optional(v.string()),
        apiKeyHeader: v.optional(v.string()),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        position: v.optional(v.object({ x: v.number(), y: v.number() })),
      })
    )
  ),
  toolDefinitions: v.optional(
    v.array(
      v.object({
        id: v.optional(v.string()),
        toolId: v.optional(v.string()),
        label: v.optional(v.string()),
        name: v.string(),
        description: v.string(),
        inputSchema: v.optional(v.string()),
        source: v.string(),
        endpointUrl: v.optional(v.string()),
        mcpConnectionId: v.optional(v.string()),
        remoteToolName: v.optional(v.string()),
        returnDirect: v.optional(v.boolean()),
        returnType: v.optional(v.string()),
        outputSchema: v.optional(v.string()),
        commandConfig: v.optional(
          v.object({
            stateUpdates: v.array(
              v.object({
                channelKey: v.string(),
                mode: v.optional(v.string()),
                value: v.optional(v.string()),
              })
            ),
          })
        ),
        functionBody: v.optional(v.string()),
        executionMode: v.optional(v.string()),
        headless: v.optional(v.boolean()),
        contextAccess: v.optional(
          v.object({
            enabled: v.optional(v.boolean()),
            fields: v.optional(v.array(v.string())),
          })
        ),
        storeAccess: v.optional(
          v.object({
            enabled: v.optional(v.boolean()),
            namespace: v.optional(v.string()),
            operations: v.optional(v.array(v.string())),
          })
        ),
        streamWriter: v.optional(v.boolean()),
        errorHandling: v.optional(
          v.object({
            enabled: v.optional(v.boolean()),
            retryCount: v.optional(v.number()),
            customErrorMessage: v.optional(v.string()),
          })
        ),
        position: v.optional(v.object({ x: v.number(), y: v.number() })),
      })
    )
  ),
  middlewareDefinitions: v.optional(
    v.array(
      v.object({
        id: v.optional(v.string()),
        middlewareId: v.optional(v.string()),
        name: v.string(),
        type: v.string(),
        humanInTheLoopConfig: v.optional(
          v.object({
            interruptOn: v.optional(v.record(v.string(), v.boolean())),
            approvalPrompt: v.optional(v.string()),
            requiredRole: v.optional(v.string()),
          })
        ),
        rateLimitConfig: v.optional(
          v.object({
            requestsPerMinute: v.number(),
            windowMs: v.optional(v.number()),
          })
        ),
        loggingConfig: v.optional(
          v.object({
            logLevel: v.string(),
            tracingTarget: v.optional(v.string()),
          })
        ),
        summarizationConfig: v.optional(
          v.object({
            model: v.optional(v.string()),
            triggerTokens: v.optional(v.number()),
            triggerMessages: v.optional(v.number()),
            triggerFraction: v.optional(v.number()),
            keepMessages: v.optional(v.number()),
            keepTokens: v.optional(v.number()),
            keepFraction: v.optional(v.number()),
            summaryPrompt: v.optional(v.string()),
            trimTokensToSummarize: v.optional(v.number()),
            summaryPrefix: v.optional(v.string()),
          })
        ),
        modelCallLimitConfig: v.optional(
          v.object({
            threadLimit: v.optional(v.number()),
            runLimit: v.optional(v.number()),
            exitBehavior: v.optional(v.string()),
          })
        ),
        toolCallLimitConfig: v.optional(
          v.object({
            toolName: v.optional(v.string()),
            threadLimit: v.optional(v.number()),
            runLimit: v.optional(v.number()),
            exitBehavior: v.optional(v.string()),
          })
        ),
        modelFallbackConfig: v.optional(
          v.object({
            fallbackModels: v.optional(v.array(v.string())),
          })
        ),
        piiConfig: v.optional(
          v.object({
            piiType: v.optional(v.string()),
            strategy: v.optional(v.string()),
            detectorPattern: v.optional(v.string()),
            applyToInput: v.optional(v.boolean()),
            applyToOutput: v.optional(v.boolean()),
            applyToToolResults: v.optional(v.boolean()),
          })
        ),
        todoListConfig: v.optional(
          v.object({
            enableWriteTodos: v.optional(v.boolean()),
            autoInjectPrompt: v.optional(v.boolean()),
            initialTasks: v.optional(v.string()),
          })
        ),
        llmToolSelectorConfig: v.optional(
          v.object({
            model: v.optional(v.string()),
            maxTools: v.optional(v.number()),
            alwaysInclude: v.optional(v.array(v.string())),
            systemPrompt: v.optional(v.string()),
          })
        ),
        toolRetryConfig: v.optional(
          v.object({
            maxRetries: v.optional(v.number()),
            backoffFactor: v.optional(v.number()),
            initialDelayMs: v.optional(v.number()),
            maxDelayMs: v.optional(v.number()),
            jitter: v.optional(v.boolean()),
            onFailure: v.optional(v.string()),
            tools: v.optional(v.array(v.string())),
          })
        ),
        modelRetryConfig: v.optional(
          v.object({
            maxRetries: v.optional(v.number()),
            backoffFactor: v.optional(v.number()),
            initialDelayMs: v.optional(v.number()),
            maxDelayMs: v.optional(v.number()),
            jitter: v.optional(v.boolean()),
            onFailure: v.optional(v.string()),
          })
        ),
        toolEmulatorConfig: v.optional(
          v.object({
            model: v.optional(v.string()),
            emulatedTools: v.optional(v.array(v.string())),
          })
        ),
        contextEditingConfig: v.optional(
          v.object({
            triggerTokens: v.optional(v.number()),
            keep: v.optional(v.number()),
            clearToolInputs: v.optional(v.boolean()),
            excludeTools: v.optional(v.array(v.string())),
            placeholder: v.optional(v.string()),
          })
        ),
        providerToolSearchConfig: v.optional(
          v.object({
            searchableTools: v.optional(v.array(v.string())),
          })
        ),
        filesystemConfig: v.optional(
          v.object({
            backend: v.optional(v.string()),
            memoriesPath: v.optional(v.string()),
            systemPrompt: v.optional(v.string()),
            customToolDescriptions: v.optional(v.string()),
          })
        ),
        subagentConfig: v.optional(
          v.object({
            defaultModel: v.optional(v.string()),
            defaultTools: v.optional(v.array(v.string())),
            subagentsJson: v.optional(v.string()),
          })
        ),
        customBody: v.optional(v.string()),
        position: v.optional(v.object({ x: v.number(), y: v.number() })),
      })
    )
  ),
  agentDefinitions: v.optional(
    v.array(
      v.object({
        id: v.optional(v.string()),
        agentId: v.optional(v.string()),
        name: v.string(),
        systemPrompt: v.optional(v.string()),
        modelConfig: v.optional(v.any()),
        tools: v.optional(v.array(v.string())),
        middleware: v.optional(v.array(v.string())),
        position: v.optional(v.object({ x: v.number(), y: v.number() })),
      })
    )
  ),
  graphSteps: v.optional(
    v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.string(),
        modelConfig: v.optional(
          v.object({
            provider: v.optional(v.string()),
            model: v.optional(v.string()),
            temperature: v.optional(v.number()),
            maxTokens: v.optional(v.number()),
            systemPrompt: v.optional(v.string()),
            baseUrl: v.optional(v.string()),
            url: v.optional(v.string()),
            method: v.optional(v.string()),
            headersJson: v.optional(v.string()),
            bodyJson: v.optional(v.string()),
            apiKeyHeader: v.optional(v.string()),
            customLlmNodeId: v.optional(v.string()),
          })
        ),
        humanGateConfig: v.optional(
          v.object({
            approvalPrompt: v.string(),
            timeoutMs: v.optional(v.number()),
            requiredRole: v.optional(v.string()),
          })
        ),
        interruptConfig: v.optional(
          v.object({
            callbackKey: v.string(),
            timeoutMs: v.optional(v.number()),
          })
        ),
        customCode: v.optional(
          v.object({
            body: v.string(),
            timeoutMs: v.optional(v.number()),
            memoryLimitMb: v.optional(v.number()),
          })
        ),
        routerConfig: v.optional(
          v.object({
            branches: v.array(
              v.object({
                id: v.string(),
                label: v.string(),
                field: v.string(),
                operator: v.string(),
                value: v.optional(v.string()),
                isDefault: v.optional(v.boolean()),
              })
            ),
          })
        ),
        tools: v.optional(v.array(v.string())),
        retryPolicy: v.optional(
          v.object({
            maxAttempts: v.number(),
            backoffFactor: v.number(),
          })
        ),
        stateUpdates: v.optional(
          v.array(
            v.object({
              channelKey: v.string(),
              value: v.optional(v.string()),
              mode: v.optional(v.string()),
            })
          )
        ),
      })
    )
  ),
  graphEdges: v.optional(
    v.array(
      v.object({
        id: v.string(),
        source: v.string(),
        sourceHandle: v.optional(v.string()),
        targetHandle: v.optional(v.string()),
        targets: v.optional(
          v.array(
            v.object({
              id: v.string(),
              kind: v.string(),
              targetHandle: v.optional(v.string()),
            })
          )
        ),
        condition: v.optional(
          v.object({
            field: v.optional(v.string()),
            operator: v.optional(v.string()),
            value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null(), v.array(v.union(v.string(), v.number(), v.boolean(), v.null())))),
          })
        ),
        isDefault: v.optional(v.boolean()),
        sendConfig: v.optional(
          v.object({
            enabled: v.optional(v.boolean()),
            itemsField: v.optional(v.string()),
            itemTarget: v.optional(
              v.object({
                id: v.string(),
                kind: v.string(),
              })
            ),
            joinStepId: v.optional(v.string()),
            batchErrorPolicy: v.optional(v.string()),
          })
        ),
      })
    )
  ),
  memoryConfig: v.optional(
    v.object({
      checkpointer: v.optional(v.string()),
      checkpointerConnectionId: v.optional(v.string()),
      threadScope: v.optional(v.string()),
      autoSummarize: v.optional(v.boolean()),
      maxWindowMessages: v.optional(v.number()),
      vectorStore: v.optional(
        v.object({
          enabled: v.optional(v.boolean()),
          provider: v.optional(v.string()),
          embeddingModel: v.optional(v.string()),
          collection: v.optional(v.string()),
          topK: v.optional(v.number()),
          similarityThreshold: v.optional(v.number()),
        })
      ),
    })
  ),
});

// Node Data Validator
// Using zodToConvex & explicit validators to keep database schemas in sync
export const backendNodeDataValidator = v.union(
  zodToConvex(serviceDataSchema),
  zodToConvex(dbRefDataSchema),
  zodToConvex(webClientDataSchema),
  zodToConvex(externalDataSchema),
  zodToConvex(simpleDataSchema),
  zodToConvex(entityDataSchema),
  zodToConvex(kafkaDataSchema),
  zodToConvex(sqsDataSchema),
  zodToConvex(redisPubSubDataSchema),
  zodToConvex(redisStreamsDataSchema),
  zodToConvex(redisCacheDataSchema),
  zodToConvex(storageDataSchema),
  zodToConvex(workerDataSchema),
  zodToConvex(serverlessDataSchema),
  zodToConvex(searchIndexDataSchema),
  zodToConvex(apiGatewayDataSchema),
  zodToConvex(loadBalancerDataSchema),
  zodToConvex(webhookDataSchema),
  zodToConvex(llmDataSchema),
  zodToConvex(mcpServerDataSchema),
  zodToConvex(vectorDbRefDataSchema),
  zodToConvex(identityProviderDataSchema),
  langgraphConvexDataValidator,
  zodToConvex(langgraphStepDataSchema),
  // Fallback for completely empty data (allowable in some updates)
  v.object({
    label: v.optional(v.string()),
    parentId: v.optional(v.string()),
    position: v.optional(v.object({ x: v.number(), y: v.number() })),
    style: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null()))),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  })
);

import { z } from "zod";

export const backendEndpointDataValidator = zodToConvex(endpointSchema);
export const backendIdentityProviderDataValidator = zodToConvex(identityProviderSchema);
export const backendEventDataValidator = zodToConvex(z.union([publishedEventSchema, consumedEventSchema]));
