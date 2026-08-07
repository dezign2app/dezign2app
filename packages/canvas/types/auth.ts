import { AUTH_FRAMEWORK_OPTIONS, BETTER_AUTH_VERSIONS } from "../constants";

export type AuthFramework = (typeof AUTH_FRAMEWORK_OPTIONS)[number]["value"];
export type BetterAuthVersion = (typeof BETTER_AUTH_VERSIONS)[number]["value"];

export type IdPCapabilities = {
  authentication: boolean;
  userManagement: boolean;
  identity: boolean;
  authorization: boolean;
};

export type IdPOutputs = {
  user: boolean;
  tokens: boolean;
  claims: boolean;
};

export type IdentityProviderPreset = {
  provider: string;
  issuerUrl: string;
  discoveryUrl?: string;
  jwksUrl: string;
  supportedAlgorithms: string[];
  capabilities: IdPCapabilities;
  outputs: IdPOutputs;
};

export const IDENTITY_PROVIDER_PRESETS: Record<string, IdentityProviderPreset> =
  {
    auth0: {
      provider: "Auth0",
      issuerUrl: "https://<tenant>.auth0.com/",
      discoveryUrl:
        "https://<tenant>.auth0.com/.well-known/openid-configuration",
      jwksUrl: "https://<tenant>.auth0.com/.well-known/jwks.json",
      supportedAlgorithms: ["RS256"],
      capabilities: {
        authentication: true,
        userManagement: true,
        identity: false,
        authorization: true,
      },
      outputs: { user: true, tokens: true, claims: true },
    },
    clerk: {
      provider: "Clerk",
      issuerUrl: "https://clerk.<your-domain>.com",
      discoveryUrl:
        "https://clerk.<your-domain>.com/.well-known/openid-configuration",
      jwksUrl: "https://clerk.<your-domain>.com/.well-known/jwks.json",
      supportedAlgorithms: ["RS256"],
      capabilities: {
        authentication: true,
        userManagement: true,
        identity: false,
        authorization: true,
      },
      outputs: { user: true, tokens: true, claims: true },
    },
    keycloak: {
      provider: "Keycloak",
      issuerUrl: "https://<domain>/realms/<realm>",
      discoveryUrl:
        "https://<domain>/realms/<realm>/.well-known/openid-configuration",
      jwksUrl: "https://<domain>/realms/<realm>/protocol/openid-connect/certs",
      supportedAlgorithms: ["RS256"],
      capabilities: {
        authentication: true,
        userManagement: true,
        identity: true,
        authorization: true,
      },
      outputs: { user: true, tokens: true, claims: true },
    },
    okta: {
      provider: "Okta",
      issuerUrl: "https://<domain>.okta.com/oauth2/default",
      discoveryUrl:
        "https://<domain>.okta.com/oauth2/default/.well-known/openid-configuration",
      jwksUrl: "https://<domain>.okta.com/oauth2/default/v1/keys",
      supportedAlgorithms: ["RS256"],
      capabilities: {
        authentication: true,
        userManagement: true,
        identity: true,
        authorization: true,
      },
      outputs: { user: true, tokens: true, claims: true },
    },
    cognito: {
      provider: "AWS Cognito",
      issuerUrl: "https://cognito-idp.<region>.amazonaws.com/<pool-id>",
      discoveryUrl:
        "https://cognito-idp.<region>.amazonaws.com/<pool-id>/.well-known/openid-configuration",
      jwksUrl:
        "https://cognito-idp.<region>.amazonaws.com/<pool-id>/.well-known/jwks.json",
      supportedAlgorithms: ["RS256"],
      capabilities: {
        authentication: true,
        userManagement: true,
        identity: true,
        authorization: true,
      },
      outputs: { user: true, tokens: true, claims: true },
    },
    firebase: {
      provider: "Firebase",
      issuerUrl: "https://securetoken.google.com/<project-id>",
      discoveryUrl:
        "https://securetoken.google.com/<project-id>/.well-known/openid-configuration",
      jwksUrl:
        "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
      supportedAlgorithms: ["RS256"],
      capabilities: {
        authentication: true,
        userManagement: true,
        identity: true,
        authorization: false,
      },
      outputs: { user: true, tokens: true, claims: true },
    },
    supabase: {
      provider: "Supabase",
      issuerUrl: "https://<project-ref>.supabase.co/auth/v1",
      discoveryUrl:
        "https://<project-ref>.supabase.co/auth/v1/.well-known/openid-configuration",
      jwksUrl:
        "https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json",
      supportedAlgorithms: ["RS256"],
      capabilities: {
        authentication: true,
        userManagement: true,
        identity: true,
        authorization: true,
      },
      outputs: { user: true, tokens: true, claims: true },
    },
    entraid: {
      provider: "Azure Entra ID",
      issuerUrl: "https://login.microsoftonline.com/<tenant-id>/v2.0",
      discoveryUrl:
        "https://login.microsoftonline.com/<tenant-id>/v2.0/.well-known/openid-configuration",
      jwksUrl:
        "https://login.microsoftonline.com/<tenant-id>/discovery/v2.0/keys",
      supportedAlgorithms: ["RS256"],
      capabilities: {
        authentication: true,
        userManagement: true,
        identity: true,
        authorization: true,
      },
      outputs: { user: true, tokens: true, claims: true },
    },
    better_auth: {
      provider: "Better Auth",
      issuerUrl: "http://localhost:3000/api/auth",
      discoveryUrl:
        "http://localhost:3000/api/auth/.well-known/openid-configuration",
      jwksUrl: "http://localhost:3000/api/auth/jwks",
      supportedAlgorithms: ["EdDSA", "RS256", "ES256"],
      capabilities: {
        authentication: true,
        userManagement: true,
        identity: true,
        authorization: true,
      },
      outputs: { user: true, tokens: true, claims: true },
    },
    oidc: {
      provider: "OpenID Connect",
      issuerUrl: "https://<domain>",
      discoveryUrl: "https://<domain>/.well-known/openid-configuration",
      jwksUrl: "https://<domain>/.well-known/jwks.json",
      supportedAlgorithms: ["RS256"],
      capabilities: {
        authentication: true,
        userManagement: false,
        identity: false,
        authorization: false,
      },
      outputs: { user: true, tokens: true, claims: true },
    },
    custom: {
      provider: "Custom JWT",
      issuerUrl: "",
      discoveryUrl: "",
      jwksUrl: "",
      supportedAlgorithms: ["RS256"],
      capabilities: {
        authentication: false,
        userManagement: false,
        identity: false,
        authorization: false,
      },
      outputs: { user: false, tokens: false, claims: false },
    },
  } as const;

export type GatewayRoute = {
  id: string;
  name: string;
  method?: string;
  service?: string;
  authRuleId?: string;
};

export type AuthRule =
  | {
      type: "jwt";
      id: string;
      name: string;
      description?: string;
      config: { providerId?: string; algorithms?: string[] };
    }
  | {
      type: "oauth2";
      id: string;
      name: string;
      description?: string;
      config: { providerId?: string; algorithms?: string[] };
    }
  | {
      type: "apiKey";
      id: string;
      name: string;
      description?: string;
      config: { headerName?: string };
    }
  | {
      type: "mtls";
      id: string;
      name: string;
      description?: string;
      config: { clientCa?: string };
    }
  | {
      type: "basic";
      id: string;
      name: string;
      description?: string;
      config?: Record<string, never>;
    }
  | {
      type: "none";
      id: string;
      name: string;
      description?: string;
      config?: Record<string, never>;
    };

// ---- Access Conditions & Rules ----
export type ConditionPrimitive =
  | { type: "auth"; op: "signedIn" | "signedOut" }
  | { type: "org"; op: "required" | "notRequired" }
  | { type: "orgRole"; op: "in" | "notIn"; values: string[] }
  | { type: "access"; op: "granted" | "notGranted" }
  | {
      type: "subscriptionStatus";
      op: "statusIn" | "statusNotIn";
      values: ("active" | "trialing" | "past_due" | "canceled" | "expired")[];
    }
  | { type: "plan"; op: "in" | "notIn"; values: string[] }
  | {
      type: "customClaim";
      key: string;
      op: "eq" | "neq" | "truthy" | "falsy";
      value?: string | number | boolean;
    };

export type ConditionNode =
  | { kind: "group"; op: "AND" | "OR" | "NOT"; children: ConditionNode[] }
  | { kind: "leaf"; condition: ConditionPrimitive };

export type FailureReason =
  | "no-auth"
  | "no-org"
  | "wrong-role"
  | "no-access"
  | "wrong-plan"
  | "custom-denied";

export type RedirectMap = Partial<Record<FailureReason, string>> & {
  default: string;
};

export interface ProtectionRule {
  id: string;
  scope: "zone" | "page";
  conditions: ConditionNode;
  redirects: RedirectMap;
  customLogic?: { mode: "naturalLanguage" | "code"; prompt?: string; code?: string };
}

// ---- Protected Zone / Section (User-Managed Child Entity of WebAppNode) ----
export interface WebAppZone {
  id: string;
  name: string;
  handleId: string;
  accessType: "public" | "protected";
  rule: ProtectionRule;
}

// ---- Session Claims ----
export interface SessionClaims {
  userId: string;
  orgId?: string;
  orgRole?: string;
  hasAccess?: boolean;
  accessExpiresAt?: string;
  subscriptionStatus?:
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "expired"
    | "none";
  planId?: string;
  inGracePeriod?: boolean;
  custom?: Record<string, string | number | boolean>;
}

export interface OAuthProviderConfig {
  id: string;
  provider: "google" | "github" | "discord" | "apple" | string;
  clientIdEnv: string;
  clientSecretEnv: string;
}

export interface SessionClaimConfig {
  key: string;
  source: "orgRole" | "paymentsAccess" | "customField";
  deliveryMode: "jwt" | "cookie";
}

export interface UserCustomField {
  name: string;
  type: string;
  default?: string;
  required: boolean;
}

export interface AuthHookConfig {
  mode: "naturalLanguage" | "code";
  prompt?: string;
  code?: string;
}

export interface PaymentsPlanConfig {
  id: string;
  name: string;
  price: string;
  interval: "monthly" | "yearly";
}

export interface AuthOrganizationConfig {
  enabled?: boolean;
  roles?: string[];
  teams?: boolean;
  multiOrg?: boolean;
  invitations?: boolean;
  schemaId?: string;
  entityId?: string;
  additionalTables?: AdditionalAuthTableConfig[];
}

export interface AdditionalAuthTableConfig {
  id: string;
  entityId: string;
  purpose?: "session" | "account" | "verification" | "rateLimit" | "custom" | string;
}



