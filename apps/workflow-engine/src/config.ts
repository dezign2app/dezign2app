export const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;


export const CONVEX_URL =
  process.env.CONVEX_URL || "https://scintillating-corgi-821.convex.cloud";

export const CLERK_JWT_ISSUER =
  process.env.CLERK_JWT_ISSUER_DOMAIN ||
  "https://heroic-egret-15.clerk.accounts.dev";

export const CORS_ALLOWED_ORIGINS = new Set([
  "http://localhost:6274",
  "http://127.0.0.1:6274",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://ai-figma-web.vercel.app",
  "*"
]);

export const SESSION_CLEANUP_INTERVAL = 1000 * 60 * 10; // 10 minutes
export const SESSION_MAX_AGE = 1000 * 60 * 30; // 30 minutes
