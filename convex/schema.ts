import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  runs: defineTable({
    runGroupId: v.string(), // UUID linking runs from same experiment
    artistSlug: v.string(), // e.g. "gpt-4o-mini"
    brushSlug: v.string(), // e.g. "gpt-image-1"
    promptVersion: v.string(), // "v2-neutral"
    artistStmt: v.string(),
    imagePrompt: v.string(),
    imageUrl: v.union(v.string(), v.null()), // URL to image (null until generated)
    status: v.string(), // "queued" | "generating" | "done" | "failed"
    meta: v.optional(v.any()), // JSON for model params, cost, latency
    createdAt: v.number(),
  }),
});
