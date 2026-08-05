import { v, ConvexError } from "convex/values";
import { mutation } from "../_generated/server";
import {
  isValidConnection,
  isBackendNode,
  RULES_VERSION,
} from "@workspace/canvas";
import { backendEdgeDataValidator } from "../schema/canvasValidators";

export const upsertBackendEdge = mutation({
  args: {
    projectId: v.id("projects"),
    edgeId: v.string(),
    source: v.string(),
    target: v.string(),
    type: v.string(),
    sourceHandle: v.optional(v.string()),
    targetHandle: v.optional(v.string()),
    data: v.optional(backendEdgeDataValidator),
    fractionalIndex: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // --- Edge Validation (Primary Enforcement) ---
    // Look up source & target nodes to get their types
    const sourceNode = await ctx.db
      .query("canvas_backend_nodes")
      .withIndex("by_project_node", (q) =>
        q.eq("projectId", args.projectId).eq("nodeId", args.source),
      )
      .unique();

    const targetNode = await ctx.db
      .query("canvas_backend_nodes")
      .withIndex("by_project_node", (q) =>
        q.eq("projectId", args.projectId).eq("nodeId", args.target),
      )
      .unique();

    if (!sourceNode) {
      throw new ConvexError({
        code: "SOURCE_NODE_NOT_FOUND",
        message: `Source node "${args.source}" not found in project.`,
      });
    }
    if (!targetNode) {
      throw new ConvexError({
        code: "TARGET_NODE_NOT_FOUND",
        message: `Target node "${args.target}" not found in project.`,
      });
    }

    // Fetch existing edges for duplicate detection (exclude current edgeId for upsert case)
    const existingEdges = await ctx.db
      .query("canvas_backend_edges")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const otherEdges = existingEdges
      .filter((e) => e.edgeId !== args.edgeId)
      .map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      }));

    if (!isBackendNode(sourceNode.type) || !isBackendNode(targetNode.type)) {
      throw new ConvexError("Invalid node type");
    }

    const result = isValidConnection(
      sourceNode.type,
      args.sourceHandle,
      targetNode.type,
      args.targetHandle,
      {
        sourceNodeId: args.source,
        targetNodeId: args.target,
        existingEdges: otherEdges,
      },
    );

    if (!result.valid) {
      throw new ConvexError({
        code: result.code,
        message: result.message,
        ...(result.suggestion && { suggestion: result.suggestion }),
      });
    }

    // Use validated edge type — the mutation is authoritative, not the client
    const validatedType = result.edgeType;
    const enrichedData = {
      ...args.data,
      ...(result.resourceKind && { resourceKind: result.resourceKind }),
    };

    const existing = await ctx.db
      .query("canvas_backend_edges")
      .withIndex("by_project_edge", (q) =>
        q.eq("projectId", args.projectId).eq("edgeId", args.edgeId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        source: args.source,
        target: args.target,
        type: validatedType,
        sourceHandle: args.sourceHandle,
        targetHandle: args.targetHandle,
        data: enrichedData as any,
        fractionalIndex: args.fractionalIndex,
        rulesVersion: RULES_VERSION,
      });
    } else {
      await ctx.db.insert("canvas_backend_edges", {
        projectId: args.projectId,
        edgeId: args.edgeId,
        source: args.source,
        target: args.target,
        type: validatedType,
        sourceHandle: args.sourceHandle,
        targetHandle: args.targetHandle,
        data: enrichedData as any,
        fractionalIndex: args.fractionalIndex,
        rulesVersion: RULES_VERSION,
      });
    }
  },
});

export const removeBackendEdge = mutation({
  args: { projectId: v.id("projects"), edgeId: v.string() },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("canvas_backend_edges")
      .withIndex("by_project_edge", (q) =>
        q.eq("projectId", args.projectId).eq("edgeId", args.edgeId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
