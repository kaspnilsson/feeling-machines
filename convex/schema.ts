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
  })
    .index("by_run", ["runId"])
    .index("by_artist", ["artistSlug"]),

  color_analysis: defineTable({
    runId: v.id("runs"), // Link to run
    artistSlug: v.string(),
    dominantColors: v.array(
      v.object({
        hex: v.string(),
        rgb: v.array(v.number()),
        percentage: v.number(),
      })
    ),
    temperature: v.number(), // -1 (cool) to 1 (warm)
    avgSaturation: v.number(), // 0 to 1
    harmony: v.string(), // "complementary" | "analogous" | "triadic" | "monochromatic"
    createdAt: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_artist", ["artistSlug"]),

  materiality_analysis: defineTable({
    runId: v.id("runs"), // Link to run
    artistSlug: v.string(),
    materials: v.array(v.string()),
    concreteMaterials: v.array(v.string()),
    speculativeMaterials: v.array(v.string()),
    impossibilityScore: v.number(), // 0 (all concrete) to 1 (all speculative)
    technicalDetail: v.number(), // 0 to 1
    createdAt: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_artist", ["artistSlug"]),

  // Statistical analysis results
  model_statistics: defineTable({
    artistSlug: v.string(),
    metric: v.string(), // e.g., "valence", "temperature", "impossibilityScore"
    runGroupId: v.optional(v.string()), // Optional filtering by run group
    n: v.number(), // Sample size
    mean: v.number(),
    stdDev: v.number(),
    median: v.number(),
    q1: v.number(), // 25th percentile
    q3: v.number(), // 75th percentile
    min: v.number(),
    max: v.number(),
    ci95Lower: v.number(), // 95% confidence interval lower bound
    ci95Upper: v.number(), // 95% confidence interval upper bound
    createdAt: v.number(),
  })
    .index("by_artist_metric", ["artistSlug", "metric"])
    .index("by_metric", ["metric"]),

  statistical_comparisons: defineTable({
    metric: v.string(), // Which metric is being compared
    artist1: v.string(),
    artist2: v.string(),
    runGroupId: v.optional(v.string()), // Optional filtering by run group
    n1: v.number(), // Sample size for artist1
    n2: v.number(), // Sample size for artist2
    mean1: v.number(),
    mean2: v.number(),
    meanDiff: v.number(), // mean1 - mean2
    tStatistic: v.number(),
    pValue: v.number(),
    degreesOfFreedom: v.number(),
    cohensD: v.number(), // Effect size
    significant: v.boolean(), // pValue < 0.05 after correction
    createdAt: v.number(),
  })
    .index("by_metric", ["metric"])
    .index("by_artists", ["artist1", "artist2"])
    .index("by_significance", ["metric", "significant"]),

  anova_results: defineTable({
    metric: v.string(), // Which metric was tested
    runGroupId: v.optional(v.string()), // Optional filtering by run group
    fStatistic: v.number(),
    pValue: v.number(),
    dfBetween: v.number(), // Degrees of freedom between groups
    dfWithin: v.number(), // Degrees of freedom within groups
    etaSquared: v.number(), // Effect size (proportion of variance explained)
    significant: v.boolean(), // pValue < 0.05
    createdAt: v.number(),
  }).index("by_metric", ["metric"]),
});
