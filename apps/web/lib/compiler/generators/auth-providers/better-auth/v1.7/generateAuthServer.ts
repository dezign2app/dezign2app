import { IdentityProvider } from "@workspace/canvas";

export interface BetterAuthServerOptions {
  provider?: IdentityProvider;
  plugins?: string[];
}

export function generateAuthServer(options: BetterAuthServerOptions = {}): string {
  const plugins = options.plugins || ["bearer", "admin", "organization"];

  return `import { betterAuth } from "better-auth";
import { ${plugins.join(", ")} } from "better-auth/plugins";

export const auth = betterAuth({
  database: {
    provider: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
${plugins.map((p) => `    ${p}(),`).join("\n")}
  ],
});
`;
}
