import { z } from "zod";

export const edgeDataSchema = z.object({
  label: z.string().optional(),
  sequenceOrder: z.number().optional(),
  sourceCardinality: z.enum(["1", "N"]).optional(),
  targetCardinality: z.enum(["1", "N"]).optional(),
  resourceKind: z.string().optional(),
  // --- Identity Connection Fields ---
  protocol: z.string().optional(),
  grantType: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUris: z.array(z.string()).optional(),
  pkce: z.boolean().optional(),
  scopes: z.array(z.string()).optional(),
  responseType: z.string().optional(),
  responseMode: z.string().optional(),
  notes: z.string().optional(),
  // --- LangGraph Route Invocation ---
  // Maps HTTP body / event payload fields → LangGraph state channel keys.
  payloadMapping: z.record(z.string(), z.string()).optional(),
  preInvokeLogicMode: z.enum(["natural_language", "code"]).optional(),
  preInvokePrompt: z.string().optional(),
  preInvokeCode: z.string().optional(),
  // Response & Output configuration
  responseExecutionMode: z.enum(["sync", "stream", "async_ack"]).optional(),
  responseOutputMode: z.enum(["full", "selected"]).optional(),
  responseFields: z.array(z.string()).optional(),
  postInvokeLogicMode: z.enum(["natural_language", "code"]).optional(),
  postInvokePrompt: z.string().optional(),
  postInvokeCode: z.string().optional(),
});

