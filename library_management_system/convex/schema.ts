import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Books table
  books: defineTable({
    title: v.string(),
    author: v.string(),
    isbn: v.string(),
    genre: v.string(),
    description: v.optional(v.string()),
    publishedYear: v.number(),
    totalCopies: v.number(),
    availableCopies: v.number(),
    coverImageId: v.optional(v.id("_storage")),
    addedBy: v.id("users"), // Employee who added the book
  })
    .index("by_title", ["title"])
    .index("by_author", ["author"])
    .index("by_genre", ["genre"])
    .index("by_isbn", ["isbn"])
    .searchIndex("search_books", {
      searchField: "title",
      filterFields: ["author", "genre"],
    }),

  // User profiles (extends auth users)
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("customer"), v.literal("employee")),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    membershipDate: v.number(),
    isActive: v.boolean(),
  }).index("by_user_id", ["userId"]),

  // Book checkouts
  checkouts: defineTable({
    bookId: v.id("books"),
    userId: v.id("users"),
    checkoutDate: v.number(),
    dueDate: v.number(),
    returnDate: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("returned"), v.literal("overdue")),
    renewalCount: v.number(),
    checkedOutBy: v.optional(v.id("users")), // Employee who processed checkout
  })
    .index("by_user", ["userId"])
    .index("by_book", ["bookId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"]),

  // Book reservations
  reservations: defineTable({
    bookId: v.id("books"),
    userId: v.id("users"),
    reservationDate: v.number(),
    status: v.union(v.literal("active"), v.literal("fulfilled"), v.literal("cancelled")),
    expiryDate: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_book", ["bookId"])
    .index("by_status", ["status"]),

  // Fines
  fines: defineTable({
    userId: v.id("users"),
    checkoutId: v.id("checkouts"),
    amount: v.number(),
    reason: v.string(),
    dateIssued: v.number(),
    datePaid: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("paid")),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
