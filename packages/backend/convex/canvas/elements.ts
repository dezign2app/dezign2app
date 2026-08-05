import { v } from "convex/values";
import { query } from "../_generated/server";

export const getBackendElements = query({
  args: { projectId: v.id("projects") },
  async handler(ctx, args) {
    const nodes = await ctx.db
      .query("canvas_backend_nodes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const edges = await ctx.db
      .query("canvas_backend_edges")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const endpoints = await ctx.db
      .query("canvas_backend_endpoints")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const events = await ctx.db
      .query("canvas_backend_events")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const testCases = await ctx.db
      .query("canvas_backend_test_cases")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const identityProviders = await ctx.db
      .query("canvas_backend_identity_providers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Sort by fractionalIndex for correct ordering
    nodes.sort((a, b) => (a.fractionalIndex < b.fractionalIndex ? -1 : 1));
    edges.sort((a, b) => (a.fractionalIndex < b.fractionalIndex ? -1 : 1));

    return {
      nodes,
      edges,
      endpoints: endpoints.map((e) => ({
        ...e.data,
        nodeId: e.nodeId,
        id: e.endpointId,
      })),
      events: events.map((e) => ({
        ...e.data,
        nodeId: e.nodeId,
        variant: e.variant,
        id: e.eventId,
      })),
      testCases: testCases.map((t) => ({ ...t.data, id: t.testCaseId })),
      identityProviders: identityProviders.map((p) => ({
        ...p.data,
        nodeId: p.nodeId,
        id: p.providerId,
      })),
    };
  },
});
