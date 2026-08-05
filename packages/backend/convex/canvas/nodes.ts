import { v, ConvexError } from "convex/values";
import { mutation } from "../_generated/server";
import { nodeDataSchemas } from "@workspace/canvas";
import { backendNodeDataValidator } from "../schema/canvasValidators";

export const upsertBackendNode = mutation({
  args: {
    projectId: v.id("projects"),
    nodeId: v.string(),
    type: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
    data: backendNodeDataValidator,
    fractionalIndex: v.string(),
  },
  async handler(ctx, args) {
    const labelToLog =
      "label" in args.data && typeof args.data.label === "string"
        ? args.data.label
        : undefined;
    console.log("upsertBackendNode called with args:", {
      nodeId: args.nodeId,
      type: args.type,
      label: labelToLog,
    });
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const schema = nodeDataSchemas[args.type];
    if (schema) {
      // Validate the data against the strict Zod schema for this node type
      const parsed = schema.safeParse(args.data);
      if (!parsed.success) {
        throw new ConvexError(
          `Invalid data for node type '${args.type}': ${parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")}`,
        );
      }
      args.data = parsed.data;
    }

    if (
      (args.type === "entity" || args.type === "group") &&
      "label" in args.data &&
      typeof args.data.label === "string"
    ) {
      const allNodes = await ctx.db
        .query("canvas_backend_nodes")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();

      const label = args.data.label;
      const exists = allNodes.some(
        (n) =>
          n.nodeId !== args.nodeId &&
          n.type === args.type &&
          "label" in (n.data || {}) &&
          typeof (n.data as Record<string, unknown>).label === "string" &&
          (
            (n.data as Record<string, unknown>).label as string
          ).toLowerCase() === label.toLowerCase(),
      );

      if (exists) {
        const typeName = args.type === "entity" ? "table" : "schema group";
        throw new ConvexError(
          `A ${typeName} with the name "${label}" already exists.`,
        );
      }
    }

    if (
      args.type === "entity" &&
      "columns" in args.data &&
      Array.isArray(args.data.columns)
    ) {
      const seen = new Set<string>();
      for (const col of args.data.columns) {
        if (
          !col ||
          typeof col !== "object" ||
          !("name" in col) ||
          typeof col.name !== "string" ||
          col.name.trim() === ""
        )
          continue;
        const lowerName = col.name.toLowerCase();
        if (seen.has(lowerName)) {
          throw new ConvexError(
            `A column with the name "${col.name}" already exists in this table.`,
          );
        }
        seen.add(lowerName);
      }
    }

    const existing = await ctx.db
      .query("canvas_backend_nodes")
      .withIndex("by_project_node", (q) =>
        q.eq("projectId", args.projectId).eq("nodeId", args.nodeId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        type: args.type,
        position: args.position,
        data: args.data,
        fractionalIndex: args.fractionalIndex,
      });
    } else {
      await ctx.db.insert("canvas_backend_nodes", {
        projectId: args.projectId,
        nodeId: args.nodeId,
        type: args.type,
        position: args.position,
        data: args.data,
        fractionalIndex: args.fractionalIndex,
      });
    }

    // Trigger background sync to System Design Engine
    // TODO: ctx.scheduler.runAfter(0, internal.sync.triggerWebhook, { projectId: args.projectId });
  },
});

export const removeBackendNode = mutation({
  args: { projectId: v.id("projects"), nodeId: v.string() },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("canvas_backend_nodes")
      .withIndex("by_project_node", (q) =>
        q.eq("projectId", args.projectId).eq("nodeId", args.nodeId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Also remove all edges connected to this node
    const connectedEdges = await ctx.db
      .query("canvas_backend_edges")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const edge of connectedEdges) {
      if (edge.source === args.nodeId || edge.target === args.nodeId) {
        await ctx.db.delete(edge._id);
      }
    }
  },
});
