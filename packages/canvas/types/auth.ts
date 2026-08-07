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
