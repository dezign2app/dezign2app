import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import {
  assertWorkflowAccess,
  decryptSecret,
  encryptSecret,
  requireIdentity,
} from "./_utils";

export const getWorkflowSecretByNameForExecution = query({
  args: {
    workflowId: v.id("workflows"),
    secretName: v.string(),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);
    const secretName = args.secretName.trim();

    if (!secretName) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Secret name is required",
      });
    }

    const secret = await ctx.db
      .query("workflow_secrets")
      .withIndex("by_organization_name", (q) =>
        q.eq("organizationId", workflow.organizationId).eq("name", secretName),
      )
      .first();

    if (!secret) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: `Workflow secret "${secretName}" was not found`,
      });
    }

    const decryptedValue = await decryptSecret(secret.encryptedValue);

    return {
      _id: secret._id,
      name: secret.name,
      provider: secret.provider,
      value: decryptedValue,
    };
  },
});

export const getWorkflowSecretByIdForExecution = query({
  args: {
    workflowId: v.id("workflows"),
    secretId: v.id("workflow_secrets"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    await assertWorkflowAccess(ctx, args.workflowId, identity);

    const secret = await ctx.db.get(args.secretId);

    if (!secret) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: `Workflow secret with ID "${args.secretId}" was not found`,
      });
    }

    const decryptedValue = await decryptSecret(secret.encryptedValue);

    return {
      _id: secret._id,
      name: secret.name,
      provider: secret.provider,
      value: decryptedValue,
    };
  },
});

export const listWorkflowSecrets = query({
  args: {
    workflowId: v.id("workflows"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);

    const secrets = await ctx.db
      .query("workflow_secrets")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", workflow.organizationId),
      )
      .collect();

    return secrets.map((s) => ({
      _id: s._id,
      name: s.name,
      provider: s.provider,
      description: s.description,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastUsedAt: s.lastUsedAt,
    }));
  },
});

export const upsertWorkflowSecret = mutation({
  args: {
    workflowId: v.id("workflows"),
    name: v.string(),
    value: v.optional(v.string()),
    secretId: v.optional(v.id("workflow_secrets")),
    provider: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    const workflow = await assertWorkflowAccess(ctx, args.workflowId, identity);
    const name = args.name.trim();

    if (!name) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Secret name is required",
      });
    }

    const encryptedValue = args.value ? await encryptSecret(args.value) : undefined;
    const now = Date.now();

    if (args.secretId) {
      const existing = await ctx.db.get(args.secretId);

      if (!existing) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Secret not found",
        });
      }

      await ctx.db.patch(existing._id, {
        name,
        ...(encryptedValue ? { encryptedValue } : {}),
        provider: args.provider,
        description: args.description,
        updatedAt: now,
      });
      return existing._id;
    }

    if (!args.value) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Secret value is required for new secrets",
      });
    }

    const existingByName = await ctx.db
      .query("workflow_secrets")
      .withIndex("by_organization_name", (q) =>
        q.eq("organizationId", workflow.organizationId).eq("name", name),
      )
      .first();

    if (existingByName) {
      await ctx.db.patch(existingByName._id, {
        encryptedValue: await encryptSecret(args.value),
        provider: args.provider,
        description: args.description,
        updatedAt: now,
      });
      return existingByName._id;
    } else {
      return await ctx.db.insert("workflow_secrets", {
        organizationId: workflow.organizationId,
        name,
        provider: args.provider,
        description: args.description,
        encryptedValue: await encryptSecret(args.value),
        createdBy: identity.subject,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const deleteWorkflowSecret = mutation({
  args: {
    workflowId: v.id("workflows"),
    secretId: v.id("workflow_secrets"),
  },
  async handler(ctx, args) {
    const identity = await requireIdentity(ctx);
    await assertWorkflowAccess(ctx, args.workflowId, identity);

    const secret = await ctx.db.get(args.secretId);
    if (!secret) return;

    const workflow = await ctx.db.get(args.workflowId);
    if (secret.organizationId !== workflow?.organizationId) {
        throw new ConvexError({ code: "FORBIDDEN", message: "Unauthorized" });
    }

    await ctx.db.delete(args.secretId);
  },
});
