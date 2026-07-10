import { Router, Request, Response } from "express";
import crypto from "crypto";
import { SESSION_CLEANUP_INTERVAL, SESSION_MAX_AGE } from "../config";
import { Session } from "../types";
import { extractAuthToken, resolveAuth } from "../utils/auth";
import { createSession, cleanupOldSessions } from "../utils/session";

export const mcpRouter = Router();

/* =========================
   Global State
========================= */

const sessions = new Map<string, Session>();

/* =========================
   MCP Endpoint
========================= */

mcpRouter.options("/", (_, res) => {
  res.sendStatus(204);
});

mcpRouter.all("/", async (req: Request, res: Response) => {
  try {
    const existingSessionId = req.headers["mcp-session-id"] as string | undefined;
    
    console.log(`\n[DEBUG] ${req.method} ${req.originalUrl}`);
    
    const authToken = extractAuthToken(req);

    // Detect if this is an initialize request
    const isInitialize = req.method === "POST" && req.body?.method === "initialize";

    let sessionId: string;

    if (isInitialize || !existingSessionId) {
      // Resolve auth context
      const authContext = authToken ? await resolveAuth(authToken) : null;

      if (!authContext) {
        console.warn(`[AUTH] Refusing session initialization: No valid auth token provided`);
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      // Create a fresh session for initialize requests
      sessionId = crypto.randomUUID();
      console.log(
        `\n[REQUEST] ${req.method} /mcp | New session=${sessionId} | Auth: user=${authContext.userId}`,
      );

      const session = await createSession(sessionId, authContext);
      sessions.set(sessionId, session);

      res.setHeader("mcp-session-id", sessionId);

      if (req.method === "GET") {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        await session.transport.handleRequest(req, res);
      } else {
        await session.transport.handleRequest(req, res, req.body);
      }
    } else {

      sessionId = existingSessionId;
      const session = sessions.get(sessionId);

      if (!session) {
        console.error(`[REQUEST] Session not found: ${sessionId}`);
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Log session details
      console.log(
        `\n[REQUEST] ${req.method} /mcp | session=${sessionId}${session.userId ? ` | user=${session.userId}` : ""}${session.orgId ? ` | org=${session.orgId}` : ""}`,
      );

      // Check for token updates
      if (authToken) {
        const auth = await resolveAuth(authToken);
        if (auth && (!session.userId || session.userId !== auth.userId)) {
           console.log(`[AUTH] Updating session ${sessionId} context for user ${auth.userId}`);
           session.userId = auth.userId;
           session.orgId = auth.orgId;
           session.keyId = auth.keyId;
           session.clerkToken = auth.token;
        }
      }

      res.setHeader("mcp-session-id", sessionId);
      if (req.method === "GET") {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        await session.transport.handleRequest(req, res);
      } else {
        await session.transport.handleRequest(req, res, req.body);
      }
    }

    console.log(`[RESPONSE] Done for session=${sessionId}`);
  } catch (err) {
    console.error("[ERROR]", err);
    res.status(500).json({ error: "Internal MCP server error" });
  }
});

/* =========================
   Session Cleanup
========================= */

setInterval(() => {
  cleanupOldSessions(sessions, SESSION_MAX_AGE);
}, SESSION_CLEANUP_INTERVAL);
