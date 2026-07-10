import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { port, CORS_ALLOWED_ORIGINS } from "./config";
import { routes } from "./routes";
import { redis, realtime } from "./lib/redis";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Options } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

const app = express();
app.set('trust proxy', 1);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, CORS_ALLOWED_ORIGINS.has(origin));
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "mcp-session-id",
      "mcp-protocol-version",
      "Accept",
      "Cache-Control",
    ],
    exposedHeaders: ["mcp-session-id"],
  }),
);

app.use(express.json());

// Track sequence numbers per stream to allow client-side de-duplication
const streamIndices = new Map<string, number>();

app.use((req: Request, res: Response, next: NextFunction) => {
  const streamId = req.body?.conversationId;
  const isSsePost = req.method === "POST" && streamId;

  if (!isSsePost) {
    return next();
  }

  const streamKey = `agent:stream:${streamId}`;
  const realtimeChannel = `agent:realtime:${streamId}`;
  
  // Reset or initialize index for new stream
  streamIndices.set(streamId, 0);

  const processLine = (line: string) => {
    try {
      const payload = JSON.parse(line);
      
      // ← KEY FIX: Already indexed means it came from Redis via pipeRedisToSSE
      // Don't re-store it or you'll get duplicates
      if (typeof payload._idx === "number") {
        realtime.channel(realtimeChannel).emit("message", line).catch(() => {});
        return;
      }

      const idx = streamIndices.get(streamId) ?? 0;
      streamIndices.set(streamId, idx + 1);

      payload._idx = idx;
      const indexedLine = JSON.stringify(payload);

      redis.rpush(streamKey, indexedLine).catch(console.error);
      redis.expire(streamKey, 60 * 60).catch(() => {});
      realtime.channel(realtimeChannel).emit("message", indexedLine).catch(() => {});
    } catch {
      redis.rpush(streamKey, line).catch(() => {});
      realtime.channel(realtimeChannel).emit("message", line).catch(() => {});
    }
  };

  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function (this: Response, chunk: any, ...args: any[]) {
    const str = typeof chunk === "string" ? chunk : chunk instanceof Uint8Array ? new TextDecoder().decode(chunk) : String(chunk);
    if (str) {
      str.split("\n").forEach((line: string) => {
        if (line.trim()) {
          processLine(line.trim());
        }
      });
    }
    return originalWrite.apply(res, [chunk, ...args] as Parameters<typeof originalWrite>);
  };

  res.end = function (this: Response, chunk?: any, ...args: any[]) {
    if (chunk && typeof chunk !== "function") {
      const str = typeof chunk === "string" ? chunk : chunk instanceof Uint8Array ? new TextDecoder().decode(chunk) : String(chunk);
      if (str && str.trim()) {
        str.split("\n").forEach((line: string) => {
          if (line.trim()) {
            processLine(line.trim());
          }
        });
      }
    }
    return originalEnd.apply(res, [chunk, ...args] as Parameters<typeof originalEnd>);
  };

  next();
});

// ─── Rate Limiters ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 120,              // 120 req / min per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  handler: (req: Request, res: Response, _next: NextFunction, options: Options) => {
    console.warn(`[rate-limit] global – blocked ${req.ip} on ${req.method} ${req.url}`);
    res.status(options.statusCode).json(options.message);
  },
});

const agentLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 60,               // 60 req / min per IP (AI calls are expensive)
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "AI agent rate limit exceeded. Please slow down." },
  handler: async (req: Request, res: Response, _next: NextFunction, options: Options) => {
    console.warn(`[rate-limit] agent - blocked ${req.ip} on ${req.method} ${req.url}`);
    
    // Attempt to persist the rate limit error to Convex if we have context
    const { conversationId, sessionToken } = req.body || {};
    const errorMessage = (options.message as { error?: string }).error || "AI agent rate limit exceeded.";

    if (conversationId && sessionToken) {
      try {
        const { getConvexClient } = await import("./ai-agent/convex-client");
        const { api } = await import("@workspace/backend/_generated/api");
        const client = getConvexClient(sessionToken);
        await client.mutation(api.ai.messages.insertMessage, {
          conversationId: conversationId as Id<"conversations">,
          content: `⚠️ ${errorMessage} Please try again later.`,
          role: "AI",
        });
        console.log("✅ Rate limit error persisted to Convex.");
      } catch (err: unknown) {
        console.error("❌ Failed to persist rate limit error to Convex:", err);
      }
    }

    res.status(options.statusCode).json(options.message);
  },
});

app.use(globalLimiter);

/* =========================
   Routes
========================= */
app.use("/", agentLimiter, routes);

/* =========================
   Start Server
========================= */
app.listen(port, () => {
  console.log(`🚀 AI Agent server running at http://localhost:${port}`);
});
