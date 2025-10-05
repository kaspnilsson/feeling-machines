import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Save descriptive statistics for a model/metric combination
 */
export const saveModelStatistics = mutation({
  args: {
    artistSlug: v.string(),
    metric: v.string(),
    runGroupId: v.optional(v.string()),
    n: v.number(),
    mean: v.number(),
    stdDev: v.number(),
    median: v.number(),
    q1: v.number(),
    q3: v.number(),
    min: v.number(),
    max: v.number(),
    ci95Lower: v.number(),
    ci95Upper: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("model_statistics", args);
  },
});

/**
 * Get descriptive statistics for a specific artist and metric
 */
export const getDescriptiveStats = query({
  args: {
    artistSlug: v.string(),
    metric: v.string(),
    runGroupId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("model_statistics")
      .withIndex("by_artist_metric", (q) =>
        q.eq("artistSlug", args.artistSlug).eq("metric", args.metric)
      )
      .filter((q) =>
        args.runGroupId
          ? q.eq(q.field("runGroupId"), args.runGroupId)
          : q.eq(q.field("runGroupId"), null)
      )
      .order("desc")
      .first();

    return stats;
  },
});

/**
 * Get all descriptive statistics for a metric across all artists
 */
export const getStatsByMetric = query({
  args: {
    metric: v.string(),
    runGroupId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("model_statistics")
      .withIndex("by_metric", (q) => q.eq("metric", args.metric))
      .filter((q) =>
        args.runGroupId
          ? q.eq(q.field("runGroupId"), args.runGroupId)
          : q.eq(q.field("runGroupId"), null)
      )
      .collect();

    return stats;
  },
});

/**
 * Save pairwise comparison result (t-test)
 */
export const saveComparison = mutation({
  args: {
    metric: v.string(),
    artist1: v.string(),
    artist2: v.string(),
    runGroupId: v.optional(v.string()),
    n1: v.number(),
    n2: v.number(),
    mean1: v.number(),
    mean2: v.number(),
    meanDiff: v.number(),
    tStatistic: v.number(),
    pValue: v.number(),
    degreesOfFreedom: v.number(),
    cohensD: v.number(),
    significant: v.boolean(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("statistical_comparisons", args);
  },
});

/**
 * Get pairwise comparison between two artists for a metric
 */
export const getPairwiseComparison = query({
  args: {
    metric: v.string(),
    artist1: v.string(),
    artist2: v.string(),
    runGroupId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const comparison = await ctx.db
      .query("statistical_comparisons")
      .withIndex("by_artists", (q) =>
        q.eq("artist1", args.artist1).eq("artist2", args.artist2)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("metric"), args.metric),
          args.runGroupId
            ? q.eq(q.field("runGroupId"), args.runGroupId)
            : q.eq(q.field("runGroupId"), null)
        )
      )
      .order("desc")
      .first();

    return comparison;
  },
});

/**
 * Get all significant comparisons for a metric
 */
export const getSignificantComparisons = query({
  args: {
    metric: v.string(),
    runGroupId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const comparisons = await ctx.db
      .query("statistical_comparisons")
      .withIndex("by_significance", (q) =>
        q.eq("metric", args.metric).eq("significant", true)
      )
      .filter((q) =>
        args.runGroupId
          ? q.eq(q.field("runGroupId"), args.runGroupId)
          : q.eq(q.field("runGroupId"), null)
      )
      .collect();

    return comparisons;
  },
});

/**
 * Save ANOVA result
 */
export const saveANOVA = mutation({
  args: {
    metric: v.string(),
    runGroupId: v.optional(v.string()),
    fStatistic: v.number(),
    pValue: v.number(),
    dfBetween: v.number(),
    dfWithin: v.number(),
    etaSquared: v.number(),
    significant: v.boolean(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("anova_results", args);
  },
});

/**
 * Get ANOVA results for a metric
 */
export const getANOVAResults = query({
  args: {
    metric: v.string(),
    runGroupId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("anova_results")
      .withIndex("by_metric", (q) => q.eq("metric", args.metric))
      .filter((q) =>
        args.runGroupId
          ? q.eq(q.field("runGroupId"), args.runGroupId)
          : q.eq(q.field("runGroupId"), null)
      )
      .order("desc")
      .first();

    return result;
  },
});

/**
 * Get all ANOVA results (optionally filtered by significance)
 */
export const listANOVAResults = query({
  args: {
    significantOnly: v.optional(v.boolean()),
    runGroupId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("anova_results")
      .filter((q) =>
        args.runGroupId
          ? q.eq(q.field("runGroupId"), args.runGroupId)
          : q.eq(q.field("runGroupId"), null)
      )
      .collect();

    if (args.significantOnly) {
      results = results.filter((r) => r.significant);
    }

    return results;
  },
});
