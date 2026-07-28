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
