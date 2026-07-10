import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { assertWorkflowAccess, requireIdentity } from "./_utils";

export const publishWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    message: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    if (!workflow.draftVersionId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workflow draft version not found",
      });
    }

    const draftVersion = await ctx.db.get(workflow.draftVersionId);
    if (!draftVersion || draftVersion.compileStatus !== "valid") {
      throw new ConvexError("Cannot publish an invalid workflow draft");
    }

    const draftNodes = await ctx.db
      .query("workflow_nodes")
      .withIndex("by_version", (q) => q.eq("versionId", draftVersion._id))
      .collect();

    const startNode = draftNodes.find((node) => node.type === "start");
    if (!startNode || startNode.config?.triggerType === "manual") {
      throw new ConvexError(
        "Workflows with a Manual trigger cannot be published. Please configure a Webhook or Cron trigger.",
      );
    }

    const now = Date.now();

    if (workflow.publishedVersionId) {
      await ctx.db.patch(workflow.publishedVersionId, {
        kind: "archived",
        updatedAt: now,
      });
    }

    const versionNumber = workflow.nextVersionNumber ?? 1;
    const publishedVersionId = await ctx.db.insert("workflow_versions", {
      workflowId: workflow._id,
      versionNumber,
      kind: "published",
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      sourceVersionId: draftVersion._id,
      compileStatus: "valid",
      message: args.message,
    });

    const [nodes, edges] = await Promise.all([
      ctx.db
        .query("workflow_nodes")
        .withIndex("by_version", (q) => q.eq("versionId", draftVersion._id))
        .collect(),
      ctx.db
        .query("workflow_edges")
        .withIndex("by_version", (q) => q.eq("versionId", draftVersion._id))
        .collect(),
    ]);

    await Promise.all([
      ...nodes.map((n) =>
        ctx.db.insert("workflow_nodes", {
          versionId: publishedVersionId,
          nodeKey: n.nodeKey,
          type: n.type,
          label: n.label,
          positionX: n.positionX,
          positionY: n.positionY,
          config: n.config,
          createdAt: now,
          updatedAt: now,
        }),
      ),
      ...edges.map((e) =>
        ctx.db.insert("workflow_edges", {
          versionId: publishedVersionId,
          edgeKey: e.edgeKey,
          sourceNodeKey: e.sourceNodeKey,
          sourceHandle: e.sourceHandle,
          targetNodeKey: e.targetNodeKey,
          targetHandle: e.targetHandle,
          kind: e.kind,
          label: e.label,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    ]);

    // Handle Cron Trigger Scheduling (Explicit Cancellation)
    if (workflow.scheduledJobId) {
      try {
        await ctx.scheduler.cancel(workflow.scheduledJobId as any);
      } catch (e) {
        // Ignore if already gone
      }
    }

    await ctx.db.patch(workflow._id, {
      publishedVersionId,
      activeVersionId: publishedVersionId,
      nextVersionNumber: versionNumber + 1,
      scheduledJobId: undefined, // Will be updated by the new tick cycle
      updatedAt: now,
    });

    if (startNode?.config?.triggerType === "cron" && startNode?.config?.cronExpression) {
      await ctx.scheduler.runAfter(0, internal.workflows.cron.scheduleNextTick, {
        workflowId: workflow._id,
        cronExpression: startNode.config.cronExpression,
        timezone: startNode.config.timezone,
      });
    }

    return publishedVersionId;
  },
});

export const unpublishWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    const now = Date.now();

    if (workflow.publishedVersionId) {
      await ctx.db.patch(workflow.publishedVersionId, {
        kind: "archived",
        updatedAt: now,
      });
    }

    // Cancel existing schedule if any
    if (workflow.scheduledJobId) {
      try {
        await ctx.scheduler.cancel(workflow.scheduledJobId as any);
      } catch (e) {
        // Ignore errors if the job is already gone
      }
    }

    await ctx.db.patch(workflow._id, {
      publishedVersionId: undefined,
      activeVersionId: undefined,
      scheduledJobId: undefined,
      updatedAt: now,
    });
  },
});

export const restoreWorkflowVersion = mutation({
  args: {
    workflowId: v.id("workflows"),
    versionId: v.id("workflow_versions"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    if (!workflow.draftVersionId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workflow draft version not found",
      });
    }

    const versionToRestore = await ctx.db.get(args.versionId);
    if (!versionToRestore || versionToRestore.workflowId !== workflow._id) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Version not found or mismatch",
      });
    }

    const now = Date.now();

    const [oldNodes, oldEdges] = await Promise.all([
      ctx.db
        .query("workflow_nodes")
        .withIndex("by_version", (q) => q.eq("versionId", workflow.draftVersionId!))
        .collect(),
      ctx.db
        .query("workflow_edges")
        .withIndex("by_version", (q) => q.eq("versionId", workflow.draftVersionId!))
        .collect(),
    ]);

    const [newNodes, newEdges] = await Promise.all([
      ctx.db
        .query("workflow_nodes")
        .withIndex("by_version", (q) => q.eq("versionId", versionToRestore._id))
        .collect(),
      ctx.db
        .query("workflow_edges")
        .withIndex("by_version", (q) => q.eq("versionId", versionToRestore._id))
        .collect(),
    ]);

    await Promise.all([
      ...oldNodes.map((n) => ctx.db.delete(n._id)),
      ...oldEdges.map((e) => ctx.db.delete(e._id)),
    ]);

    await Promise.all([
      ...newNodes.map((n) =>
        ctx.db.insert("workflow_nodes", {
          versionId: workflow.draftVersionId!,
          nodeKey: n.nodeKey,
          type: n.type,
          label: n.label,
          positionX: n.positionX,
          positionY: n.positionY,
          config: n.config,
          createdAt: now,
          updatedAt: now,
        }),
      ),
      ...newEdges.map((e) =>
        ctx.db.insert("workflow_edges", {
          versionId: workflow.draftVersionId!,
          edgeKey: e.edgeKey,
          sourceNodeKey: e.sourceNodeKey,
          sourceHandle: e.sourceHandle,
          targetNodeKey: e.targetNodeKey,
          targetHandle: e.targetHandle,
          kind: e.kind,
          label: e.label,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    ]);

    await ctx.db.patch(workflow.draftVersionId, {
      updatedAt: now,
      compileStatus: versionToRestore.compileStatus,
      compileErrors: versionToRestore.compileErrors,
    });

    await ctx.db.patch(workflow._id, {
      updatedAt: now,
    });

    return {
      compileStatus: versionToRestore.compileStatus,
      compileErrors: versionToRestore.compileErrors,
      updatedAt: now,
    };
  },
});

export const listWorkflowVersions = query({
  args: {
    workflowId: v.id("workflows"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    await assertWorkflowAccess(ctx, args.workflowId, identity);

    const versions = await ctx.db
      .query("workflow_versions")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .order("desc")
      .collect();

    return versions;
  },
});

export const deleteWorkflowVersion = mutation({
  args: {
    workflowId: v.id("workflows"),
    versionId: v.id("workflow_versions"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    const version = await ctx.db.get(args.versionId);
    if (!version) throw new ConvexError("Version not found");

    if (version.workflowId !== workflow._id) throw new ConvexError("Version does not belong to this workflow");

    if (workflow.publishedVersionId === args.versionId) {
      throw new ConvexError(
        "Cannot delete the version that is currently published. Publish a new version or archive this one first.",
      );
    }

    if (workflow.draftVersionId === args.versionId) throw new ConvexError("Cannot delete the draft version");

    if (workflow.activeVersionId === args.versionId) {
      throw new ConvexError(
        "Cannot delete the version that is currently active for execution.",
      );
    }

    const nodes = await ctx.db
      .query("workflow_nodes")
      .withIndex("by_version", (q) => q.eq("versionId", args.versionId))
      .collect();

    const edges = await ctx.db
      .query("workflow_edges")
      .withIndex("by_version", (q) => q.eq("versionId", args.versionId))
      .collect();

    await Promise.all([
      ...(nodes.map((node) => ctx.db.delete(node._id)) || []),
      ...(edges.map((edge) => ctx.db.delete(edge._id)) || []),
      ctx.db.delete(args.versionId),
    ]);

    return { success: true };
  },
});

export const updateVersionMessage = mutation({
  args: {
    workflowId: v.id("workflows"),
    versionId: v.id("workflow_versions"),
    message: v.string(),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    const version = await ctx.db.get(args.versionId);
    if (!version || version.workflowId !== workflow._id) {
      throw new ConvexError("Version not found");
    }

    await ctx.db.patch(args.versionId, {
      message: args.message,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
