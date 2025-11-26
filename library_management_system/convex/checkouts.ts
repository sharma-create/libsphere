import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's active checkouts
export const getUserCheckouts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const checkouts = await ctx.db
      .query("checkouts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("status"), "returned"))
      .collect();

    return Promise.all(
      checkouts.map(async (checkout) => {
        const book = await ctx.db.get(checkout.bookId);
        return {
          ...checkout,
          book,
        };
      })
    );
  },
});

// Get all checkouts (employee only)
export const getAllCheckouts = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("returned"), v.literal("overdue"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "employee") {
      throw new Error("Only employees can view all checkouts");
    }

    let checkoutsQuery;
    
    if (args.status) {
      checkoutsQuery = ctx.db.query("checkouts").withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      checkoutsQuery = ctx.db.query("checkouts");
    }

    const checkouts = await checkoutsQuery.collect();

    return Promise.all(
      checkouts.map(async (checkout) => {
        const book = await ctx.db.get(checkout.bookId);
        const user = await ctx.db.get(checkout.userId);
        const userProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", checkout.userId))
          .unique();

        return {
          ...checkout,
          book,
          user: {
            email: user?.email,
            name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "Unknown",
          },
        };
      })
    );
  },
});

// Checkout book
export const checkoutBook = mutation({
  args: {
    bookId: v.id("books"),
    userId: v.optional(v.id("users")), // For employee checkout on behalf of customer
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const targetUserId = args.userId || currentUserId;
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");

    if (book.availableCopies <= 0) {
      throw new Error("No copies available");
    }

    // Check if user already has this book checked out
    const existingCheckout = await ctx.db
      .query("checkouts")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .filter((q) => 
        q.and(
          q.eq(q.field("bookId"), args.bookId),
          q.neq(q.field("status"), "returned")
        )
      )
      .first();

    if (existingCheckout) {
      throw new Error("You already have this book checked out");
    }

    const dueDate = Date.now() + (14 * 24 * 60 * 60 * 1000); // 14 days from now

    // Create checkout record
    await ctx.db.insert("checkouts", {
      bookId: args.bookId,
      userId: targetUserId,
      checkoutDate: Date.now(),
      dueDate,
      status: "active",
      renewalCount: 0,
      checkedOutBy: args.userId ? currentUserId : undefined,
    });

    // Update book availability
    await ctx.db.patch(args.bookId, {
      availableCopies: book.availableCopies - 1,
    });

    // Cancel any reservations for this book by this user
    const reservation = await ctx.db
      .query("reservations")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .filter((q) => 
        q.and(
          q.eq(q.field("bookId"), args.bookId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();

    if (reservation) {
      await ctx.db.patch(reservation._id, { status: "fulfilled" });
    }
  },
});

// Return book
export const returnBook = mutation({
  args: {
    checkoutId: v.id("checkouts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const checkout = await ctx.db.get(args.checkoutId);
    if (!checkout) throw new Error("Checkout not found");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    // Only the user who checked out the book or an employee can return it
    if (checkout.userId !== userId && (!userProfile || userProfile.role !== "employee")) {
      throw new Error("Not authorized to return this book");
    }

    if (checkout.status === "returned") {
      throw new Error("Book already returned");
    }

    const book = await ctx.db.get(checkout.bookId);
    if (!book) throw new Error("Book not found");

    // Update checkout record
    await ctx.db.patch(args.checkoutId, {
      returnDate: Date.now(),
      status: "returned",
    });

    // Update book availability
    await ctx.db.patch(checkout.bookId, {
      availableCopies: book.availableCopies + 1,
    });

    // Check if book was overdue and create fine if necessary
    if (Date.now() > checkout.dueDate) {
      const daysOverdue = Math.ceil((Date.now() - checkout.dueDate) / (24 * 60 * 60 * 1000));
      const fineAmount = daysOverdue * 0.50; // $0.50 per day

      await ctx.db.insert("fines", {
        userId: checkout.userId,
        checkoutId: args.checkoutId,
        amount: fineAmount,
        reason: `Late return - ${daysOverdue} days overdue`,
        dateIssued: Date.now(),
        status: "pending",
      });
    }
  },
});

// Renew book
export const renewBook = mutation({
  args: {
    checkoutId: v.id("checkouts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const checkout = await ctx.db.get(args.checkoutId);
    if (!checkout) throw new Error("Checkout not found");

    if (checkout.userId !== userId) {
      throw new Error("Not authorized to renew this book");
    }

    if (checkout.status !== "active") {
      throw new Error("Cannot renew returned book");
    }

    if (checkout.renewalCount >= 2) {
      throw new Error("Maximum renewals reached");
    }

    // Check if there are reservations for this book
    const reservation = await ctx.db
      .query("reservations")
      .withIndex("by_book", (q) => q.eq("bookId", checkout.bookId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (reservation) {
      throw new Error("Cannot renew - book is reserved by another user");
    }

    const newDueDate = checkout.dueDate + (14 * 24 * 60 * 60 * 1000); // Add 14 more days

    await ctx.db.patch(args.checkoutId, {
      dueDate: newDueDate,
      renewalCount: checkout.renewalCount + 1,
    });
  },
});
