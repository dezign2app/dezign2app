import { v, ConvexError } from "convex/values";
import { mutation, query } from "../_generated/server";

export const getFrontendRecords = query({
  args: { projectId: v.id("projects") },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const rows = await ctx.db
      .query("canvas_frontend_records")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Return only live records (not soft-deleted)
    return rows.filter((r) => !r.isDeleted).map((r) => r.record);
  },
});

export const syncFrontendRecords = mutation({
  args: {
    projectId: v.id("projects"),
    put: v.array(v.any()), // records to upsert (added + updated)
    remove: v.array(v.string()), // recordIds to soft-delete
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Upsert each record
    for (const record of args.put) {
      const recordId: string = record.id;
      const existing = await ctx.db
        .query("canvas_frontend_records")
        .withIndex("by_project_record", (q) =>
          q.eq("projectId", args.projectId).eq("recordId", recordId),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { record, isDeleted: false });
      } else {
        await ctx.db.insert("canvas_frontend_records", {
          projectId: args.projectId,
          recordId,
          typeName: record.typeName ?? "unknown",
          record,
          isDeleted: false,
        });
      }
    }

    // Soft-delete removed records
    for (const recordId of args.remove) {
      const existing = await ctx.db
        .query("canvas_frontend_records")
        .withIndex("by_project_record", (q) =>
          q.eq("projectId", args.projectId).eq("recordId", recordId),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { isDeleted: true });
      }
    }
  },
});
