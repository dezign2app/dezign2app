import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const handleCheckoutCompleted = mutation({
  args: { 
    data: v.any(), 
    secret: v.string() 
  },
  handler: async (ctx, { data, secret }) => {

    const customerEmail = data.customer?.email;
    let userId;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", customerEmail))
      .first();
    if (user) userId = user._id;

    if (!userId) {
      console.error(`User not found for checkout: ${customerEmail}`);
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(userId, { creemCustomerId: data.customer?.id });

    if (data.subscription) {
      const productId = typeof data.subscription.product === 'string' ? data.subscription.product : data.subscription.product?.id;

      const existingSub = await ctx.db
        .query("subscriptions")
        .withIndex("by_creem_sub_id", (q) => q.eq("creemSubscriptionId", data.subscription.id))
        .unique();

      if (existingSub) {
        await ctx.db.patch(existingSub._id, {
          planId: productId,
          status: data.subscription.status,
        });
      } else {
        await ctx.db.insert("subscriptions", {
          userId,
          planId: productId,
          status: data.subscription.status,
          currentPeriodStart: Date.now(),
          currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, 
          creemSubscriptionId: data.subscription.id,
        });
      }
    }
    return { success: true };
  },
});

export const handleSubscriptionEvent = mutation({
  args: { 
    type: v.string(),
    data: v.any(), 
    secret: v.string() 
  },
  handler: async (ctx, { type, data, secret }) => {
    if (secret !== process.env.CREEM_SUBSCRIPTION_WEBHOOK_SECRET) throw new Error("Unauthorized webhook call");

    const customerId = data.customer?.id;
    const user = await ctx.db
      .query("users")
      .withIndex("by_creem_customer", (q) => q.eq("creemCustomerId", customerId))
      .unique();


    if (!user) {
      console.error(`User not found for creemCustomerId: ${customerId}`);
      return { success: false, error: "User not found" };
    }

    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_creem_sub_id", (q) => q.eq("creemSubscriptionId", data.id))
      .unique();
    
    let newStatus = data.status;
    if (type === "subscription.canceled") newStatus = "canceled";

    if (existingSub) {
      await ctx.db.patch(existingSub._id, {
        status: newStatus,
      });
    } else {
      const productId = typeof data.product === 'string' ? data.product : data.product?.id;

      await ctx.db.insert("subscriptions", {
        userId: user._id,
        planId: productId,
        status: newStatus,
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
        creemSubscriptionId: data.id,
      });
    }
    return { success: true };
  },
});

export const handleSubscriptionExpired = mutation({
  args: { 
    data: v.any(), 
    secret: v.string() 
  },
  handler: async (ctx, { data, secret }) => {
    if (secret !== process.env.CREEM_SUBSCRIPTION_WEBHOOK_SECRET) throw new Error("Unauthorized webhook call");

    const customerId = data.customer?.id;
    const user = await ctx.db
      .query("users")
      .withIndex("by_creem_customer", (q) => q.eq("creemCustomerId", customerId))
      .unique();

    if (!user) {
      console.error(`User not found for creemCustomerId: ${customerId}`);
      return { success: false, error: "User not found" };
    }

    const existingSub = await ctx.db
      .query("subscriptions")
      .withIndex("by_creem_sub_id", (q) => q.eq("creemSubscriptionId", data.id))
      .unique();

    if (existingSub) {
      await ctx.db.patch(existingSub._id, {
        status: "expired",
      });
    } else {
      const productId = typeof data.product === 'string' ? data.product : data.product?.id;

      await ctx.db.insert("subscriptions", {
        userId: user._id,
        planId: productId,
        status: "expired",
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now(),
        creemSubscriptionId: data.id,
      });
    }
    return { success: true };
  },
});

