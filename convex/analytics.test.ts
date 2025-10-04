import { describe, it, expect } from "vitest";

describe("Analytics calculations", () => {
  it("should calculate correct stats for run group", () => {
    const runs = [
      {
        status: "done",
        meta: { artist: { costEstimate: 0.001 }, totalLatencyMs: 1000 },
      },
      {
        status: "done",
        meta: { artist: { costEstimate: 0.002 }, totalLatencyMs: 2000 },
      },
      { status: "failed", meta: {} },
      { status: "generating", meta: {} },
      { status: "queued", meta: {} },
    ];

    const stats = {
      total: runs.length,
      completed: runs.filter((r) => r.status === "done").length,
      failed: runs.filter((r) => r.status === "failed").length,
      generating: runs.filter((r) => r.status === "generating").length,
      queued: runs.filter((r) => r.status === "queued").length,
      totalCost: runs.reduce(
        (sum, r) => sum + (r.meta?.artist?.costEstimate || 0),
        0
      ),
      avgLatency:
        runs.reduce((sum, r) => sum + (r.meta?.totalLatencyMs || 0), 0) /
        runs.length,
    };

    expect(stats.total).toBe(5);
    expect(stats.completed).toBe(2);
    expect(stats.failed).toBe(1);
    expect(stats.generating).toBe(1);
    expect(stats.queued).toBe(1);
    expect(stats.totalCost).toBe(0.003);
    expect(stats.avgLatency).toBe(600); // (1000 + 2000) / 5
  });

  it("should group runs by artist slug", () => {
    const runs = [
      {
        artistSlug: "gpt-4o-mini",
        meta: { artist: { costEstimate: 0.001, latencyMs: 1000 } },
      },
      {
        artistSlug: "gpt-4o-mini",
        meta: { artist: { costEstimate: 0.002, latencyMs: 2000 } },
      },
      {
        artistSlug: "gpt-4o",
        meta: { artist: { costEstimate: 0.005, latencyMs: 1500 } },
      },
    ];

    const byArtist = runs.reduce((acc: any, run: any) => {
      if (!acc[run.artistSlug]) {
        acc[run.artistSlug] = { count: 0, cost: 0, avgLatency: 0 };
      }
      acc[run.artistSlug].count++;
      acc[run.artistSlug].cost += run.meta?.artist?.costEstimate || 0;
      acc[run.artistSlug].avgLatency += run.meta?.artist?.latencyMs || 0;
      return acc;
    }, {});

    // Calculate averages
    Object.keys(byArtist).forEach((slug) => {
      byArtist[slug].avgLatency =
        byArtist[slug].avgLatency / byArtist[slug].count;
    });

    expect(byArtist["gpt-4o-mini"].count).toBe(2);
    expect(byArtist["gpt-4o-mini"].cost).toBe(0.003);
    expect(byArtist["gpt-4o-mini"].avgLatency).toBe(1500); // (1000 + 2000) / 2

    expect(byArtist["gpt-4o"].count).toBe(1);
    expect(byArtist["gpt-4o"].cost).toBe(0.005);
    expect(byArtist["gpt-4o"].avgLatency).toBe(1500);
  });

  it("should deduplicate artists in run group", () => {
    const runs = [
      { runGroupId: "group-1", artistSlug: "gpt-4o-mini", status: "done" },
      { runGroupId: "group-1", artistSlug: "gpt-4o", status: "done" },
      { runGroupId: "group-1", artistSlug: "gpt-4o-mini", status: "failed" },
    ];

    const artists: string[] = [];
    runs.forEach((run: any) => {
      if (!artists.includes(run.artistSlug)) {
        artists.push(run.artistSlug);
      }
    });

    expect(artists).toHaveLength(2);
    expect(artists).toContain("gpt-4o-mini");
    expect(artists).toContain("gpt-4o");
  });
});
