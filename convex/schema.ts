import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  runs: defineTable({
    runGroupId: v.string(), // UUID linking runs from same experiment
    artistSlug: v.string(), // e.g. "gpt-5-mini"
    brushSlug: v.string(), // e.g. "gemini-2.5-flash-image"
    promptVersion: v.string(), // "v2-neutral" | "v3-introspective"
    paramPreset: v.optional(v.string()), // "default" | "deterministic" | "creative" | "balanced"
    artistStmt: v.string(),
    imagePrompt: v.string(),
    imageUrl: v.union(v.string(), v.null()), // URL to image (null until generated)
    status: v.string(), // "queued" | "generating" | "done" | "failed"
    errorMessage: v.optional(v.string()), // Error message if status is "failed"
    meta: v.optional(v.any()), // { artist: {params, tokens, cost}, brush: {cost}, totalLatencyMs }
    createdAt: v.number(),
  }),
});
