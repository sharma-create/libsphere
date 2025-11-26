import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's fines
export const getUserFines = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const fines = await ctx.db
      .query("fines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return Promise.all(
      fines.map(async (fine) => {
        const checkout = await ctx.db.get(fine.checkoutId);
        const book = checkout ? await ctx.db.get(checkout.bookId) : null;
        return {
          ...fine,
          book,
        };
      })
    );
  },
});

// Get all fines (employee only)
export const getAllFines = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("paid"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "employee") {
      throw new Error("Only employees can view all fines");
    }

    let finesQuery;
    
    if (args.status) {
      finesQuery = ctx.db.query("fines").withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      finesQuery = ctx.db.query("fines");
    }

    const fines = await finesQuery.collect();

    return Promise.all(
      fines.map(async (fine) => {
        const user = await ctx.db.get(fine.userId);
        const userProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", fine.userId))
          .unique();
        const checkout = await ctx.db.get(fine.checkoutId);
        const book = checkout ? await ctx.db.get(checkout.bookId) : null;

        return {
          ...fine,
          user: {
            email: user?.email,
            name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "Unknown",
          },
          book,
        };
      })
    );
  },
});

// Pay fine (employee only)
export const payFine = mutation({
  args: {
    fineId: v.id("fines"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "employee") {
      throw new Error("Only employees can process fine payments");
    }

    const fine = await ctx.db.get(args.fineId);
    if (!fine) throw new Error("Fine not found");

    if (fine.status === "paid") {
      throw new Error("Fine already paid");
    }

    await ctx.db.patch(args.fineId, {
      status: "paid",
      datePaid: Date.now(),
    });
  },
});
