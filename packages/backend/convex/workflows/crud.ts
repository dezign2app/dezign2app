import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { MutationCtx, mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

import {
  DEFAULT_START_NODE_KEY,
  DEFAULT_END_NODE_KEY,
  assertWorkflowAccess,
  requireIdentity,
  getIdentityOrganizationId,
  validateDraftGraph,
  workflowNodeInputValidator,
  workflowEdgeInputValidator,
} from "./_utils";

export const listByOrganization = query({
  args: { paginationOpts: paginationOptsValidator },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const organizationId = getIdentityOrganizationId(identity);

    return await ctx.db
      .query("workflows")
      .withIndex("by_organization_archived", (q) =>
        q.eq("organizationId", organizationId).eq("isArchived", undefined),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createWorkflow = mutation({
  args: {
    name: v.string(),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const name = args.name.trim();

    if (!name) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Workflow name is required",
      });
    }

    const now = Date.now();
    const organizationId = getIdentityOrganizationId(identity);

    const workflowId = await ctx.db.insert("workflows", {
      name,
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
      organizationId,
      nextVersionNumber: 1,
    });

    const draftVersionId = await ctx.db.insert("workflow_versions", {
      workflowId,
      versionNumber: 0,
      kind: "draft",
      createdBy: identity.subject,
      createdAt: now,
      updatedAt: now,
      compileStatus: "invalid",
      compileErrors: ["Workflow draft is not configured yet."],
    });

    await ctx.db.patch(workflowId, {
      draftVersionId,
    });

    await Promise.all([
      ctx.db.insert("workflow_nodes", {
        versionId: draftVersionId,
        nodeKey: DEFAULT_START_NODE_KEY,
        type: "start",
        label: "Start",
        positionX: 140,
        positionY: 220,
        config: {
          triggerType: "manual",
          cronExpression: "",
          timezone: "UTC",
        },
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("workflow_nodes", {
        versionId: draftVersionId,
        nodeKey: DEFAULT_END_NODE_KEY,
        type: "end",
        label: "End",
        positionX: 520,
        positionY: 220,
        config: {
          resultExpression: "",
        },
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("workflow_edges", {
        versionId: draftVersionId,
        edgeKey: "start-to-end",
        sourceNodeKey: DEFAULT_START_NODE_KEY,
        sourceHandle: "out",
        targetNodeKey: DEFAULT_END_NODE_KEY,
        targetHandle: "in",
        kind: "default",
        label: "Default path",
        createdAt: now,
        updatedAt: now,
      }),
    ]);

    return workflowId;
  },
});

export const getWorkflowById = query({
  args: {
    workflowId: v.id("workflows"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    const [draftVersion, publishedVersion, activeVersion] = await Promise.all([
      workflow.draftVersionId ? ctx.db.get(workflow.draftVersionId) : null,
      workflow.publishedVersionId
        ? ctx.db.get(workflow.publishedVersionId)
        : null,
      workflow.activeVersionId ? ctx.db.get(workflow.activeVersionId) : null,
    ]);

    return {
      workflow,
      draftVersion,
      publishedVersion,
      activeVersion,
    };
  },
});

export const getWorkflowEditorData = query({
  args: {
    workflowId: v.id("workflows"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    if (!workflow.draftVersionId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workflow draft not found",
      });
    }

    const [draftVersion, publishedVersion, activeVersion, nodes, edges] =
      await Promise.all([
        ctx.db.get(workflow.draftVersionId),
        workflow.publishedVersionId
          ? ctx.db.get(workflow.publishedVersionId)
          : null,
        workflow.activeVersionId ? ctx.db.get(workflow.activeVersionId) : null,
        ctx.db
          .query("workflow_nodes")
          .withIndex("by_version", (q) =>
            q.eq("versionId", workflow.draftVersionId!),
          )
          .collect(),
        ctx.db
          .query("workflow_edges")
          .withIndex("by_version", (q) =>
            q.eq("versionId", workflow.draftVersionId!),
          )
          .collect(),
      ]);

    return {
      workflow,
      draftVersion,
      publishedVersion,
      activeVersion,
      nodes: nodes.sort((left, right) =>
        left.nodeKey.localeCompare(right.nodeKey),
      ),
      edges: edges.sort((left, right) =>
        left.edgeKey.localeCompare(right.edgeKey),
      ),
    };
  },
});

export const renameWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    name: v.string(),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);
    const name = args.name.trim();

    if (!name) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Workflow name is required",
      });
    }

    await ctx.db.patch(workflow._id, {
      name,
      updatedAt: Date.now(),
    });
  },
});

export const saveDraftGraph = mutation({
  args: {
    workflowId: v.id("workflows"),
    nodes: v.array(workflowNodeInputValidator),
    edges: v.array(workflowEdgeInputValidator),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    if (!workflow.draftVersionId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workflow draft not found",
      });
    }

    const now = Date.now();
    const [currentNodes, currentEdges] = await Promise.all([
      ctx.db
        .query("workflow_nodes")
        .withIndex("by_version", (q) => q.eq("versionId", workflow.draftVersionId!))
        .collect(),
      ctx.db
        .query("workflow_edges")
        .withIndex("by_version", (q) => q.eq("versionId", workflow.draftVersionId!))
        .collect(),
    ]);

    await Promise.all([
      ...currentNodes.map((node) => ctx.db.delete(node._id)),
      ...currentEdges.map((edge) => ctx.db.delete(edge._id)),
    ]);

    await Promise.all([
      ...args.nodes.map((node) =>
        ctx.db.insert("workflow_nodes", {
          versionId: workflow.draftVersionId!,
          nodeKey: node.nodeKey,
          type: node.type,
          label: node.label,
          positionX: node.positionX,
          positionY: node.positionY,
          config: node.config,
          createdAt: now,
          updatedAt: now,
        }),
      ),
      ...args.edges.map((edge) =>
        ctx.db.insert("workflow_edges", {
          versionId: workflow.draftVersionId!,
          edgeKey: edge.edgeKey,
          sourceNodeKey: edge.sourceNodeKey,
          sourceHandle: edge.sourceHandle,
          targetNodeKey: edge.targetNodeKey,
          targetHandle: edge.targetHandle,
          kind: edge.kind,
          label: edge.label,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    ]);

    const compileErrors = validateDraftGraph(args.nodes, args.edges);
    const compileStatus = compileErrors.length === 0 ? "valid" : "invalid";

    await Promise.all([
      ctx.db.patch(workflow.draftVersionId, {
        updatedAt: now,
        compileStatus,
        compileErrors: compileErrors.length > 0 ? compileErrors : undefined,
      }),
      ctx.db.patch(workflow._id, {
        updatedAt: now,
      }),
    ]);

    return {
      compileStatus,
      compileErrors,
      updatedAt: now,
    };
  },
});

export const deleteWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    await ctx.db.patch(workflow._id, {
      isArchived: true,
      updatedAt: Date.now(),
    });
  },
});

// ─── Shared helper: re-validate the draft after a granular mutation ───────────

async function revalidateDraft(
  ctx: MutationCtx,
  workflowId: Id<"workflows">,
  draftVersionId: Id<"workflow_versions">,
): Promise<{ compileStatus: "valid" | "invalid"; compileErrors: string[] }> {
  const [nodes, edges] = await Promise.all([
    ctx.db
      .query("workflow_nodes")
      .withIndex("by_version", (q) => q.eq("versionId", draftVersionId))
      .collect(),
    ctx.db
      .query("workflow_edges")
      .withIndex("by_version", (q) => q.eq("versionId", draftVersionId))
      .collect(),
  ]);

  const nodeInputs = nodes.map((n) => ({
    nodeKey: n.nodeKey,
    type: n.type,
    label: n.label,
    positionX: n.positionX,
    positionY: n.positionY,
    config: n.config,
  }));
  const edgeInputs = edges.map((e) => ({
    edgeKey: e.edgeKey,
    sourceNodeKey: e.sourceNodeKey,
    sourceHandle: e.sourceHandle,
    targetNodeKey: e.targetNodeKey,
    targetHandle: e.targetHandle,
    kind: e.kind as "default" | "true" | "false",
    label: e.label,
  }));

  const compileErrors = validateDraftGraph(nodeInputs, edgeInputs);
  const compileStatus = compileErrors.length === 0 ? "valid" : "invalid";
  const now = Date.now();

  await Promise.all([
    ctx.db.patch(draftVersionId, {
      updatedAt: now,
      compileStatus,
      compileErrors: compileErrors.length > 0 ? compileErrors : undefined,
    }),
    ctx.db.patch(workflowId, { updatedAt: now }),
  ]);

  return { compileStatus, compileErrors };
}

// ─── updateNodeConfig ─────────────────────────────────────────────────────────
// Patches config (and optionally label/type) of a single existing node.
// All other nodes and edges are completely untouched.
// Node positions are preserved.
export const updateNodeConfig = mutation({
  args: {
    workflowId: v.id("workflows"),
    nodeKey: v.string(),
    config: v.optional(v.any()),
    label: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    if (!workflow.draftVersionId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Workflow draft not found" });
    }

    const existing = await ctx.db
      .query("workflow_nodes")
      .withIndex("by_version_node_key", (q) =>
        q.eq("versionId", workflow.draftVersionId!).eq("nodeKey", args.nodeKey),
      )
      .unique();

    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: `Node "${args.nodeKey}" not found in draft` });
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.config !== undefined) patch.config = args.config;
    if (args.label !== undefined) patch.label = args.label;
    if (args.type !== undefined) patch.type = args.type;

    await ctx.db.patch(existing._id, patch);

    return revalidateDraft(ctx, args.workflowId, workflow.draftVersionId);
  },
});

// ─── addNode ─────────────────────────────────────────────────────────────────
// Inserts one new node document into the draft.
export const addNode = mutation({
  args: {
    workflowId: v.id("workflows"),
    nodeKey: v.string(),
    type: v.string(),
    label: v.optional(v.string()),
    positionX: v.float64(),
    positionY: v.float64(),
    config: v.any(),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    if (!workflow.draftVersionId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Workflow draft not found" });
    }

    const now = Date.now();
    await ctx.db.insert("workflow_nodes", {
      versionId: workflow.draftVersionId,
      nodeKey: args.nodeKey,
      type: args.type,
      label: args.label,
      positionX: args.positionX,
      positionY: args.positionY,
      config: args.config,
      createdAt: now,
      updatedAt: now,
    });

    return revalidateDraft(ctx, args.workflowId, workflow.draftVersionId);
  },
});

// ─── removeNode ──────────────────────────────────────────────────────────────
// Deletes a single node document and all edges that reference it.
export const removeNode = mutation({
  args: {
    workflowId: v.id("workflows"),
    nodeKey: v.string(),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    if (!workflow.draftVersionId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Workflow draft not found" });
    }

    const [existing, allEdges] = await Promise.all([
      ctx.db
        .query("workflow_nodes")
        .withIndex("by_version_node_key", (q) =>
          q.eq("versionId", workflow.draftVersionId!).eq("nodeKey", args.nodeKey),
        )
        .unique(),
      ctx.db
        .query("workflow_edges")
        .withIndex("by_version", (q) => q.eq("versionId", workflow.draftVersionId!))
        .collect(),
    ]);

    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: `Node "${args.nodeKey}" not found in draft` });
    }

    const danglingEdges = allEdges.filter(
      (e) => e.sourceNodeKey === args.nodeKey || e.targetNodeKey === args.nodeKey,
    );

    await Promise.all([
      ctx.db.delete(existing._id),
      ...danglingEdges.map((e) => ctx.db.delete(e._id)),
    ]);

    return revalidateDraft(ctx, args.workflowId, workflow.draftVersionId);
  },
});

// ─── upsertEdge ──────────────────────────────────────────────────────────────
// Inserts a new edge or updates an existing one (matched by edgeKey).
export const upsertEdge = mutation({
  args: {
    workflowId: v.id("workflows"),
    edgeKey: v.string(),
    sourceNodeKey: v.string(),
    sourceHandle: v.optional(v.string()),
    targetNodeKey: v.string(),
    targetHandle: v.optional(v.string()),
    kind: v.union(v.literal("default"), v.literal("true"), v.literal("false")),
    label: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    if (!workflow.draftVersionId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Workflow draft not found" });
    }

    const existing = await ctx.db
      .query("workflow_edges")
      .withIndex("by_version_edge_key", (q) =>
        q.eq("versionId", workflow.draftVersionId!).eq("edgeKey", args.edgeKey),
      )
      .unique();

    const now = Date.now();
    const edgeData = {
      sourceNodeKey: args.sourceNodeKey,
      sourceHandle: args.sourceHandle,
      targetNodeKey: args.targetNodeKey,
      targetHandle: args.targetHandle,
      kind: args.kind,
      label: args.label,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, edgeData);
    } else {
      await ctx.db.insert("workflow_edges", {
        versionId: workflow.draftVersionId,
        edgeKey: args.edgeKey,
        ...edgeData,
        createdAt: now,
      });
    }

    return revalidateDraft(ctx, args.workflowId, workflow.draftVersionId);
  },
});

// ─── removeEdge ──────────────────────────────────────────────────────────────
// Deletes a single edge document by its edgeKey.
export const removeEdge = mutation({
  args: {
    workflowId: v.id("workflows"),
    edgeKey: v.string(),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    if (!workflow.draftVersionId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Workflow draft not found" });
    }

    const existing = await ctx.db
      .query("workflow_edges")
      .withIndex("by_version_edge_key", (q) =>
        q.eq("versionId", workflow.draftVersionId!).eq("edgeKey", args.edgeKey),
      )
      .unique();

    if (!existing) {
      throw new ConvexError({ code: "NOT_FOUND", message: `Edge "${args.edgeKey}" not found in draft` });
    }

    await ctx.db.delete(existing._id);

    return revalidateDraft(ctx, args.workflowId, workflow.draftVersionId);
  },
});
