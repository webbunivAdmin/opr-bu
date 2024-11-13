import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define the file types
export const publicationFileTypes = v.union(
  v.literal("image"),
  v.literal("pdf"),
  v.literal("ppt"),
  v.literal("pptx"),
  v.literal("doc"),
  v.literal("docx"),
  v.literal("xlsx")
);

// Define the schema for users, files, publications, comments, and deleted files
export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  files: defineTable({
    name: v.string(),
    type: v.optional(publicationFileTypes),
    userId: v.id("users"),
    fileId: v.id("_storage"),
    version: v.number(),
    isPublished: v.boolean(),
    uploadDate: v.string(),
  }).index("by_userId", ["userId"]),

  publications: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    publicationDate: v.optional(v.string()),
    creatorId: v.id("users"),
    fileIds: v.array(v.id("files")),
    status: v.optional(v.string()),
    coverImageId: v.optional(v.id("_storage")),
    isPublished: v.boolean(),
  }),

  publicationComments: defineTable({
    publicationId: v.id("publications"),
    userId: v.id("users"),
    commentText: v.string(),
    timestamp: v.string(),
  }),

  deletedFiles: defineTable({
    name: v.string(),
    userId: v.id("users"),
    fileId: v.id("_storage"),
    deletedDate: v.string(),
  }).index("by_userId", ["userId"]),
});
