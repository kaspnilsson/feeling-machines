"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { analyzeSentiment } from "../scripts/analyze-sentiment";
import { analyzeColors } from "../scripts/analyze-colors";
import { analyzeMateriality } from "../scripts/analyze-materiality";

/**
 * Action to run all analysis on a completed run
 * This runs in Node.js environment to support image processing libraries
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
    // 1️⃣ Analyze sentiment
    try {
      console.log(`[AnalyzeRun] Analyzing sentiment for run ${runId}...`);
      const sentiment = await analyzeSentiment({
        runId,
        artistSlug,
        statement,
      });

      await runMutation(internal.generateBatch.saveSentiment, {
        runId: runId as Id<"runs">,
        sentiment,
      });

      console.log(`[AnalyzeRun] ✓ Sentiment analysis complete`);
    } catch (error: any) {
      console.error(
        `[AnalyzeRun] ⚠ Sentiment analysis failed (non-fatal): ${error.message}`
      );
    }

    // 2️⃣ Analyze colors
    try {
      console.log(`[AnalyzeRun] Analyzing colors for run ${runId}...`);
      const colorAnalysis = await analyzeColors({
        runId,
        artistSlug,
        brushSlug: "unused", // Will be removed from the returned object
        imageUrl,
      });

      await runMutation(internal.generateBatch.saveColorAnalysis, {
        runId: runId as Id<"runs">,
        colorAnalysis,
      });

      console.log(`[AnalyzeRun] ✓ Color analysis complete`);
    } catch (error: any) {
      console.error(
        `[AnalyzeRun] ⚠ Color analysis failed (non-fatal): ${error.message}`
      );
    }

    // 3️⃣ Analyze materiality
    try {
      console.log(`[AnalyzeRun] Analyzing materiality for run ${runId}...`);
      const materialityAnalysis = await analyzeMateriality({
        runId,
        artistSlug,
        statement,
      });

      await runMutation(internal.generateBatch.saveMaterialityAnalysis, {
        runId: runId as Id<"runs">,
        materialityAnalysis,
      });

      console.log(`[AnalyzeRun] ✓ Materiality analysis complete`);
    } catch (error: any) {
      console.error(
        `[AnalyzeRun] ⚠ Materiality analysis failed (non-fatal): ${error.message}`
      );
    }
  }
);
