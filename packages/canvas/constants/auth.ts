import type { BetterAuthTableDefinition } from "../types/auth";

// ─── Auth Framework & Better Auth Options ───────────────────────────────────────
export const AUTH_FRAMEWORK_BETTER_AUTH = "better_auth" as const;
export const AUTH_FRAMEWORK_NEXT_AUTH = "next_auth" as const;
export const AUTH_FRAMEWORK_LUCIA = "lucia" as const;
export const AUTH_FRAMEWORK_CUSTOM = "custom" as const;

export const AUTH_FRAMEWORK_OPTIONS = [
  { value: "better_auth", label: "Better Auth" },
] as const;

export const BETTER_AUTH_VERSIONS = [
  { value: "v1.7", label: "v1.7" },
] as const;

export const DEFAULT_AUTH_FRAMEWORK = AUTH_FRAMEWORK_BETTER_AUTH;
export const DEFAULT_BETTER_AUTH_VERSION = "v1.7";

// ─── Access Conditions & Protection Rule Enums ──────────────────────────────
export const CONDITION_PRIMITIVE_TYPES = [
  "auth",
  "org",
  "orgRole",
  "access",
  "subscriptionStatus",
  "plan",
  "customClaim",
] as const;

export type ConditionPrimitiveType = (typeof CONDITION_PRIMITIVE_TYPES)[number];

export const FAILURE_REASONS = [
  "no-auth",
  "no-org",
  "wrong-role",
  "no-access",
  "wrong-plan",
  "custom-denied",
] as const;

export type FailureReasonType = (typeof FAILURE_REASONS)[number];

export const SESSION_DELIVERY_MODES = ["jwt", "cookie"] as const;
export type SessionDeliveryMode = (typeof SESSION_DELIVERY_MODES)[number];

export const DEFAULT_SESSION_CLAIM_SOURCE = "customField" as const;
export const DEFAULT_SESSION_CLAIM_DELIVERY_MODE = "jwt" as const;

export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "expired",
] as const;

export type SubscriptionStatusType = (typeof SUBSCRIPTION_STATUSES)[number];

export const PAYMENTS_INTERVALS = ["monthly", "yearly"] as const;
export type PaymentsIntervalType = (typeof PAYMENTS_INTERVALS)[number];

export const PAYMENT_PROVIDER_OPTIONS = [
  { value: "creem", label: "Creem" },
  // { value: "lemonsqueezy", label: "Lemon Squeezy" },
  // { value: "custom", label: "Custom Billing Engine" },
  // { value: "stripe", label: "Stripe" }
] as const;

// ─── Better Auth Table Definitions ───────────────────────────────────────────
export const BETTER_AUTH_TABLE_DEFINITIONS: BetterAuthTableDefinition[] = [
  {
    key: "userEntityId",
    name: "user",
    category: "core",
    description: "Core user accounts, emails, display names, and verification flags.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "name", type: "VARCHAR" },
      { name: "email", type: "VARCHAR", isUnique: true },
      { name: "emailVerified", type: "BOOLEAN" },
      { name: "image", type: "TEXT" },
      { name: "createdAt", type: "TIMESTAMP" },
      { name: "updatedAt", type: "TIMESTAMP" },
    ],
  },
  {
    key: "sessionEntityId",
    name: "session",
    category: "core",
    description: "Active session tokens, expiration timestamps, IP & User-Agent metadata.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "userId", type: "UUID", isForeignKey: true, references: { table: "user", column: "id" } },
      { name: "token", type: "VARCHAR", isUnique: true },
      { name: "expiresAt", type: "TIMESTAMP" },
      { name: "ipAddress", type: "VARCHAR" },
      { name: "userAgent", type: "TEXT" },
      { name: "createdAt", type: "TIMESTAMP" },
      { name: "updatedAt", type: "TIMESTAMP" },
    ],
  },
  {
    key: "accountEntityId",
    name: "account",
    category: "core",
    description: "OAuth provider credentials, hashed passwords, and token links.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "userId", type: "UUID", isForeignKey: true, references: { table: "user", column: "id" } },
      { name: "accountId", type: "VARCHAR" },
      { name: "providerId", type: "VARCHAR" },
      { name: "password", type: "VARCHAR" },
      { name: "accessToken", type: "TEXT" },
      { name: "refreshToken", type: "TEXT" },
      { name: "accessTokenExpiresAt", type: "TIMESTAMP" },
      { name: "refreshTokenExpiresAt", type: "TIMESTAMP" },
      { name: "scope", type: "TEXT" },
      { name: "idToken", type: "TEXT" },
      { name: "createdAt", type: "TIMESTAMP" },
      { name: "updatedAt", type: "TIMESTAMP" },
    ],
  },
  {
    key: "verificationEntityId",
    name: "verification",
    category: "core",
    description: "Email verification, magic link, and OTP tokens.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "identifier", type: "VARCHAR" },
      { name: "value", type: "TEXT" },
      { name: "expiresAt", type: "TIMESTAMP" },
      { name: "createdAt", type: "TIMESTAMP" },
      { name: "updatedAt", type: "TIMESTAMP" },
    ],
  },
  {
    key: "orgEntityId",
    name: "organization",
    category: "organization",
    description: "Multi-tenant workspaces, company accounts, and team scopes.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "name", type: "VARCHAR" },
      { name: "slug", type: "VARCHAR", isUnique: true },
      { name: "logo", type: "TEXT" },
      { name: "metadata", type: "JSON" },
      { name: "createdAt", type: "TIMESTAMP" },
    ],
  },
  {
    key: "memberEntityId",
    name: "member",
    category: "organization",
    description: "User membership mappings to organizations with roles.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "organizationId", type: "UUID", isForeignKey: true, references: { table: "organization", column: "id" } },
      { name: "userId", type: "UUID", isForeignKey: true, references: { table: "user", column: "id" } },
      { name: "role", type: "VARCHAR" },
      { name: "createdAt", type: "TIMESTAMP" },
    ],
  },
  {
    key: "invitationEntityId",
    name: "invitation",
    category: "organization",
    description: "Pending email invitations for joining organizations.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "organizationId", type: "UUID", isForeignKey: true, references: { table: "organization", column: "id" } },
      { name: "email", type: "VARCHAR" },
      { name: "role", type: "VARCHAR" },
      { name: "status", type: "VARCHAR" },
      { name: "expiresAt", type: "TIMESTAMP" },
      { name: "inviterId", type: "UUID", isForeignKey: true, references: { table: "user", column: "id" } },
    ],
  },
  {
    key: "teamEntityId",
    name: "team",
    category: "organization",
    description: "Sub-groups and department teams within organizations.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "organizationId", type: "UUID", isForeignKey: true, references: { table: "organization", column: "id" } },
      { name: "name", type: "VARCHAR" },
      { name: "createdAt", type: "TIMESTAMP" },
    ],
  },
  {
    key: "teamMemberEntityId",
    name: "teamMember",
    category: "organization",
    description: "User memberships mapped to organization teams.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "teamId", type: "UUID", isForeignKey: true, references: { table: "team", column: "id" } },
      { name: "userId", type: "UUID", isForeignKey: true, references: { table: "user", column: "id" } },
      { name: "role", type: "VARCHAR" },
      { name: "createdAt", type: "TIMESTAMP" },
    ],
  },
  {
    key: "passkeyEntityId",
    name: "passkey",
    category: "plugin",
    description: "WebAuthn / Passkey public credentials and counters.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "name", type: "VARCHAR" },
      { name: "publicKey", type: "TEXT" },
      { name: "userId", type: "UUID", isForeignKey: true, references: { table: "user", column: "id" } },
      { name: "credentialID", type: "TEXT", isUnique: true },
      { name: "counter", type: "INTEGER" },
      { name: "transports", type: "VARCHAR" },
      { name: "createdAt", type: "TIMESTAMP" },
    ],
  },
  {
    key: "twoFactorEntityId",
    name: "twoFactor",
    category: "plugin",
    description: "TOTP secrets and encrypted recovery backup codes.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "userId", type: "UUID", isForeignKey: true, references: { table: "user", column: "id" } },
      { name: "secret", type: "TEXT" },
      { name: "backupCodes", type: "TEXT" },
    ],
  },
  {
    key: "jwksEntityId",
    name: "jwks",
    category: "plugin",
    description: "RSA / EC keypairs for JWT signing and OIDC discovery.",
    defaultColumns: [
      { name: "id", type: "UUID", isPrimaryKey: true },
      { name: "publicKey", type: "TEXT" },
      { name: "privateKey", type: "TEXT" },
      { name: "createdAt", type: "TIMESTAMP" },
    ],
  },
  {
    key: "rateLimitEntityId",
    name: "rateLimit",
    category: "plugin",
    description: "Brute-force protection counter table.",
    defaultColumns: [
      { name: "key", type: "VARCHAR", isPrimaryKey: true },
      { name: "count", type: "INTEGER" },
      { name: "lastRequest", type: "BIGINT" },
    ],
  },
];
