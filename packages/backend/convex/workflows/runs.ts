import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
  assertWorkflowAccess,
  assertWorkflowRunAccess,
  getNextRunEventSequence,
  requireIdentity,
} from "./_utils";

export const startManualRun = mutation({
  args: {
    workflowId: v.id("workflows"),
    input: v.optional(v.any()),
    systemToken: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx, args.systemToken);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    if (!workflow.draftVersionId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workflow draft not found",
      });
    }

    const draftVersion = await ctx.db.get(workflow.draftVersionId);

    if (!draftVersion) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workflow draft version not found",
      });
    }

    if (draftVersion.compileStatus !== "valid") {
      throw new ConvexError({
        code: "INVALID_WORKFLOW",
        message: "Workflow draft has compile errors",
        compileErrors: draftVersion.compileErrors ?? [
          "Workflow draft is not valid for execution.",
        ],
      });
    }

    const now = Date.now();
    const runId = await ctx.db.insert("workflow_runs", {
      workflowId: workflow._id,
      versionId: draftVersion._id,
      organizationId: workflow.organizationId,
      triggerType: "manual",
      status: "queued",
      input: args.input,
      startedAt: now,
      initiatedBy: identity.subject,
    });

    await ctx.db.insert("workflow_run_events", {
      runId,
      seq: 0,
      type: "run_queued",
      level: "info",
      payload: {
        message: "Workflow run queued.",
        triggerType: "manual",
      },
      createdAt: now,
    });

    return {
      runId,
      versionId: draftVersion._id,
      triggerType: "manual" as const,
      realtimeChannel: `workflow:realtime:${runId}`,
      streamKey: `workflow:stream:${runId}`,
    };
  },
});

export const getRunExecutionContext = query({
  args: {
    runId: v.id("workflow_runs"),
    systemToken: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx, args.systemToken);
    const { run, workflow } = await assertWorkflowRunAccess(
      ctx,
      args.runId,
      identity,
    );
    const version = await ctx.db.get(run.versionId);

    if (!version) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workflow version not found",
      });
    }

    const [nodes, edges] = await Promise.all([
      ctx.db
        .query("workflow_nodes")
        .withIndex("by_version", (q) => q.eq("versionId", run.versionId))
        .collect(),
      ctx.db
        .query("workflow_edges")
        .withIndex("by_version", (q) => q.eq("versionId", run.versionId))
        .collect(),
    ]);

    return {
      workflow,
      run,
      version,
      nodes: nodes.sort((left, right) =>
        left.nodeKey.localeCompare(right.nodeKey),
      ),
      edges: edges.sort((left, right) =>
        left.edgeKey.localeCompare(right.edgeKey),
      ),
    };
  },
});

export const markRunStarted = mutation({
  args: {
    runId: v.id("workflow_runs"),
    systemToken: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx, args.systemToken);
    const { run } = await assertWorkflowRunAccess(ctx, args.runId, identity);
    const now = Date.now();
    const nextSeq = await getNextRunEventSequence(ctx, run._id);

    await Promise.all([
      ctx.db.patch(run._id, {
        status: "running",
        startedAt: now,
      }),
      ctx.db.insert("workflow_run_events", {
        runId: run._id,
        seq: nextSeq,
        type: "run_started",
        level: "info",
        payload: {
          message: "Workflow run started.",
        },
        createdAt: now,
      }),
    ]);

    return {
      status: "running" as const,
      seq: nextSeq,
      createdAt: now,
    };
  },
});

export const appendRunEvent = mutation({
  args: {
    runId: v.id("workflow_runs"),
    type: v.string(),
    level: v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warn"),
      v.literal("error"),
    ),
    nodeKey: v.optional(v.string()),
    payload: v.optional(v.any()),
    systemToken: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx, args.systemToken);
    const { run } = await assertWorkflowRunAccess(ctx, args.runId, identity);
    const nextSeq = await getNextRunEventSequence(ctx, run._id);
    const createdAt = Date.now();

    const eventId = await ctx.db.insert("workflow_run_events", {
      runId: run._id,
      seq: nextSeq,
      type: args.type,
      nodeKey: args.nodeKey,
      level: args.level,
      payload: args.payload,
      createdAt,
    });

    return {
      eventId,
      seq: nextSeq,
      createdAt,
    };
  },
});

export const markRunCompleted = mutation({
  args: {
    runId: v.id("workflow_runs"),
    output: v.optional(v.any()),
    systemToken: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx, args.systemToken);
    const { run } = await assertWorkflowRunAccess(ctx, args.runId, identity);
    const now = Date.now();
    const nextSeq = await getNextRunEventSequence(ctx, run._id);

    await Promise.all([
      ctx.db.patch(run._id, {
        status: "completed",
        output: args.output,
        endedAt: now,
        error: undefined,
      }),
      ctx.db.insert("workflow_run_events", {
        runId: run._id,
        seq: nextSeq,
        type: "run_completed",
        level: "info",
        payload: {
          message: "Workflow run completed.",
          output: args.output,
        },
        createdAt: now,
      }),
    ]);

    return {
      status: "completed" as const,
      seq: nextSeq,
      createdAt: now,
    };
  },
});

export const markRunFailed = mutation({
  args: {
    runId: v.id("workflow_runs"),
    error: v.any(),
    nodeKey: v.optional(v.string()),
    systemToken: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx, args.systemToken);
    const { run } = await assertWorkflowRunAccess(ctx, args.runId, identity);
    const now = Date.now();
    const nextSeq = await getNextRunEventSequence(ctx, run._id);

    await Promise.all([
      ctx.db.patch(run._id, {
        status: "failed",
        error: args.error,
        endedAt: now,
      }),
      ctx.db.insert("workflow_run_events", {
        runId: run._id,
        seq: nextSeq,
        type: "run_failed",
        nodeKey: args.nodeKey,
        level: "error",
        payload: {
          message: "Workflow run failed.",
          error: args.error,
        },
        createdAt: now,
      }),
    ]);

    return {
      status: "failed" as const,
      seq: nextSeq,
      createdAt: now,
    };
  },
});

export const listRecentRuns = query({
  args: {
    workflowId: v.id("workflows"),
    limit: v.optional(v.number()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    await assertWorkflowAccess(ctx, args.workflowId, identity);

    return await ctx.db
      .query("workflow_runs")
      .withIndex("by_workflow_started_at", (q) =>
        q.eq("workflowId", args.workflowId),
      )
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const listRunEvents = query({
  args: {
    runId: v.id("workflow_runs"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const { run } = await assertWorkflowRunAccess(ctx, args.runId, identity);

    return await ctx.db
      .query("workflow_run_events")
      .withIndex("by_run_seq", (q) => q.eq("runId", run._id))
      .order("asc")
      .collect();
  },
});
