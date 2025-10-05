"use node";

import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { AnalysisPipeline, RunData } from "./analysisRunner";
import { SentimentRunner, ColorRunner, MaterialityRunner } from "./analysisRunners";

/**
 * Action to run all analysis on a completed run
 * This runs in Node.js environment to support image processing libraries
 * Uses the unified analysis pipeline for consistency and extensibility
 */
export const analyzeRun = internalAction(
  async (
    { runMutation },
    {
      runId,
      artistSlug,
      statement,
      imageUrl,
    }: {
      runId: string;
      artistSlug: string;
      statement: string;
      imageUrl: string;
    }
  ) => {
    // Create analysis pipeline
    const pipeline = new AnalysisPipeline();

    // Register all analysis runners
    pipeline.register(new SentimentRunner());
    pipeline.register(new ColorRunner());
    pipeline.register(new MaterialityRunner());

    // Prepare run data
    const runData: RunData = {
      runId: runId as Id<"runs">,
      artistSlug,
      artistStmt: statement,
      imageUrl,
    };

    // Execute all analyses in parallel
    await runMutation(internal.runAnalysis.executeAnalysisPipeline, {
      runData,
    });
  }
);

/**
 * Internal mutation to execute analysis pipeline
 * Separated to allow database access within the pipeline
 */
export const executeAnalysisPipeline = internalMutation(
  async ({ db }, { runData }: { runData: RunData }) => {
    const pipeline = new AnalysisPipeline();

    // Register all analysis runners
    pipeline.register(new SentimentRunner());
    pipeline.register(new ColorRunner());
    pipeline.register(new MaterialityRunner());

    // Execute pipeline
    const results = await pipeline.executeAll(runData, db);

    // Log summary
    console.log(`[AnalysisPipeline] Complete for run ${runData.runId}:`, {
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      skipped: results.skipped,
      durationMs: results.durationMs,
    });

    return results;
  }
);
