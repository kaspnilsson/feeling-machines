import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get materiality analysis for a specific run
 */
export const getMaterialityForRun = query(
  async ({ db }, { runId }: { runId: Id<"runs"> }) => {
    return await db
      .query("materiality_analysis")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .first();
  }
);

/**
 * Get aggregated materiality stats per artist
 */
export const getArtistMaterialityStats = query(
  async ({ db }, { artistSlug }: { artistSlug: string }) => {
    const analyses = await db
      .query("materiality_analysis")
      .withIndex("by_artist", (q) => q.eq("artistSlug", artistSlug))
      .collect();

    if (analyses.length === 0) {
      return null;
    }

    const avgImpossibility =
      analyses.reduce((sum, a) => sum + a.impossibilityScore, 0) /
      analyses.length;
    const avgTechnicalDetail =
      analyses.reduce((sum, a) => sum + a.technicalDetail, 0) / analyses.length;

    // Collect all unique materials
    const allMaterials = new Set<string>();
    const allConcrete = new Set<string>();
    const allSpeculative = new Set<string>();

    analyses.forEach((a) => {
      a.materials.forEach((m) => allMaterials.add(m));
      a.concreteMaterials.forEach((m) => allConcrete.add(m));
      a.speculativeMaterials.forEach((m) => allSpeculative.add(m));
    });

    return {
      artistSlug,
      count: analyses.length,
      avgImpossibility,
      avgTechnicalDetail,
      totalUniqueMaterials: allMaterials.size,
      concreteCount: allConcrete.size,
      speculativeCount: allSpeculative.size,
    };
  }
);

/**
 * Compare materiality characteristics across all artists
 */
export const compareArtistMateriality = query(async ({ db }) => {
  const allAnalyses = await db.query("materiality_analysis").collect();

  if (allAnalyses.length === 0) {
    return [];
  }

  const byArtist = allAnalyses.reduce(
    (acc, analysis) => {
      if (!acc[analysis.artistSlug]) {
        acc[analysis.artistSlug] = {
          count: 0,
          totalImpossibility: 0,
          totalTechnicalDetail: 0,
          allMaterials: new Set<string>(),
          allConcrete: new Set<string>(),
          allSpeculative: new Set<string>(),
        };
      }
      const artist = acc[analysis.artistSlug];
      artist.count++;
      artist.totalImpossibility += analysis.impossibilityScore;
      artist.totalTechnicalDetail += analysis.technicalDetail;
      analysis.materials.forEach((m) => artist.allMaterials.add(m));
      analysis.concreteMaterials.forEach((m) => artist.allConcrete.add(m));
      analysis.speculativeMaterials.forEach((m) => artist.allSpeculative.add(m));
      return acc;
    },
    {} as Record<
      string,
      {
        count: number;
        totalImpossibility: number;
        totalTechnicalDetail: number;
        allMaterials: Set<string>;
        allConcrete: Set<string>;
        allSpeculative: Set<string>;
      }
    >
  );

  return Object.entries(byArtist).map(([artistSlug, stats]) => ({
    artistSlug,
    count: stats.count,
    avgImpossibility: stats.totalImpossibility / stats.count,
    avgTechnicalDetail: stats.totalTechnicalDetail / stats.count,
    totalUniqueMaterials: stats.allMaterials.size,
    concreteCount: stats.allConcrete.size,
    speculativeCount: stats.allSpeculative.size,
  }));
});
