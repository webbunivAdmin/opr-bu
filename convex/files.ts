import { ConvexError, v } from "convex/values";
import {
  MutationCtx,
  QueryCtx,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { publicationFileTypes } from "./schema";

// Generate upload URL
export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("You must be logged in to upload a file");
  }

  return await ctx.storage.generateUploadUrl();
});

// Create a file
export const createFile = mutation({
  args: {
    name: v.string(),
    fileId: v.id("_storage"),
    userId: v.string(),
    type: publicationFileTypes,
    version: v.number(),
    isPublished: v.boolean(),
    uploadDate: v.string(),
  },

  async handler(ctx, args) {
    // Fetch the Clerk user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("You must be logged in to upload a file");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) {
      throw new ConvexError("User not found in Convex database");
    }

    const userId = user._id;

    // Insert the new file into the database
    ctx.db.insert("files", {
      name: args.name,
      type: args.type,
      userId: userId,
      fileId: args.fileId,
      version: args.version,
      isPublished: args.isPublished,
      uploadDate: args.uploadDate,
    });
  },
});

// Get files by user
export const getFiles = query({
  args: {
    userId: v.id("users"),
    type: v.optional(publicationFileTypes),
    isPublished: v.optional(v.boolean()),
  },
  async handler(ctx, args) {
    let files = ctx.db
      .query("files")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Apply optional filters
    if (args.type) {
      files = files.filter((file) => file.type === args.type);
    }

    if (args.isPublished !== undefined) {
      files = files.filter((file) => file.isPublished === args.isPublished);
    }

    // Return files along with their URL
    return files.map((file) => ({
      ...file,
      url: ctx.storage.getUrl(file.fileId),
    }));
  },
});

// Delete a file
export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const file = ctx.db.get(args.fileId);

    if (!file) {
      throw new ConvexError("File not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity || file.userId !== identity.userId) {
      throw new ConvexError("You do not have permission to delete this file");
    }

    // Mark the file as deleted
    ctx.db.insert("deletedFiles", {
      name: file.name,
      userId: file.userId,
      fileId: file.fileId,
      deletedDate: new Date().toISOString(),
    });

    // Delete the file from the database
    ctx.db.delete(args.fileId);
  },
});

// Restore a deleted file
export const restoreFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const file = ctx.db.get(args.fileId);

    if (!file) {
      throw new ConvexError("File not found");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity || file.userId !== identity.userId) {
      throw new ConvexError("You do not have permission to restore this file");
    }

    // Mark the file as restored and update it in the database
    ctx.db.patch(args.fileId, {
      isPublished: false, // Set it back to unpublished
    });
  },
});
