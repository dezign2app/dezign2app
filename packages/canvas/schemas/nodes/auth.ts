import { z } from "zod";
import { baseNodeDataSchema } from "./base";

export const oauthProviderConfigSchema = z.object({
  id: z.string(),
  provider: z.string(),
  clientIdEnv: z.string(),
  clientSecretEnv: z.string(),
});
export type OAuthProviderConfig = z.infer<typeof oauthProviderConfigSchema>;

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
export type SessionClaimConfig = z.infer<typeof sessionClaimConfigSchema>;

export const authFunctionRefSchema = z.object({
  id: z.string(),
  variableName: z.string().optional(),
  entityNodeId: z.string(),
  functionId: z.string(),
});
export type AuthFunctionRef = z.infer<typeof authFunctionRefSchema>;

export const userCustomFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  default: z.string().optional(),
  required: z.boolean(),
});
export type UserCustomField = z.infer<typeof userCustomFieldSchema>;

export const authHookConfigSchema = z.object({
  event: z
    .enum([
      "onSignUp",
      "onSignIn",
      "onSignOut",
      "onPasswordReset",
      "onEmailVerify",
      "onOrgCreate",
      "onOrgInvite",
    ])
    .optional(),
  enabled: z.boolean().optional(),
  mode: z.enum(["naturalLanguage", "code"]),
  prompt: z.string().optional(),
  code: z.string().optional(),
});
export type AuthHookConfig = z.infer<typeof authHookConfigSchema>;

export const additionalAuthTableConfigSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  purpose: z.string().optional(),
});
export type AdditionalAuthTableConfig = z.infer<
  typeof additionalAuthTableConfigSchema
>;

export const accountLinkingPolicySchema = z.object({
  enabled: z.boolean().optional(),
  policy: z.enum(["prompt", "merge", "block"]).optional(),
  trustedProvidersOnly: z.boolean().optional(),
});
export type AccountLinkingPolicy = z.infer<typeof accountLinkingPolicySchema>;

export const emailPasswordConfigSchema = z.object({
  enabled: z.boolean(),
  requireVerification: z.boolean(),
  minLength: z.number(),
  requireUppercase: z.boolean().optional(),
  requireNumbers: z.boolean().optional(),
  requireSpecialChars: z.boolean().optional(),
  rateLimit: z
    .object({
      maxAttempts: z.number().optional(),
      windowSeconds: z.number().optional(),
      lockoutDurationSeconds: z.number().optional(),
    })
    .optional(),
});
export type EmailPasswordConfig = z.infer<typeof emailPasswordConfigSchema>;

export const sessionConfigSchema = z.object({
  claims: z.array(sessionClaimConfigSchema).optional(),
  expiresInSeconds: z.number().optional(),
  updateAgeSeconds: z.number().optional(),
  refreshTokenRotation: z.boolean().optional(),
  rememberMeDurationDays: z.number().optional(),
});
export type SessionConfig = z.infer<typeof sessionConfigSchema>;

export const orgInvitationsConfigSchema = z.object({
  deliveryMethod: z.enum(["email", "link", "both"]).optional(),
  inviteExpiresInDays: z.number().optional(),
  defaultRole: z.string().optional(),
  allowMemberInvites: z.boolean().optional(),
});
export type OrgInvitationsConfig = z.infer<typeof orgInvitationsConfigSchema>;

export const redirectsConfigSchema = z.object({
  signInRedirectUrl: z.string().optional(),
  signUpRedirectUrl: z.string().optional(),
  signOutRedirectUrl: z.string().optional(),
  callbackUrl: z.string().optional(),
});
export type RedirectsConfig = z.infer<typeof redirectsConfigSchema>;

export const betterAuthTableMappingSchema = z.object({
  userEntityId: z.string().optional(),
  sessionEntityId: z.string().optional(),
  accountEntityId: z.string().optional(),
  verificationEntityId: z.string().optional(),
  orgEntityId: z.string().optional(),
  memberEntityId: z.string().optional(),
  invitationEntityId: z.string().optional(),
  teamEntityId: z.string().optional(),
  teamMemberEntityId: z.string().optional(),
  passkeyEntityId: z.string().optional(),
  twoFactorEntityId: z.string().optional(),
  jwksEntityId: z.string().optional(),
  rateLimitEntityId: z.string().optional(),
});
export type BetterAuthTableMapping = z.infer<
  typeof betterAuthTableMappingSchema
>;

// --- Auth Framework Node Schema ---
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
    authFunctions: z.array(authFunctionRefSchema).optional(),
    tableMappings: betterAuthTableMappingSchema.optional(),
    userEntityId: z.string().optional(),
    userSchemaId: z.string().optional(),
    additionalUserTables: z.array(additionalAuthTableConfigSchema).optional(),
    additionalTables: z.array(additionalAuthTableConfigSchema).optional(),
    providers: z
      .object({
        emailPassword: emailPasswordConfigSchema.optional(),
        socialEnabled: z.boolean().optional(),
        oauthEnabled: z.boolean().optional(),
        oauth: z.array(oauthProviderConfigSchema).optional(),
        magicLink: z.boolean().optional(),
        passkey: z.boolean().optional(),
        accountLinking: accountLinkingPolicySchema.optional(),
      })
      .optional(),
    session: sessionConfigSchema.optional(),
    redirects: redirectsConfigSchema.optional(),
    trustedOrigins: z.array(z.string()).optional(),
    organization: z
      .object({
        enabled: z.boolean().optional(),
        roles: z.array(z.string()).optional(),
        teams: z.boolean().optional(),
        multiOrg: z.boolean().optional(),
        invitations: z.boolean().optional(),
        invitationsConfig: orgInvitationsConfigSchema.optional(),
        schemaId: z.string().optional(),
        entityId: z.string().optional(),
        additionalTables: z.array(additionalAuthTableConfigSchema).optional(),
      })
      .optional(),
    subscription: z
      .object({
        enabled: z.boolean().optional(),
        schemaId: z.string().optional(),
        entityId: z.string().optional(),
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
