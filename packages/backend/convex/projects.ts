import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { Doc } from "./_generated/dataModel";

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    organizationId: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      organizationId: identity.org_id?.toString(),
      createdBy: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

export const getProjectsByOrganization = query({
  args: { paginationOpts: paginationOptsValidator },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", identity.org_id?.toString()),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    // Check ownership or organization access
    // TODO: Add organization member check when implemented
    const hasOrgAccess = true;
    if (!hasOrgAccess) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Not authorized to access this file",
      });
    }

    return projects;
  },
});

export const getProjectById = query({
  args: { projectId: v.id("projects") },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Project not found",
      });
    }

    const response = {...project}

    // TODO: Add organization member check when implemented
    const hasOrgAccess = true;

    if (!hasOrgAccess) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Not authorized to access this file",
      });
    }

    return response;
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new ConvexError("Project not found");
    }

    if (project.createdBy !== identity.subject) {
      throw new ConvexError("Unauthorized");
    }

    const patches: Partial<Doc<"projects">> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) patches.name = args.name;
    if (args.description !== undefined) patches.description = args.description;

    await ctx.db.patch(args.projectId, patches);
  },
});

export const removeProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new ConvexError("Project not found");
    }

    if (project.createdBy !== identity.subject) {
      throw new ConvexError("Unauthorized");
    }
    await ctx.db.delete(args.projectId);
  },
});

export const duplicateProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new ConvexError("Project not found");
    }

    if (project.createdBy !== identity.subject) {
      throw new ConvexError("Unauthorized");
    }

    const { _id, _creationTime, ...projectRest } = project;
    const newProjectId = await ctx.db.insert("projects", {
      ...projectRest,
      name: `${projectRest.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return newProjectId;
  },
});

