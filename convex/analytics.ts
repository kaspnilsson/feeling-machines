import { query } from "./_generated/server";

/**
 * Get statistics for a specific run group
 */
export const getRunGroupStats = query(
  async ({ db }, { runGroupId }: { runGroupId: string }) => {
    const runs = await db
      .query("runs")
      .filter((q) => q.eq(q.field("runGroupId"), runGroupId))
      .collect();

    const stats = {
      total: runs.length,
      completed: runs.filter((r) => r.status === "done" || r.status === "failed").length,
      done: runs.filter((r) => r.status === "done").length,
      failed: runs.filter((r) => r.status === "failed").length,
      generating: runs.filter((r) => r.status === "generating").length,
      queued: runs.filter((r) => r.status === "queued").length,
      totalCost: runs.reduce(
        (sum, r) =>
          sum +
          (r.meta?.artist?.costEstimate || 0) +
          (r.meta?.brush?.costEstimate || 0),
        0
      ),
      avgLatency:
        runs.length > 0
          ? runs.reduce((sum, r) => sum + (r.meta?.totalLatencyMs || 0), 0) /
            runs.length
          : 0,
    };

    return { runGroupId, stats, runs };
  }
);

/**
 * Get overall statistics across all runs
 */
export const getOverallStats = query(async ({ db }) => {
  const allRuns = await db.query("runs").collect();

  const byArtist = allRuns.reduce(
    (acc, run) => {
      if (!acc[run.artistSlug]) {
        acc[run.artistSlug] = { count: 0, cost: 0, avgLatency: 0 };
      }
      acc[run.artistSlug].count++;
      acc[run.artistSlug].cost += run.meta?.artist?.costEstimate || 0;
      acc[run.artistSlug].avgLatency += run.meta?.artist?.latencyMs || 0;
      return acc;
    },
    {} as Record<string, { count: number; cost: number; avgLatency: number }>
  );

  // Calculate average latencies
  Object.keys(byArtist).forEach((slug) => {
    byArtist[slug].avgLatency =
      byArtist[slug].avgLatency / byArtist[slug].count;
  });

  const byBrush = allRuns.reduce(
    (acc, run) => {
      if (!acc[run.brushSlug]) {
        acc[run.brushSlug] = { count: 0, avgLatency: 0 };
      }
      acc[run.brushSlug].count++;
      acc[run.brushSlug].avgLatency += run.meta?.brush?.latencyMs || 0;
      return acc;
    },
    {} as Record<string, { count: number; avgLatency: number }>
  );

  // Calculate average latencies
  Object.keys(byBrush).forEach((slug) => {
    byBrush[slug].avgLatency = byBrush[slug].avgLatency / byBrush[slug].count;
  });

  return {
    totalRuns: allRuns.length,
    totalCost: allRuns.reduce(
      (sum, r) =>
        sum +
        (r.meta?.artist?.costEstimate || 0) +
        (r.meta?.brush?.costEstimate || 0),
      0
    ),
    byArtist,
    byBrush,
    byStatus: {
      done: allRuns.filter((r) => r.status === "done").length,
      failed: allRuns.filter((r) => r.status === "failed").length,
      generating: allRuns.filter((r) => r.status === "generating").length,
      queued: allRuns.filter((r) => r.status === "queued").length,
    },
  };
});

/**
 * List all unique run groups with sample thumbnails
 */
export const listRunGroups = query(async ({ db }) => {
  const allRuns = await db.query("runs").order("desc").collect();

  const groupsMap = new Map<
    string,
    {
      runGroupId: string;
      createdAt: number;
      totalRuns: number;
      completedRuns: number;
      failedRuns: number;
      artists: string[];
      sampleRuns: Array<{
        artistSlug: string;
        imageUrl: string | null;
        status: string;
      }>;
    }
  >();

  allRuns.forEach((run) => {
    if (!groupsMap.has(run.runGroupId)) {
      groupsMap.set(run.runGroupId, {
        runGroupId: run.runGroupId,
        createdAt: run.createdAt,
        totalRuns: 0,
        completedRuns: 0,
        failedRuns: 0,
        artists: [],
        sampleRuns: [],
      });
    }

    const group = groupsMap.get(run.runGroupId)!;
    group.totalRuns++;
    if (run.status === "done" || run.status === "failed") group.completedRuns++;
    if (run.status === "failed") group.failedRuns++;
    if (!group.artists.includes(run.artistSlug)) {
      group.artists.push(run.artistSlug);
    }

    // Add up to 5 sample runs per group (prioritize completed ones)
    if (group.sampleRuns.length < 5) {
      group.sampleRuns.push({
        artistSlug: run.artistSlug,
        imageUrl: run.imageUrl,
        status: run.status,
      });
    }
  });

  return Array.from(groupsMap.values()).sort(
    (a, b) => b.createdAt - a.createdAt
  );
});
