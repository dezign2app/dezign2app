import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const getSubscriptionStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { status: "unauthenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return { status: "user_not_found" };
    }

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // If no subscriptions found at all, user is "new" to payments
    if (subscriptions.length === 0) {
      return { status: "no_subscription", hasPriorSubscription: false };
    }

    // Find if there is any active subscription
    const activeSub = subscriptions.find((sub) => sub.status === "active" || sub.status === "trialing");

    if (activeSub) {
      return {
        status: "active",
        hasPriorSubscription: true,
        creemSubscriptionId: activeSub.creemSubscriptionId,
        planId: activeSub.planId,
      };
    }

    // If subscriptions exist but none are active, they are an "existing" user with a lapsed sub
    return {
      status: "inactive",
      hasPriorSubscription: true,
    };
  },
});

export const syncClerkUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      if (!existingUser.clerkId) {
        await ctx.db.patch(existingUser._id, {
          clerkId: args.clerkId,
        });
      }
      return existingUser._id;
    }

    const newUserId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      clerkId: args.clerkId,
      passwordHash: "", // Not used with Clerk authentication
      createdAt: Date.now(),
    });

    return newUserId;
  },
});

export const getIsSystemAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    return user?.isSystemAdmin ?? false;
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
  },
});
