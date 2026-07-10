import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const listTasks = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = identity.subject;

    let tasks;
    if (args.organizationId) {
      tasks = await ctx.db
        .query("kanban_tasks")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect();
    } else {
      tasks = await ctx.db
        .query("kanban_tasks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    }

    return tasks.sort((a, b) => a.position - b.position);
  },
});

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done")),
    organizationId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject ?? args.userId;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the max position to append
    const tasks = await ctx.db
      .query("kanban_tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    const maxPosition = tasks.reduce((max, t) => Math.max(max, t.position), 0);

    const taskId = await ctx.db.insert("kanban_tasks", {
      title: args.title,
      description: args.description,
      status: args.status,
      position: maxPosition + 1024, // Standard spacing for fractional indexing
      userId,
      organizationId: args.organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Schedule embedding generation
    await ctx.scheduler.runAfter(0, internal.kanban.generateTaskEmbedding, {
      taskId,
      title: args.title,
    });

    return taskId;
  },
});

export const generateTaskEmbedding = internalAction({
  args: {
    taskId: v.id("kanban_tasks"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const url = process.env.EMBEDDING_384_MODEL_URL;
    if (!url) {
      console.error("EMBEDDING_384_MODEL_URL not set");
      return;
    }

    try {
      const response = await fetch(url + "/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: args.title }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch embedding: ${response.statusText}`);
      }

      const result = await response.json();
      const embedding = result.embeddings[0] as number[];

      if (!embedding) {
        throw new Error("Could not find embedding in response");
      }

      await ctx.runMutation(internal.kanban.saveTaskEmbedding, {
        taskId: args.taskId,
        title: args.title,
        embedding: embedding,
      });
    } catch (error) {
      console.error("Error generating task embedding:", error);
    }
  },
});

export const saveTaskEmbedding = internalMutation({
  args: {
    taskId: v.id("kanban_tasks"),
    title: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    // Check if task still exists
    const task = await ctx.db.get(args.taskId);
    if (!task) return;

    // Save or update embedding
    const existing = await ctx.db
      .query("embeddings")
      .withIndex("by_task", (q) => q.eq("task_id", args.taskId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        embedding: args.embedding,
        task_title: args.title,
      });
    } else {
      await ctx.db.insert("embeddings", {
        task_id: args.taskId,
        task_title: args.title,
        embedding: args.embedding,
      });
    }
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("kanban_tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    if (args.title) {
      await ctx.scheduler.runAfter(0, internal.kanban.generateTaskEmbedding, {
        taskId: id,
        title: args.title,
      });
    }
  },
});

export const moveTask = mutation({
  args: {
    id: v.id("kanban_tasks"),
    status: v.union(v.literal("todo"), v.literal("in-progress"), v.literal("done")),
    position: v.float64(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      position: args.position,
      updatedAt: Date.now(),
    });
  },
});

export const deleteTask = mutation({
  args: { id: v.id("kanban_tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    
    // Clean up associated embedding
    const existing = await ctx.db
      .query("embeddings")
      .withIndex("by_task", (q) => q.eq("task_id", args.id))
      .unique();
    
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const searchTasks = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<Array<Doc<"kanban_tasks"> & { score: number }>> => {
    const url = process.env.EMBEDDING_384_MODEL_URL;
    if (!url) throw new Error("EMBEDDING_384_MODEL_URL not set");

    const response = await fetch(url + "/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: args.query }),
    });

    if (!response.ok) throw new Error(`Failed to fetch embedding: ${response.statusText}`);

    const result = await response.json();
    const embedding = result.embeddings[0] as number[];

    const results = await ctx.vectorSearch("embeddings", "by_embedding", {
      vector: embedding,
      limit: 16,
    });

    const tasks: Array<Doc<"kanban_tasks"> & { score: number }> = [];
    for (const res of results) {
      const task = await ctx.runQuery(internal.kanban.getTaskFromEmbedding, { 
        embeddingId: res._id 
      });
      if (task) {
        tasks.push({ ...task, score: res._score });
      }
    }

    return tasks;
  },
});

export const getTaskFromEmbedding = internalQuery({
  args: { embeddingId: v.id("embeddings") },
  handler: async (ctx, args): Promise<Doc<"kanban_tasks"> | null> => {
    const embedding = await ctx.db.get(args.embeddingId);
    if (!embedding) return null;
    return await ctx.db.get(embedding.task_id);
  },
});
