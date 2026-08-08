import { z } from "zod";
import { endpointSchema } from "../endpoints";
import { baseNodeDataSchema, resourceItemSchema } from "./base";

// --- Identity Provider Node ---
export const identityProviderDataSchema = baseNodeDataSchema
  .extend({
    description: z.string().optional(),
  })
  .strict();
export type IdentityProviderNodeData = z.infer<
  typeof identityProviderDataSchema
>;

export const oauthProviderConfigSchema = z.object({
  id: z.string(),
  provider: z.string(),
  clientIdEnv: z.string(),
  clientSecretEnv: z.string(),
});

export const sessionClaimConfigSchema = z.object({
  key: z.string(),
  source: z.enum([
    "userColumn",
    "dbFunction",
    "serviceEndpoint",
    "customFunction",
    "orgRole",
    "subscription",
    "paymentsAccess",
    "customField",
  ]),
  targetValue: z.string().optional(),
  deliveryMode: z.enum(["jwt", "cookie"]),
});

export const authSubscriptionConfigSchema = z.object({
  enabled: z.boolean().optional(),
  provider: z.string().optional(),
  entityId: z.string().optional(),
  schemaId: z.string().optional(),
  statusColumn: z.string().optional(),
  planColumn: z.string().optional(),
  customerIdColumn: z.string().optional(),
  periodEndColumn: z.string().optional(),
});

export const userCustomFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  default: z.string().optional(),
  required: z.boolean(),
});

export const authHookConfigSchema = z.object({
  mode: z.enum(["naturalLanguage", "code"]),
  prompt: z.string().optional(),
  code: z.string().optional(),
});

export const paymentsPlanConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.string(),
  interval: z.enum(["monthly", "yearly"]),
});

export const additionalAuthTableConfigSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  purpose: z.string().optional(),
});

// --- Auth Framework Node ---
export const authDataSchema = baseNodeDataSchema
  .extend({
    description: z.string().optional(),
    framework: z.string().optional(),
    authMode: z.string().optional(),
    plugins: z.array(z.string()).optional(),
    secretKey: z.string().optional(),
    baseUrl: z.string().optional(),
    provider: z.string().optional(),
    version: z.string().optional(),
    dbAdapter: z.string().optional(),
    userEntityId: z.string().optional(),
    userSchemaId: z.string().optional(),
    additionalUserTables: z.array(additionalAuthTableConfigSchema).optional(),
    additionalTables: z.array(additionalAuthTableConfigSchema).optional(),
    providers: z
      .object({
        emailPassword: z
          .object({
            enabled: z.boolean(),
            requireVerification: z.boolean(),
            minLength: z.number(),
          })
          .optional(),
        socialEnabled: z.boolean().optional(),
        oauthEnabled: z.boolean().optional(),
        oauth: z.array(oauthProviderConfigSchema).optional(),
        magicLink: z.boolean().optional(),
        passkey: z.boolean().optional(),
      })
      .optional(),
    session: z
      .object({
        claims: z.array(sessionClaimConfigSchema).optional(),
      })
      .optional(),
    subscription: authSubscriptionConfigSchema.optional(),
    organization: z
      .object({
        enabled: z.boolean().optional(),
        roles: z.array(z.string()).optional(),
        teams: z.boolean().optional(),
        multiOrg: z.boolean().optional(),
        invitations: z.boolean().optional(),
        schemaId: z.string().optional(),
        entityId: z.string().optional(),
        additionalTables: z.array(additionalAuthTableConfigSchema).optional(),
      })
      .optional(),
    customFields: z.array(userCustomFieldSchema).optional(),
    hooks: z.array(authHookConfigSchema).optional(),
    paymentsPlugin: z
      .object({
        provider: z.literal("creem"),
        apiKeyEnv: z.string(),
        webhookSecretEnv: z.string(),
      })
      .optional(),
  })
  .passthrough();
export type AuthNodeData = z.infer<typeof authDataSchema>;

// --- Payments Node ---
export const paymentsDataSchema = baseNodeDataSchema
  .extend({
    description: z.string().optional(),
    provider: z.string().optional(),
    plans: z.array(paymentsPlanConfigSchema).optional(),
    eventMapping: z.record(z.string(), z.string()).optional(),
    apiKeyEnv: z.string().optional(),
    webhookSecretEnv: z.string().optional(),
  })
  .passthrough();
export type PaymentsNodeData = z.infer<typeof paymentsDataSchema>;

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

export const apiGatewayDataSchema = baseNodeDataSchema
  .extend({
    description: z.string().optional(),
    // Core Resources
    routes: z.array(gatewayRouteSchema).optional(),
    endpoints: z.array(endpointSchema).optional(), // Kept for backwards compatibility
    routeGroups: z.array(routeGroupSchema).optional(), // Kept for backwards compatibility
    authRules: z.array(authRuleSchema).optional(),
    // Implementation
    implementation: z
      .enum(["AWS API Gateway", "Kong", "Nginx", "Traefik", "Custom", "Other"])
      .optional(),
    // Security
    // Kept for backwards compatibility with older gateway nodes.
    authType: z.enum(["None", "JWT", "API Key", "OAuth2", "mTLS"]).optional(),
    // Configuration (Advanced)
    rateLimit: z.string().optional(), // "1000/min", "100/s"
    timeout: z.string().optional(),
    cors: z.boolean().optional(),
    corsOrigins: z.string().optional(),
    // Tags
    tags: z.array(z.string()).optional(),
  })
  .strict();
export type ApiGatewayNodeData = z.infer<typeof apiGatewayDataSchema>;

// --- Load Balancer Node ---
export const loadBalancerDataSchema = baseNodeDataSchema
  .extend({
    description: z.string().optional(),
    // Core Resources
    targetGroups: z.array(resourceItemSchema).optional(),
    // Implementation
    implementation: z
      .enum(["AWS ALB", "AWS NLB", "Nginx", "HAProxy", "Cloudflare", "Other"])
      .optional(),
    // Configuration (Advanced)
    algorithm: z
      .enum(["Round Robin", "Least Connections", "IP Hash", "Random"])
      .optional(),
    healthCheckPath: z.string().optional(), // "/health", "/ping"
    // Tags
    tags: z.array(z.string()).optional(),
  })
  .strict();
export type LoadBalancerNodeData = z.infer<typeof loadBalancerDataSchema>;

// --- Webhook Node ---
export const webhookDataSchema = baseNodeDataSchema
  .extend({
    description: z.string().optional(),
    // Core Resources
    events: z.array(resourceItemSchema).optional(),
    // Security
    authentication: z
      .enum(["None", "HMAC", "Bearer", "Basic", "Custom"])
      .optional(),
    // Tags
    tags: z.array(z.string()).optional(),
  })
  .strict();
export type WebhookNodeData = z.infer<typeof webhookDataSchema>;
