import { ConvexHttpClient } from "convex/browser";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { redis, realtime } from "../lib/redis";
import { WORKFLOW_STREAM_TTL_SECONDS } from "./constants";
import { WorkflowRuntimeEvent } from "./types";
import { getStreamKey, getRealtimeChannel, redactSensitiveValue, toErrorPayload } from "./utils";

export const publishRealtimeEvent = async (
  runId: Id<"workflow_runs">,
  event: WorkflowRuntimeEvent & {
    seq: number;
    createdAt: number;
  },
) => {
  const serializedEvent = JSON.stringify({
    runId,
    ...event,
  });

  await Promise.all([
    redis.rpush(getStreamKey(runId), serializedEvent),
    redis.expire(getStreamKey(runId), WORKFLOW_STREAM_TTL_SECONDS),
    realtime
      .channel(getRealtimeChannel(runId))
      .emit("message", serializedEvent)
      .catch(() => {}),
  ]);
};

export const appendWorkflowEvent = async (
  client: ConvexHttpClient,
  runId: Id<"workflow_runs">,
  event: WorkflowRuntimeEvent,
  systemToken?: string,
) => {
  const result = await client.mutation(api.workflows.runs.appendRunEvent, {
    runId,
    type: event.type,
    level: event.level,
    nodeKey: event.nodeKey,
    payload: event.payload,
    systemToken,
  });

  await publishRealtimeEvent(runId, {
    ...event,
    seq: result.seq,
    createdAt: result.createdAt,
  });
};

export const markWorkflowRunStarted = async (
  client: ConvexHttpClient,
  runId: Id<"workflow_runs">,
  systemToken?: string,
) => {
  const result = await client.mutation(api.workflows.runs.markRunStarted, {
    runId,
    systemToken,
  });

  await publishRealtimeEvent(runId, {
    type: "run_started",
    level: "info",
    payload: {
      message: "Workflow run started.",
    },
    seq: result.seq,
    createdAt: result.createdAt,
  });
};

export const markWorkflowRunCompleted = async (
  client: ConvexHttpClient,
  runId: Id<"workflow_runs">,
  output: unknown,
  systemToken?: string,
) => {
  const result = await client.mutation(api.workflows.runs.markRunCompleted, {
    runId,
    output,
    systemToken,
  });

  await publishRealtimeEvent(runId, {
    type: "run_completed",
    level: "info",
    payload: {
      message: "Workflow run completed.",
      output: redactSensitiveValue(output),
    },
    seq: result.seq,
    createdAt: result.createdAt,
  });
};

export const markWorkflowRunFailed = async (
  client: ConvexHttpClient,
  runId: Id<"workflow_runs">,
  error: unknown,
  nodeKey?: string,
  systemToken?: string,
) => {
  const errorPayload = toErrorPayload(error);
  const result = await client.mutation(api.workflows.runs.markRunFailed, {
    runId,
    nodeKey,
    error: errorPayload,
    systemToken,
  });

  await publishRealtimeEvent(runId, {
    type: "run_failed",
    level: "error",
    nodeKey,
    payload: {
      message: "Workflow run failed.",
      error: errorPayload,
    },
    seq: result.seq,
    createdAt: result.createdAt,
  });
};
