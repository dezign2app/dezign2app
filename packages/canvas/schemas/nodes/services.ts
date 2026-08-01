import { z } from "zod";
import { schemaModelSchema } from "../shared";
import { endpointSchema, endpointInputSchema } from "../endpoints";
import {
  consumedEventSchema,
  consumedEventInputSchema,
  publishedEventSchema,
  publishedEventInputSchema,
} from "../events";
import {
  baseNodeDataSchema,
  resourceItemSchema,
  simpleDataSchema,
} from "./base";

export const externalDataSchema = simpleDataSchema.extend({
  baseUrl: z.string().optional(),
  actions: z.array(resourceItemSchema).optional(),
});

export const clientEventInputSchema = z.object({
  id: z.string().optional().describe("Unique identifier for this event"),
  name: z
    .string()
    .describe("Logical name of the action (e.g., 'sendMessage', 'fetchData')"),
  event: z.string().optional().describe("The DOM event that triggers it"),
  schema: z.string().optional().describe("Input schema for the API call"),
  targetNodeId: z
    .string()
    .optional()
    .describe(
      "If this event triggers an API call, specify the target service node ID to AUTOMATICALLY create an edge",
    ),
  targetEndpointId: z
    .string()
    .optional()
    .describe(
      "If this event triggers an API call, specify the target endpoint ID on the service node to AUTOMATICALLY create an edge",
    ),
  simulationCases: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        request: z
          .object({
            headers: z.record(z.string()).optional(),
            params: z.record(z.string()).optional(),
            body: z.unknown().optional(),
          })
          .optional(),
        expectedStatus: z.number().optional(),
        expectedBody: z.unknown().optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .optional()
    .describe("Named repeatable inputs for client-triggered simulations"),
});

export const webClientDataSchema = simpleDataSchema.extend({
  events: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        event: z.string().optional(),
        schema: z.string().optional(),
        simulationCases: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              request: z
                .object({
                  headers: z.record(z.string()).optional(),
                  params: z.record(z.string()).optional(),
                  body: z.unknown().optional(),
                })
                .optional(),
              expectedStatus: z.number().optional(),
              expectedBody: z.unknown().optional(),
              enabled: z.boolean().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

export const webClientDataInputSchema = baseNodeDataSchema.extend({
  description: z.string().optional(),
  events: z.array(clientEventInputSchema).optional(),
});

export const serviceDataSchema = baseNodeDataSchema
  .extend({
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
    routeGroups: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          basePath: z.string(),
          endpoints: z.array(endpointSchema),
        }),
      )
      .optional(),
  })
  .strict();
export type ServiceNodeData = z.infer<typeof serviceDataSchema>;

export const serviceDataInputSchema = baseNodeDataSchema
  .extend({
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
    inputs: z
      .array(
        z.object({ id: z.string().optional(), name: z.string() }).passthrough(),
      )
      .optional(),
    outputs: z
      .array(
        z.object({ id: z.string().optional(), name: z.string() }).passthrough(),
      )
      .optional(),
    logic: z
      .array(
        z.object({ id: z.string().optional(), name: z.string() }).passthrough(),
      )
      .optional(),
    routeGroups: z
      .array(
        z
          .object({
            id: z.string().optional(),
            name: z.string(),
            basePath: z.string(),
            endpoints: z.array(endpointInputSchema),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

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
export const workerDataSchema = baseNodeDataSchema
  .extend({
    description: z.string().optional(),
    // Core Resources
    tasks: z.array(workerTaskSchema).optional(),
    // Implementation
    queueSources: z.array(z.string()).optional(), // IDs of broker nodes it pulls from
    // Configuration (Advanced)
    concurrency: z.number().optional(),
    retryPolicy: z
      .enum(["NONE", "EXPONENTIAL_BACKOFF", "FIXED_INTERVAL"])
      .optional(),
    maxRetries: z.number().optional(),
    // Tags
    tags: z.array(z.string()).optional(),
  })
  .strict();
export type WorkerNodeData = z.infer<typeof workerDataSchema>;

// --- Serverless Function Node ---
export const serverlessDataSchema = baseNodeDataSchema
  .extend({
    description: z.string().optional(),
    // Core Resources
    endpoints: z.array(endpointSchema).optional(),
    // Implementation
    triggerType: z.enum(["HTTP", "Event", "CRON", "Queue"]).optional(),
    runtime: z.string().optional(), // "nodejs20.x", "python3.12", "go1.x"
    // Configuration (Advanced)
    memoryMb: z.number().optional(),
    timeoutSec: z.number().optional(),
    // Tags
    tags: z.array(z.string()).optional(),
  })
  .strict();
export type ServerlessNodeData = z.infer<typeof serverlessDataSchema>;
