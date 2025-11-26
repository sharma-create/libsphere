import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all books with availability info
export const getAllBooks = query({
  args: {
    search: v.optional(v.string()),
    genre: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let booksQuery;
    
    if (args.search) {
      booksQuery = ctx.db
        .query("books")
        .withSearchIndex("search_books", (q) => q.search("title", args.search!));
    } else {
      booksQuery = ctx.db.query("books");
    }
    
    const books = await booksQuery
      .filter((q) => args.genre ? q.eq(q.field("genre"), args.genre) : true)
      .take(args.limit || 50);

    return Promise.all(
      books.map(async (book) => ({
        ...book,
        coverUrl: book.coverImageId ? await ctx.storage.getUrl(book.coverImageId) : null,
      }))
    );
  },
});

// Get book by ID
export const getBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) return null;

    return {
      ...book,
      coverUrl: book.coverImageId ? await ctx.storage.getUrl(book.coverImageId) : null,
    };
  },
});

// Add new book (employee only)
export const addBook = mutation({
  args: {
    title: v.string(),
    author: v.string(),
    isbn: v.string(),
    genre: v.string(),
    description: v.optional(v.string()),
    publishedYear: v.number(),
    totalCopies: v.number(),
    coverImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "employee") {
      throw new Error("Only employees can add books");
    }

    return await ctx.db.insert("books", {
      ...args,
      availableCopies: args.totalCopies,
      addedBy: userId,
    });
  },
});

// Update book (employee only)
export const updateBook = mutation({
  args: {
    bookId: v.id("books"),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    isbn: v.optional(v.string()),
    genre: v.optional(v.string()),
    description: v.optional(v.string()),
    publishedYear: v.optional(v.number()),
    totalCopies: v.optional(v.number()),
    coverImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "employee") {
      throw new Error("Only employees can update books");
    }

    const { bookId, ...updates } = args;
    const book = await ctx.db.get(bookId);
    if (!book) throw new Error("Book not found");

    // If total copies changed, adjust available copies
    if (updates.totalCopies !== undefined) {
      const difference = updates.totalCopies - book.totalCopies;
      (updates as any).availableCopies = Math.max(0, book.availableCopies + difference);
    }

    await ctx.db.patch(bookId, updates);
  },
});

// Get all genres
export const getGenres = query({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.db.query("books").collect();
    const genres = [...new Set(books.map(book => book.genre))];
    return genres.sort();
  },
});
