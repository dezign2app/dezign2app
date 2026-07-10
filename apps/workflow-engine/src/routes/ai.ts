import { Router, Request, Response } from "express";
import { aiAgentHandler, pipeRedisToSSE } from "../ai-agent/handler";
import { redis } from "../lib/redis";

export const aiRouter = Router();

aiRouter.post("/agent", aiAgentHandler);

aiRouter.post("/sync", async (req: Request, res: Response) => {
  const { conversationId } = req.body;
  const streamId = conversationId;

  if (!streamId) {
    res.status(400).json({ error: "Missing conversationId" });
    return;
  }

  const streamKey = `agent:stream:${streamId}`;

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const pushToStream = (payload: any) => {
    res.write(`${JSON.stringify(payload)}\n`);
  };

  pipeRedisToSSE(streamKey, res, req, pushToStream);
});

aiRouter.post("/history", async (req: Request, res: Response) => {
  const { conversationId } = req.body;
  const streamId = conversationId;

  if (!streamId) {
    res.status(400).json({ error: "Missing conversationId" });
    return;
  }

  const streamKey = `agent:stream:${streamId}`;
  try {
    const items = await redis.lrange(streamKey, 0, -1);
    
    const parsed = items
      .map(item => {
        try {
          return typeof item === "string" ? JSON.parse(item) : item;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Deduplicate by _idx, then sort ascending
    const seen = new Map<number, any>();
    const noIdx: any[] = [];

    for (const item of parsed) {
      if (typeof item._idx === "number") {
        // Keep first occurrence only
        if (!seen.has(item._idx)) {
          seen.set(item._idx, item);
        }
      } else {
        noIdx.push(item);
      }
    }

    const sorted = [
      ...Array.from(seen.entries())
        .sort(([a], [b]) => a - b)
        .map(([, v]) => v),
      ...noIdx, // items without _idx go at end (e.g. done/error sentinels)
    ];

    res.json({ history: sorted });
  } catch (err) {
    console.error("Error fetching stream history:", err);
    res.status(500).json({ error: "Failed to fetch stream history" });
  }
});
