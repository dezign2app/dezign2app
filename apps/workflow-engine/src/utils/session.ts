import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Session, AuthContext } from "../types";
import { registerTools } from "../mcp/tools-registry";

export async function createSession(
  sessionId: string,
  auth?: AuthContext | null,
): Promise<Session> {
  console.log(
    `[SESSION] Creating new session: ${sessionId}${auth ? ` for user ${auth.userId}` : ""}`,
  );

  const server = new McpServer({
    name: "Infractx MCP",
    version: "1.0.0",
  });

  // Register all tools for this server instance
  await registerTools(server, auth?.userId, auth?.token);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => sessionId,
  });

  await server.connect(transport);

  return {
    server,
    transport,
    createdAt: Date.now(),
    userId: auth?.userId,
    orgId: auth?.orgId,
    keyId: auth?.keyId,
    clerkToken: auth?.token,
  };
}

export function cleanupOldSessions(
  sessions: Map<string, Session>,
  maxAge: number,
): void {
  const now = Date.now();

  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > maxAge) {
      console.log(`[CLEANUP] Removing session: ${id}`);
      sessions.delete(id);
    }
  }
}
