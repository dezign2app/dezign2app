import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export interface ClerkPayload {
  sub: string;
  email?: string;
  [key: string]: any;
}

export interface AuthContext {
  userId: string;
  token: string;
  orgId?: string;
  keyId?: string;
}

export type Session = {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  createdAt: number;
  userId?: string;
  orgId?: string;
  keyId?: string;
  clerkToken?: string; // Kept for backward compatibility if needed
};
