import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const startConversation = mutation({
  args: {
    organizationId: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }
    const conversationId = await ctx.db.insert("conversations", {
      userId: identity.subject,
      title: args.title ?? "New Conversation",
      organizationId: args.organizationId ?? "personal",
    });
    return conversationId;
  },
});

export const listConversations = query({
  args: {
    orgId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }
    
    // As per user request, listing all conversations for the user irrespective of org
    // But allowing optional filtering if needed in future
    let q = ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject));

    // If we wanted to filter by org, we would do it here or use a different index
    // For now, returning all user conversations as requested
    
    const conversations = await q.order("desc").collect();
    
    return conversations;
  },
});

export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }
    await ctx.db.patch(args.conversationId, { title: args.title });
  },
});

export const getConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
     const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }
    const conversation = await ctx.db.get(args.conversationId);
    if(!conversation){
        throw new ConvexError({
            code: "NOT_FOUND",
            message: "Conversation not found",
        });
    }

    if(conversation.userId !== identity.subject){
        throw new ConvexError({
            code: "UNAUTHORIZED",
            message: "User not authorized to access this conversation",
        });
    }

    return conversation;
  }
});

export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      });
    }

    if (conversation.userId !== identity.subject) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "User not authorized to access this conversation",
      });
    }

    // Delete all messages belonging to this conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    await Promise.all(messages.map((msg) => ctx.db.delete(msg._id)));

    await ctx.db.delete(args.conversationId);
  },
});
