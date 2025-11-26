import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user's reservations
export const getUserReservations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return Promise.all(
      reservations.map(async (reservation) => {
        const book = await ctx.db.get(reservation.bookId);
        return {
          ...reservation,
          book,
        };
      })
    );
  },
});

// Reserve book
export const reserveBook = mutation({
  args: {
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");

    if (book.availableCopies > 0) {
      throw new Error("Book is available - no need to reserve");
    }

    // Check if user already has this book reserved
    const existingReservation = await ctx.db
      .query("reservations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("bookId"), args.bookId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();

    if (existingReservation) {
      throw new Error("You already have this book reserved");
    }

    // Check if user already has this book checked out
    const existingCheckout = await ctx.db
      .query("checkouts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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

    const expiryDate = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days from now

    await ctx.db.insert("reservations", {
      bookId: args.bookId,
      userId,
      reservationDate: Date.now(),
      status: "active",
      expiryDate,
    });
  },
});

// Cancel reservation
export const cancelReservation = mutation({
  args: {
    reservationId: v.id("reservations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) throw new Error("Reservation not found");

    if (reservation.userId !== userId) {
      throw new Error("Not authorized to cancel this reservation");
    }

    await ctx.db.patch(args.reservationId, {
      status: "cancelled",
    });
  },
});
