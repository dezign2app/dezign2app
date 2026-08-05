import { v, ConvexError } from "convex/values";
import { mutation } from "../_generated/server";
import {
  backendEndpointDataValidator,
  backendIdentityProviderDataValidator,
  backendEventDataValidator,
} from "../schema/canvasValidators";

export const upsertBackendEndpoint = mutation({
  args: {
    projectId: v.id("projects"),
    nodeId: v.string(),
    endpointId: v.string(),
    data: backendEndpointDataValidator,
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    console.log(
      "upsertBackendEndpoint called with:",
      args.endpointId,
      "businessLogic:",
      (args.data as any).businessLogic,
    );

    const existing = await ctx.db
      .query("canvas_backend_endpoints")
      .withIndex("by_node_endpoint", (q) =>
        q.eq("nodeId", args.nodeId).eq("endpointId", args.endpointId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data as any });
    } else {
      await ctx.db.insert("canvas_backend_endpoints", {
        projectId: args.projectId,
        nodeId: args.nodeId,
        endpointId: args.endpointId,
        data: args.data,
      });
    }
  },
});

export const removeBackendEndpoint = mutation({
  args: {
    projectId: v.id("projects"),
    nodeId: v.string(),
    endpointId: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("canvas_backend_endpoints")
      .withIndex("by_node_endpoint", (q) =>
        q.eq("nodeId", args.nodeId).eq("endpointId", args.endpointId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const upsertBackendIdentityProvider = mutation({
  args: {
    projectId: v.id("projects"),
    nodeId: v.string(),
    providerId: v.string(),
    data: backendIdentityProviderDataValidator,
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("canvas_backend_identity_providers")
      .withIndex("by_node_provider", (q) =>
        q.eq("nodeId", args.nodeId).eq("providerId", args.providerId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data as any });
    } else {
      await ctx.db.insert("canvas_backend_identity_providers", {
        projectId: args.projectId,
        nodeId: args.nodeId,
        providerId: args.providerId,
        data: args.data,
      });
    }
  },
});

export const removeBackendIdentityProvider = mutation({
  args: {
    projectId: v.id("projects"),
    nodeId: v.string(),
    providerId: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("canvas_backend_identity_providers")
      .withIndex("by_node_provider", (q) =>
        q.eq("nodeId", args.nodeId).eq("providerId", args.providerId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const upsertBackendEvent = mutation({
  args: {
    projectId: v.id("projects"),
    nodeId: v.string(),
    eventId: v.string(),
    variant: v.union(v.literal("publish"), v.literal("consume")),
    data: backendEventDataValidator,
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("canvas_backend_events")
      .withIndex("by_node_event", (q) =>
        q.eq("nodeId", args.nodeId).eq("eventId", args.eventId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        variant: args.variant,
        data: args.data as any,
      });
    } else {
      await ctx.db.insert("canvas_backend_events", {
        projectId: args.projectId,
        nodeId: args.nodeId,
        eventId: args.eventId,
        variant: args.variant,
        data: args.data,
      });
    }
  },
});

export const removeBackendEvent = mutation({
  args: {
    projectId: v.id("projects"),
    nodeId: v.string(),
    eventId: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("canvas_backend_events")
      .withIndex("by_node_event", (q) =>
        q.eq("nodeId", args.nodeId).eq("eventId", args.eventId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
