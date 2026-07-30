import { z } from "zod";
import { endpointSchema } from "../endpoints";
import { baseNodeDataSchema, resourceItemSchema } from "./base";

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

export const routeGroupSchema = z.object({
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
