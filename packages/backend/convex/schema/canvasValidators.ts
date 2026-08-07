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
  authDataSchema,
  paymentsDataSchema,
  webAppDataSchema,
  langgraphDataSchema,
  langgraphStepDataSchema,
  identityProviderSchema,
  publishedEventSchema,
  consumedEventSchema,
} from "@workspace/canvas/schemas";

// Test Case Data Validator
export const backendTestCaseDataValidator = zodToConvex(
  simulationTestCaseSchema,
);

// Edge Data Validator
export const backendEdgeDataValidator = zodToConvex(edgeDataSchema);

export const langgraphConvexDataValidator = v.object({
  label: v.optional(v.string()),
  description: v.optional(v.string()),
  parentId: v.optional(v.string()),
  position: v.optional(v.object({ x: v.number(), y: v.number() })),
  style: v.optional(
    v.record(
      v.string(),
      v.union(v.string(), v.number(), v.boolean(), v.null()),
    ),
  ),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  version: v.optional(v.number()),
  recursionLimit: v.optional(v.number()),
  stepTimeoutMs: v.optional(v.number()),
  inputChannels: v.optional(v.array(v.any())),
  outputChannels: v.optional(v.array(v.any())),
  stateChannels: v.optional(v.array(v.any())),
  outputPorts: v.optional(v.array(v.any())),
  tools: v.optional(v.array(v.any())),
  customLlmNodes: v.optional(v.array(v.any())),
  toolDefinitions: v.optional(v.array(v.any())),
  middlewareDefinitions: v.optional(v.array(v.any())),
  agentDefinitions: v.optional(v.array(v.any())),
  memoryDefinitions: v.optional(v.array(v.any())),
  graphSteps: v.optional(v.array(v.any())),
  graphEdges: v.optional(v.array(v.any())),
  memoryConfig: v.optional(v.any()),
  startNodePosition: v.optional(v.object({ x: v.number(), y: v.number() })),
  stateNodePosition: v.optional(v.object({ x: v.number(), y: v.number() })),
  endNodePosition: v.optional(v.object({ x: v.number(), y: v.number() })),
  endNodes: v.optional(v.array(v.any())),
});

// Node Data Validator
// Using zodToConvex & explicit validators to keep database schemas in sync
export const backendNodeDataValidator = v.union(
  zodToConvex(serviceDataSchema),
  zodToConvex(dbRefDataSchema),
  zodToConvex(webClientDataSchema),
  zodToConvex(webAppDataSchema),
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
  zodToConvex(authDataSchema),
  zodToConvex(paymentsDataSchema),
  langgraphConvexDataValidator,
  zodToConvex(langgraphStepDataSchema),
  // Fallback for completely empty data (allowable in some updates)
  v.object({
    label: v.optional(v.string()),
    parentId: v.optional(v.string()),
    position: v.optional(v.object({ x: v.number(), y: v.number() })),
    style: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null()),
      ),
    ),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  }),
);

import { z } from "zod";

export const backendEndpointDataValidator = zodToConvex(endpointSchema);
export const backendIdentityProviderDataValidator = zodToConvex(
  identityProviderSchema,
);
export const backendEventDataValidator = zodToConvex(
  z.union([publishedEventSchema, consumedEventSchema]),
);
