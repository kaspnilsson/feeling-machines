import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  runs: defineTable({
    runGroupId: v.string(), // UUID linking runs from same experiment
    artistSlug: v.string(), // e.g. "gpt-5-mini"
    brushSlug: v.string(), // e.g. "gemini-2.5-flash-image"
    promptVersion: v.string(), // "v2-neutral" | "v3-introspective"
    paramPreset: v.optional(v.string()), // DEPRECATED - kept for backwards compatibility during migration
    artistStmt: v.string(),
    imagePrompt: v.string(),
    imageUrl: v.union(v.string(), v.null()), // URL to image (null until generated)
    status: v.string(), // "queued" | "generating" | "done" | "failed"
    errorMessage: v.optional(v.string()), // Error message if status is "failed"
    meta: v.optional(v.any()), // { artist: {tokens, cost}, brush: {cost}, totalLatencyMs }
    createdAt: v.number(),
  }),

  sentiment_analysis: defineTable({
    runId: v.id("runs"), // Link to run
    artistSlug: v.string(),
    emotions: v.object({
      joy: v.number(),
      sadness: v.number(),
      anger: v.number(),
      fear: v.number(),
      surprise: v.number(),
      neutral: v.number(),
    }),
    valence: v.number(), // -1 to 1
    arousal: v.number(), // 0 to 1
    wordCount: v.number(),
    uniqueWords: v.number(),
    abstractness: v.number(), // 0 to 1
    createdAt: v.number(),
  }).index("by_run", ["runId"])
    .index("by_artist", ["artistSlug"]),
});
