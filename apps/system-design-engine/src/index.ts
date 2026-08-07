import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import { createGraph } from "./ai/agent";
import { formatToolCallLog, formatCanvasState } from "./ai/utils";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ConvexHttpClient } from "convex/browser";
import { extractAuthToken, resolveAuth } from "./mcp/auth";
import { createSession, cleanupOldSessions, Session } from "./mcp/session";

import {
  TestCaseItem,
  BackendNodeItem,
  JSONValue,
  JSONObject,
} from "@workspace/canvas";

const STRIPPED_KEYS = new Set<string>([
  "id",
  "nodeId",
  "targetNodeId",
  "brokerNodeId",
  "messagingResourceId",
  "sourceResourceId",
  "targetResourceId",
  "parentId",
  "tableRef",
  "position",
  "graphPosition",
  "fractionalIndex",
]);

function stripIds(value: JSONValue): JSONValue {
  if (Array.isArray(value)) return value.map(stripIds);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as JSONObject)
        .filter(([k]) => !STRIPPED_KEYS.has(k))
        .map(([k, v]) => [k, stripIds(v)]),
    );
  }
  return value;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("System Design Engine is running!");
});

app.post("/canvas-ai", async (req, res) => {
  try {
    const body = req.body;
    const {
      projectId,
      chatId,
      convexUrl: bodyConvexUrl,
      token,
      viewportCenter,
    } = body;

    if (!chatId || !projectId) {
      res.status(400).send("Missing required fields");
      return;
    }

    const convexUrl = bodyConvexUrl || process.env.CONVEX_URL;
    if (!convexUrl) {
      res.status(500).send("Missing CONVEX_URL environment variable");
      return;
    }

    const client = new ConvexHttpClient(convexUrl);
    if (
      token &&
      typeof token === "string" &&
      token.includes(".") &&
      !token.startsWith("sk_")
    ) {
      client.setAuth(token);
    }

    const messages = await client.query(api.project_chat.getMessages, {
      chatId,
    });

    const agent = createGraph();

    const existingRequirements = await client.query(api.requirements.get, {
      projectId,
    });
    const existingPlan = await client.query(api.requirements.getPlan, {
      projectId,
    });

    // Fetch canvas state directly from backend
    const elements = await client.query(api.canvas.getBackendElements, {
      projectId,
    });
    const backendCanvasState = formatCanvasState(elements);

    // Prepare initial state
    const formattedMessages = messages.map((m) =>
      m.role === "assistant"
        ? new AIMessage(m.content)
        : new HumanMessage(m.content),
    );

    const graphStream = await agent.streamEvents(
      {
        messages: formattedMessages,
        projectId,
        convexUrl,
        token,
        viewportCenter,
        canvasStateContext: backendCanvasState,
        requirements: existingRequirements ?? {
          functional: [],
          nonFunctional: [],
          assumptions: [],
          status: "pending",
        },
        implementationPlan: existingPlan ?? { content: "", status: "none" },
      },
      { version: "v2" },
    );

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const event of graphStream) {
      if (event.event === "on_chat_model_stream") {
        const nodeName = event.metadata?.langgraph_node;
        if (
          nodeName &&
          ![
            "chatAgent",
            "canvasAgent",
            "reflectAgent",
            "requirementsAgent",
            "planAgent",
          ].includes(nodeName)
        ) {
          continue;
        }

        const chunk = event.data.chunk;
        if (chunk.content) {
          res.write(
            JSON.stringify({ type: "text", content: chunk.content }) + "\n",
          );
        }
        if (chunk.tool_calls && chunk.tool_calls.length > 0) {
          for (const call of chunk.tool_calls) {
            const name = call.name;
            const message = formatToolCallLog(name, call.args);
            res.write(
              JSON.stringify({ type: "tool_call", name, message }) + "\n",
            );
          }
        }
      }
    }
    res.end();
  } catch (error: any) {
    console.error("API error:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .send(`Internal Server Error: ${error?.message || "Unknown error"}`);
    } else {
      res.write(
        JSON.stringify({ type: "error", message: "Internal Server Error" }) +
          "\n",
      );
    }
  }
});

import { generateCacheConfig } from "./ai/cache-generator";
import { generateBusinessLogicCode } from "./ai/code-generator";

app.post("/generate-cache-config", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      res.status(400).json({ error: "Missing description" });
      return;
    }
    const config = await generateCacheConfig(description);
    res.json(config);
  } catch (error) {
    console.error("Generate cache config error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/generate-code", async (req, res) => {
  try {
    const code = await generateBusinessLogicCode(req.body);
    res.json({ code });
  } catch (error: any) {
    console.error("Generate code error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate business logic code" });
  }
});

// MCP Endpoints
const sessions = new Map<string, Session>();
const SESSION_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours
const SESSION_CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour

setInterval(() => {
  cleanupOldSessions(sessions, SESSION_MAX_AGE);
}, SESSION_CLEANUP_INTERVAL);

app.options("/mcp", (req, res) => {
  res.sendStatus(204);
});

app.all("/mcp", async (req, res) => {
  try {
    const existingSessionId = req.headers["mcp-session-id"] as
      | string
      | undefined;

    console.log(`\n[DEBUG] ${req.method} /mcp`);

    const authToken = extractAuthToken(req);

    // Detect if this is an initialize request
    const isInitialize =
      req.method === "POST" && req.body?.method === "initialize";

    let sessionId: string;

    if (isInitialize || !existingSessionId) {
      // Resolve auth context (optional for local testing)
      const authContext = authToken ? await resolveAuth(authToken) : null;

      if (!authContext) {
        console.warn(
          `[AUTH] Warning: No valid auth token provided. Allowing unauthenticated session for local testing.`,
        );
      }

      // Create a fresh session for initialize requests
      sessionId = crypto.randomUUID();
      console.log(
        `\n[REQUEST] ${req.method} /mcp | New session=${sessionId} | Auth: user=${authContext?.userId || "anonymous"}`,
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

      console.log(
        `\n[REQUEST] ${req.method} /mcp | session=${sessionId}${session.userId ? ` | user=${session.userId}` : ""}`,
      );

      // Check for token updates
      if (authToken) {
        const auth = await resolveAuth(authToken);
        if (auth && (!session.userId || session.userId !== auth.userId)) {
          console.log(
            `[AUTH] Updating session ${sessionId} context for user ${auth.userId}`,
          );
          session.userId = auth.userId;
          session.orgId = auth.orgId;
          session.keyId = auth.keyId;
          session.projectId = auth.projectId;
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

const port = 3002;
app.listen(port, () => {
  console.log(`System Design Engine is running on port ${port} (Express)`);
});
