import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    // Handle Early Believer checkout metadata
    if (data.metadata?.type === "early_believer" || data.metadata?.tier) {
      const tier: 500 | 1000 = Number(data.metadata.tier) === 1000 ? 1000 : 500;
      const seats = Math.max(1, Number(data.metadata.seats) || Number(data.units) || 1);
      const discountPercent = tier === 1000 ? 10 : 5;
      const totalPaid = tier * seats;

      const subscriptionMonths = tier === 1000 ? 12 : 6;
      const investmentPerSeat = tier === 1000 ? 900 : 450;
      const investmentAmount = investmentPerSeat * seats;

      const periodDays = tier === 1000 ? 365 : 182;
      const now = Date.now();
      const periodEnd = now + periodDays * 24 * 60 * 60 * 1000;

      await ctx.db.insert("early_believers", {
        userId,
        tier,
        seats,
        discountPercent,
        investmentAmount,
        subscriptionMonths,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        totalPaid,
        status: "active",
        creemCheckoutId: data.id,
        creemCustomerId: data.customer?.id,
        purchasedAt: now,
      });

      // Grant/extend user's active subscription in Convex DB
      const existingSub = await ctx.db
        .query("subscriptions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (existingSub) {
        const newEnd = Math.max(existingSub.currentPeriodEnd, periodEnd);
        await ctx.db.patch(existingSub._id, {
          status: "active",
          planId: `early_believer_${tier}`,
          currentPeriodStart: now,
          currentPeriodEnd: newEnd,
        });
      } else {
        await ctx.db.insert("subscriptions", {
          userId,
          planId: `early_believer_${tier}`,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          creemSubscriptionId: `eb_${data.id || now}`,
        });
      }
    }

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

export const getUserEarlyBeliever = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) return null;

    const ebPurchases = await ctx.db
      .query("early_believers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (ebPurchases.length === 0) return null;

    const totalSeats = ebPurchases.reduce((acc, item) => acc + item.seats, 0);
    const maxDiscountPercent = Math.max(...ebPurchases.map((item) => item.discountPercent));
    const totalPaid = ebPurchases.reduce((acc, item) => acc + item.totalPaid, 0);
    const totalInvestment = ebPurchases.reduce((acc, item) => acc + (item.investmentAmount || (item.tier === 1000 ? 900 : 450) * item.seats), 0);
    const maxSubscriptionEnd = Math.max(...ebPurchases.map((item) => item.currentPeriodEnd || (item.purchasedAt + (item.tier === 1000 ? 365 : 182) * 24 * 60 * 60 * 1000)));

    return {
      purchases: ebPurchases,
      totalSeats,
      discountPercent: maxDiscountPercent,
      totalPaid,
      totalInvestment,
      maxSubscriptionEnd,
    };
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

