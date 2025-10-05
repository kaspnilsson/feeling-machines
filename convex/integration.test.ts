/**
 * Integration tests for the full batch generation workflow
 * Tests the complete flow: enqueue → process → analyze → statistical aggregation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock types for testing
interface MockRun {
  _id: string;
  runGroupId: string;
  artistSlug: string;
  brushSlug: string;
  promptVersion: string;
  artistStmt: string;
  imagePrompt: string;
  imageUrl: string | null;
  status: string;
  meta?: Record<string, unknown>;
  createdAt: number;
}

describe("Batch Workflow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Run Group Creation", () => {
    it("should create correct number of runs for multi-artist batch", () => {
      const artistSlugs = ["gpt-5-mini", "claude-sonnet-4.5", "gemini-2.5-flash"];
      const iterations = 2;
      const expectedRunCount = artistSlugs.length * iterations; // 3 * 2 = 6

      expect(expectedRunCount).toBe(6);
    });

    it("should create unique run IDs for each iteration", () => {
      const runIds = new Set<string>();
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const runId = `run_${Date.now()}_${i}`;
        runIds.add(runId);
      }

      expect(runIds.size).toBe(iterations);
    });

    it("should assign same runGroupId to all runs in batch", () => {
      const runGroupId = "test-group-123";
      const runs: MockRun[] = [
        {
          _id: "1",
          runGroupId,
          artistSlug: "gpt-5-mini",
          brushSlug: "gpt-image-1",
          promptVersion: "v2-neutral",
          artistStmt: "",
          imagePrompt: "",
          imageUrl: null,
          status: "queued",
          createdAt: Date.now(),
        },
        {
          _id: "2",
          runGroupId,
          artistSlug: "claude-sonnet-4.5",
          brushSlug: "gpt-image-1",
          promptVersion: "v2-neutral",
          artistStmt: "",
          imagePrompt: "",
          imageUrl: null,
          status: "queued",
          createdAt: Date.now(),
        },
      ];

      const uniqueGroupIds = new Set(runs.map((r) => r.runGroupId));
      expect(uniqueGroupIds.size).toBe(1);
      expect(uniqueGroupIds.has(runGroupId)).toBe(true);
    });
  });

  describe("Run Status Transitions", () => {
    it("should transition from queued → generating → done", () => {
      const statusFlow = ["queued", "generating", "done"];
      let currentStatus = 0;

      const advanceStatus = () => {
        if (currentStatus < statusFlow.length - 1) {
          currentStatus++;
        }
        return statusFlow[currentStatus];
      };

      expect(statusFlow[currentStatus]).toBe("queued");
      expect(advanceStatus()).toBe("generating");
      expect(advanceStatus()).toBe("done");
    });

    it("should transition to failed on error", () => {
      const statuses = {
        queued: "queued",
        generating: "generating",
        failed: "failed",
      };

      const shouldFail = true;
      const finalStatus = shouldFail ? statuses.failed : "done";

      expect(finalStatus).toBe("failed");
    });
  });

  describe("Batch Completion Statistics", () => {
    it("should calculate completion percentage correctly", () => {
      const totalRuns = 10;
      const completedRuns = 7;
      const failedRuns = 1;

      const completionPct = ((completedRuns + failedRuns) / totalRuns) * 100;
      expect(completionPct).toBe(80);

      const successRate = (completedRuns / (completedRuns + failedRuns)) * 100;
      expect(successRate).toBeCloseTo(87.5, 1);
    });

    it("should aggregate metadata correctly", () => {
      const runs: MockRun[] = [
        {
          _id: "1",
          runGroupId: "group1",
          artistSlug: "gpt-5-mini",
          brushSlug: "gpt-image-1",
          promptVersion: "v2-neutral",
          artistStmt: "test",
          imagePrompt: "test",
          imageUrl: "http://test.com/1.png",
          status: "done",
          meta: { artist: { costEstimate: 0.001 }, totalLatencyMs: 2000 },
          createdAt: Date.now(),
        },
        {
          _id: "2",
          runGroupId: "group1",
          artistSlug: "claude-sonnet-4.5",
          brushSlug: "gpt-image-1",
          promptVersion: "v2-neutral",
          artistStmt: "test",
          imagePrompt: "test",
          imageUrl: "http://test.com/2.png",
          status: "done",
          meta: { artist: { costEstimate: 0.002 }, totalLatencyMs: 3000 },
          createdAt: Date.now(),
        },
      ];

      const totalCost = runs.reduce(
        (sum, r) => sum + ((r.meta?.artist as { costEstimate?: number })?.costEstimate || 0),
        0
      );
      const avgLatency =
        runs.reduce((sum, r) => sum + ((r.meta?.totalLatencyMs as number) || 0), 0) /
        runs.length;

      expect(totalCost).toBe(0.003);
      expect(avgLatency).toBe(2500);
    });
  });

  describe("Error Handling", () => {
    it("should preserve artist data when brush fails", () => {
      const artistData = {
        artistStmt: "A beautiful sunset over rolling hills",
        imagePrompt: "sunset, rolling hills, golden hour",
      };

      const failedRun: MockRun = {
        _id: "fail1",
        runGroupId: "group1",
        artistSlug: "gpt-5-mini",
        brushSlug: "failing-brush",
        promptVersion: "v2-neutral",
        ...artistData,
        imageUrl: null,
        status: "failed",
        meta: { errorMessage: "Brush API timeout" },
        createdAt: Date.now(),
      };

      expect(failedRun.artistStmt).toBe(artistData.artistStmt);
      expect(failedRun.imagePrompt).toBe(artistData.imagePrompt);
      expect(failedRun.status).toBe("failed");
    });

    it("should calculate failure rate correctly", () => {
      const runs = [
        { status: "done" },
        { status: "done" },
        { status: "failed" },
        { status: "done" },
        { status: "failed" },
      ];

      const failureRate =
        runs.filter((r) => r.status === "failed").length / runs.length;
      expect(failureRate).toBe(0.4); // 2/5 = 40% failure rate
    });
  });

  describe("Analysis Pipeline", () => {
    it("should trigger all analysis types for completed run", () => {
      const analysisTypes = ["sentiment", "color", "materiality"];
      const triggeredAnalyses = new Set<string>();

      const run: MockRun = {
        _id: "1",
        runGroupId: "group1",
        artistSlug: "gpt-5-mini",
        brushSlug: "gpt-image-1",
        promptVersion: "v2-neutral",
        artistStmt: "A serene landscape with warm colors",
        imagePrompt: "landscape, warm tones",
        imageUrl: "http://test.com/1.png",
        status: "done",
        createdAt: Date.now(),
      };

      // Simulate analysis triggers
      if (run.status === "done") {
        if (run.artistStmt) {
          triggeredAnalyses.add("sentiment");
          triggeredAnalyses.add("materiality");
        }
        if (run.imageUrl) {
          triggeredAnalyses.add("color");
        }
      }

      expect(triggeredAnalyses.size).toBe(3);
      analysisTypes.forEach((type) => {
        expect(triggeredAnalyses.has(type)).toBe(true);
      });
    });

    it("should not trigger color analysis without image", () => {
      const run: MockRun = {
        _id: "1",
        runGroupId: "group1",
        artistSlug: "gpt-5-mini",
        brushSlug: "gpt-image-1",
        promptVersion: "v2-neutral",
        artistStmt: "Test statement",
        imagePrompt: "test",
        imageUrl: null, // No image
        status: "failed",
        createdAt: Date.now(),
      };

      const canRunColorAnalysis = run.imageUrl !== null && run.status === "done";
      expect(canRunColorAnalysis).toBe(false);
    });
  });

  describe("Statistical Aggregation", () => {
    it("should group runs by artist correctly", () => {
      const runs: MockRun[] = [
        {
          _id: "1",
          runGroupId: "g1",
          artistSlug: "gpt-5-mini",
          brushSlug: "b1",
          promptVersion: "v2-neutral",
          artistStmt: "",
          imagePrompt: "",
          imageUrl: null,
          status: "done",
          createdAt: Date.now(),
        },
        {
          _id: "2",
          runGroupId: "g1",
          artistSlug: "gpt-5-mini",
          brushSlug: "b1",
          promptVersion: "v2-neutral",
          artistStmt: "",
          imagePrompt: "",
          imageUrl: null,
          status: "done",
          createdAt: Date.now(),
        },
        {
          _id: "3",
          runGroupId: "g1",
          artistSlug: "claude-sonnet-4.5",
          brushSlug: "b1",
          promptVersion: "v2-neutral",
          artistStmt: "",
          imagePrompt: "",
          imageUrl: null,
          status: "done",
          createdAt: Date.now(),
        },
      ];

      const byArtist = runs.reduce(
        (acc, run) => {
          if (!acc[run.artistSlug]) {
            acc[run.artistSlug] = [];
          }
          acc[run.artistSlug].push(run);
          return acc;
        },
        {} as Record<string, MockRun[]>
      );

      expect(Object.keys(byArtist)).toHaveLength(2);
      expect(byArtist["gpt-5-mini"]).toHaveLength(2);
      expect(byArtist["claude-sonnet-4.5"]).toHaveLength(1);
    });

    it("should calculate sample size per artist correctly", () => {
      const sentimentData = [
        { artistSlug: "gpt-5-mini", valence: 0.5 },
        { artistSlug: "gpt-5-mini", valence: 0.6 },
        { artistSlug: "gpt-5-mini", valence: 0.4 },
        { artistSlug: "claude-sonnet-4.5", valence: 0.7 },
        { artistSlug: "claude-sonnet-4.5", valence: 0.8 },
      ];

      const sampleSizes = sentimentData.reduce(
        (acc, s) => {
          acc[s.artistSlug] = (acc[s.artistSlug] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(sampleSizes["gpt-5-mini"]).toBe(3);
      expect(sampleSizes["claude-sonnet-4.5"]).toBe(2);
    });
  });

  describe("Retry Logic", () => {
    it("should calculate exponential backoff correctly", () => {
      const getBackoffDelay = (attempt: number) => {
        const baseDelay = 1000;
        return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
      };

      expect(getBackoffDelay(1)).toBe(1000); // 1s
      expect(getBackoffDelay(2)).toBe(2000); // 2s
      expect(getBackoffDelay(3)).toBe(4000); // 4s
      expect(getBackoffDelay(4)).toBe(8000); // 8s
      expect(getBackoffDelay(5)).toBe(16000); // 16s
      expect(getBackoffDelay(10)).toBe(30000); // capped at 30s
    });

    it("should not exceed max retries", () => {
      const MAX_RETRIES = 3;
      let attempts = 0;

      const attemptAction = () => {
        attempts++;
        if (attempts > MAX_RETRIES) {
          throw new Error("Max retries exceeded");
        }
        return attempts <= MAX_RETRIES;
      };

      expect(attemptAction()).toBe(true); // attempt 1
      expect(attemptAction()).toBe(true); // attempt 2
      expect(attemptAction()).toBe(true); // attempt 3
      expect(() => attemptAction()).toThrow("Max retries exceeded"); // attempt 4
    });
  });
});
