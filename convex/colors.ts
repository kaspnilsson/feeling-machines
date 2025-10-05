import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get color analysis for a specific run
 */
export const getColorAnalysisForRun = query(
  async ({ db }, { runId }: { runId: Id<"runs"> }) => {
    return await db
      .query("color_analysis")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .first();
  }
);

/**
 * Get aggregated color stats per artist
 */
export const getArtistColorStats = query(
  async ({ db }, { artistSlug }: { artistSlug: string }) => {
    const analyses = await db
      .query("color_analysis")
      .withIndex("by_artist", (q) => q.eq("artistSlug", artistSlug))
      .collect();

    if (analyses.length === 0) {
      return null;
    }

    const avgTemperature =
      analyses.reduce((sum, a) => sum + a.temperature, 0) / analyses.length;
    const avgSaturation =
      analyses.reduce((sum, a) => sum + a.avgSaturation, 0) / analyses.length;

    // Count harmony types
    const harmonyCounts = analyses.reduce(
      (acc, a) => {
        acc[a.harmony] = (acc[a.harmony] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      artistSlug,
      count: analyses.length,
      avgTemperature,
      avgSaturation,
      harmonyCounts,
    };
  }
);

/**
 * Compare color characteristics across all artists
 */
export const compareArtistColors = query(async ({ db }) => {
  const allAnalyses = await db.query("color_analysis").collect();

  if (allAnalyses.length === 0) {
    return [];
  }

  const byArtist = allAnalyses.reduce(
    (acc, analysis) => {
      if (!acc[analysis.artistSlug]) {
        acc[analysis.artistSlug] = {
          count: 0,
          totalTemp: 0,
          totalSat: 0,
          harmonies: {} as Record<string, number>,
        };
      }
      acc[analysis.artistSlug].count++;
      acc[analysis.artistSlug].totalTemp += analysis.temperature;
      acc[analysis.artistSlug].totalSat += analysis.avgSaturation;
      acc[analysis.artistSlug].harmonies[analysis.harmony] =
        (acc[analysis.artistSlug].harmonies[analysis.harmony] || 0) + 1;
      return acc;
    },
    {} as Record<
      string,
      {
        count: number;
        totalTemp: number;
        totalSat: number;
        harmonies: Record<string, number>;
      }
    >
  );

  return Object.entries(byArtist).map(([artistSlug, stats]) => ({
    artistSlug,
    count: stats.count,
    avgTemperature: stats.totalTemp / stats.count,
    avgSaturation: stats.totalSat / stats.count,
    harmonyCounts: stats.harmonies,
  }));
});
