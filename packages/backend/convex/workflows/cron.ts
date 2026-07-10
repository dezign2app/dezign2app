import { v } from "convex/values";
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { CronExpressionParser } from "cron-parser";

/**
 * Calculates the next execution time for a cron expression
 * and schedules the next tick.
 */
export const scheduleNextTick = internalAction({
  args: {
    workflowId: v.id("workflows"),
    cronExpression: v.string(),
    timezone: v.optional(v.string()),
    baseTime: v.optional(v.number()),
  },
  async handler(ctx, args) {
    try {
      const options = {
        currentDate: args.baseTime ? new Date(args.baseTime) : new Date(),
        tz: args.timezone || "UTC",
      };

      const interval = CronExpressionParser.parse(args.cronExpression, options);
      const nextRunTime = interval.next().getTime();

      // Schedule the next mutation tick
      const scheduledJobId = await ctx.scheduler.runAt(nextRunTime, internal.workflows.cron.tickCron, {
        workflowId: args.workflowId,
      });

      // Update the workflow with the new scheduled job ID
      await ctx.runMutation(internal.workflows.cron.updateScheduledJobId, {
        workflowId: args.workflowId,
        scheduledJobId: scheduledJobId as string,
      });
    } catch (error) {
      console.error(`[Cron Scheduler] Failed to parse expression "${args.cronExpression}":`, error);
    }
  },
});

/**
 * The mutation that actually triggers the workflow run
 * and initiates the calculation for the next run.
 */
export const tickCron = internalMutation({
  args: {
    workflowId: v.id("workflows"),
  },
  async handler(ctx, args) {
    const workflow = await ctx.db.get(args.workflowId);

    // Self-termination: Stop if workflow is gone, archived, or unpublished
    if (!workflow || workflow.isArchived || !workflow.publishedVersionId || !workflow.activeVersionId) {
      console.log(`[Cron Scheduler] Terminating cycle for workflow ${args.workflowId} (inactive or archived)`);
      return;
    }

    const version = await ctx.db.get(workflow.publishedVersionId);
    if (!version) return;

    // Find the start node to get the cron expression
    const startNode = await ctx.db
      .query("workflow_nodes")
      .withIndex("by_version", (q) => q.eq("versionId", version._id))
      .filter((q) => q.eq(q.field("type"), "start"))
      .first();

    if (!startNode || startNode.config?.triggerType !== "cron" || !startNode.config?.cronExpression) {
      console.warn(`[Cron Scheduler] Stopping cycle for workflow ${args.workflowId} (no cron config found)`);
      return;
    }

    const now = Date.now();

    // 1. Create the workflow run in "queued" state
    const runId = await ctx.db.insert("workflow_runs", {
      workflowId: workflow._id,
      versionId: version._id,
      organizationId: workflow.organizationId,
      triggerType: "cron",
      status: "queued",
      startedAt: now,
      initiatedBy: "system",
    });

    await ctx.db.insert("workflow_run_events", {
      runId,
      seq: 0,
      type: "run_queued",
      level: "info",
      payload: {
        message: "Workflow run queued via automated cron schedule.",
        cronExpression: startNode.config.cronExpression,
      },
      createdAt: now,
    });

    // 2. Schedule the action to trigger the external engine for execution
    await ctx.scheduler.runAfter(0, internal.workflows.cron.triggerEngine, {
      runId,
    });

    // 3. Schedule the NEXT tick for recursion
    // We use an Action for scheduling because it can handle the timezone parsing library
    await ctx.scheduler.runAfter(0, internal.workflows.cron.scheduleNextTick, {
      workflowId: args.workflowId,
      cronExpression: startNode.config.cronExpression,
      timezone: startNode.config.timezone,
      baseTime: now,
    });
  },
});

/**
 * Triggers the workflow-engine's internal enqueue endpoint
 */
export const triggerEngine = internalAction({
  args: {
    runId: v.id("workflow_runs"),
  },
  async handler(ctx, args) {
    const engineUrl = process.env.WORKFLOW_ENGINE_BASE_URL;
    if (!engineUrl) {
      console.warn("[Cron Scheduler] WORKFLOW_ENGINE_BASE_URL not set. Run will stay in queue.");
      return;
    }

    try {
      const response = await fetch(`${engineUrl}/workflows/internal/enqueue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: args.runId,
          systemToken: process.env.SYSTEM_CORE_SECRET,
        }),
      });

      if (!response.ok) {
        throw new Error(`Engine returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`[Cron Scheduler] Failed to trigger engine for run ${args.runId}:`, error);
    }
  },
});

/**
 * Updates the workflow with the current scheduled job ID
 */
export const updateScheduledJobId = internalMutation({
  args: {
    workflowId: v.id("workflows"),
    scheduledJobId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) return;

    await ctx.db.patch(args.workflowId, {
      scheduledJobId: args.scheduledJobId,
    });
  },
});
