import {
  mutation,
  internalAction,
  internalMutation,
} from "./_generated/server";
import { internal, api } from "./_generated/api";
import { ARTISTS } from "./artists";
import { getArtist } from "./artistAdapters";
import { getBrush } from "./brushes";
import {
  SYSTEM_PROMPT,
  V2_NEUTRAL,
  V3_INTROSPECTIVE,
  V4_SELF_PORTRAIT,
  V5_PAINT_YOUR_FEELINGS,
  V6_YOUR_ESSENCE,
} from "./prompts";
import { rateLimit, getBackoffDelay } from "./rateLimiter";
import { Logger, monitor, logAPICall } from "../utils/logger";

const logger = new Logger("generateBatch");

// Map prompt version strings to actual prompt content
const PROMPT_MAP: Record<string, string> = {
  "v2-neutral": V2_NEUTRAL,
  "v3-introspective": V3_INTROSPECTIVE,
  "v4-self-portrait": V4_SELF_PORTRAIT,
  "v5-paint-your-feelings": V5_PAINT_YOUR_FEELINGS,
  "v6-your-essence": V6_YOUR_ESSENCE,
};
import { Id } from "./_generated/dataModel";
import type { SentimentAnalysis } from "../scripts/analyze-sentiment";
import type { ColorAnalysis } from "../scripts/analyze-colors";
import type { MaterialityAnalysis } from "../scripts/analyze-materiality";

/**
 * Phase 2: Enqueue a batch of runs for multiple artists
 * Creates placeholder runs and schedules background actions to generate each one
 */
export const enqueueRunGroup = mutation(
  async (
    { db, scheduler },
    {
      promptVersion = "v2-neutral",
      artistSlugs,
      brushSlug,
      iterations = 1,
    }: {
      promptVersion?: string;
      artistSlugs: string[];
      brushSlug: string;
      iterations?: number;
    }
  ) => {
    const runGroupId = crypto.randomUUID();

    if (!artistSlugs || artistSlugs.length === 0) {
      throw new Error("At least one artist must be selected");
    }

    if (!brushSlug) {
      throw new Error("A brush must be selected");
    }

    const selectedArtists = ARTISTS.filter((a) => artistSlugs.includes(a.slug));

    if (selectedArtists.length === 0) {
      throw new Error(
        `No valid artists found for slugs: ${artistSlugs.join(", ")}`
      );
    }

    const brush = { slug: brushSlug };

    console.log(
      `🎨 [EnqueueRunGroup] Creating run group ${runGroupId} with ${selectedArtists.length} artists × ${iterations} iterations`
    );

    const runIds: Id<"runs">[] = [];

    // Create runs for each artist × iteration combination
    for (const artist of selectedArtists) {
      for (let i = 0; i < iterations; i++) {
        // Create placeholder run
        const runId = await db.insert("runs", {
          runGroupId,
          artistSlug: artist.slug,
          brushSlug: brush.slug,
          promptVersion,
          artistStmt: "",
          imagePrompt: "",
          imageUrl: null,
          status: "queued",
          meta: {
            enqueuedAt: Date.now(),
            iteration: i + 1,
          },
          createdAt: Date.now(),
        });

        runIds.push(runId);

        console.log(
          `  → Queued run ${runId} for ${artist.slug} + ${brush.slug} (iteration ${i + 1}/${iterations})`
        );

        // Schedule background action to process this run
        await scheduler.runAfter(0, internal.generateBatch.processSingleRun, {
          runId,
        });
      }
    }

    console.log(
      `🎨 [EnqueueRunGroup] ✓ Enqueued ${runIds.length} runs in group ${runGroupId}`
    );

    return {
      runGroupId,
      artistCount: selectedArtists.length,
      runIds,
    };
  }
);

/**
 * Internal action to process a single run
 * This is called by the scheduler for each artist in a run group
 */
export const processSingleRun = internalAction(
  async ({ runMutation, runAction }, { runId }: { runId: Id<"runs"> }) => {
    const perfMonitor = monitor(`run.${runId}`);
    logger.info(`Starting run`, { runId });

    // Get run details
    const run = await runMutation(internal.generateBatch.getRun, { runId });

    if (!run) {
      logger.error(`Run not found`, undefined, { runId });
      return;
    }

    try {
      // Update status to generating
      await runMutation(internal.generateBatch.updateRunStatus, {
        runId,
        status: "generating",
      });

      const artistAdapter = getArtist(run.artistSlug);
      const brush = getBrush(run.brushSlug);

      console.log(
        `[ProcessRun] Artist: ${artistAdapter.displayName}, Brush: ${brush.displayName}`
      );

      let artistResponse;
      let brushResult;
      let brushLatency = 0;
      const MAX_BRUSH_RETRIES = 3;

      try {
        // 1️⃣ Artist imagines (with rate limiting)
        const userPrompt = PROMPT_MAP[run.promptVersion] || V2_NEUTRAL;
        logger.info(`Calling artist`, {
          artist: run.artistSlug,
          promptVersion: run.promptVersion,
        });

        // Apply rate limiting for OpenRouter API calls
        await rateLimit("openrouter");

        const artistStart = Date.now();
        artistResponse = await artistAdapter.generateArtistResponse(
          SYSTEM_PROMPT,
          userPrompt
        );
        const artistDuration = Date.now() - artistStart;

        logger.info(`Artist complete`, {
          artist: run.artistSlug,
          durationMs: artistDuration,
          tokens: artistResponse.metadata.tokens,
          cost: artistResponse.metadata.costEstimate,
        });

        // Log API metrics
        logAPICall({
          provider: "openrouter",
          operation: "generateArtistResponse",
          duration: artistDuration,
          cost: artistResponse.metadata.costEstimate,
          tokens: artistResponse.metadata.tokens,
          status: "success",
        });

        // 2️⃣ Brush paints (with retry logic)
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= MAX_BRUSH_RETRIES; attempt++) {
          try {
            logger.info(`Calling brush`, {
              brush: run.brushSlug,
              attempt,
              maxRetries: MAX_BRUSH_RETRIES,
            });

            // Apply rate limiting for brush API calls
            const brushProvider = brush.provider; // 'openai' or 'google'
            await rateLimit(brushProvider);

            const startBrush = Date.now();
            brushResult = await brush.generate(artistResponse.imagePrompt);
            brushLatency = Date.now() - startBrush;

            logger.info(`Brush complete`, {
              brush: run.brushSlug,
              durationMs: brushLatency,
              attempt,
            });

            logAPICall({
              provider: brushProvider,
              operation: "generateImage",
              duration: brushLatency,
              status: "success",
            });

            break; // Success, exit retry loop
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            logger.error(`Brush attempt failed`, lastError, {
              brush: run.brushSlug,
              attempt,
              maxRetries: MAX_BRUSH_RETRIES,
            });

            logAPICall({
              provider: brush.provider,
              operation: "generateImage",
              duration: 0,
              status: "error",
              errorType: lastError.name,
            });

            if (attempt === MAX_BRUSH_RETRIES) {
              // All retries exhausted
              throw lastError;
            }

            // Wait before retrying (exponential backoff with jitter)
            const delayMs = getBackoffDelay(attempt);
            logger.info(`Retrying after backoff`, {
              delayMs,
              attempt,
              nextAttempt: attempt + 1,
            });
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }

        if (!brushResult) {
          throw lastError || new Error("Brush generation failed with no result");
        }
      } catch (error) {
        console.error(`[ProcessRun] ✗ Generation failed:`, error);
        // If artist succeeded but brush failed, save the artist data
        if (artistResponse) {
          await runMutation(internal.generateBatch.failRunWithArtistData, {
            runId,
            artistStmt: artistResponse.statement,
            imagePrompt: artistResponse.imagePrompt,
            errorMessage: `Image generation failed after ${MAX_BRUSH_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`,
          });
          return;
        }
        // Otherwise, just fail
        throw error;
      }

      // 3️⃣ Upload to storage and get URL
      console.log(`[ProcessRun] Uploading to storage...`);
      const uploadUrl = await runMutation(api.generate.generateUploadUrl, {});

      // Convert base64 to Uint8Array
      const binaryString = atob(brushResult.imageB64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: bytes,
      });

      const { storageId } = (await uploadResponse.json()) as {
        storageId: string;
      };

      // Get the public URL for the image
      const imageUrl = await runMutation(api.runs.getStorageUrl, {
        // Convex storage ID type mismatch - cast required for API compatibility
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        storageId: storageId as any,
      });

      if (!imageUrl) {
        throw new Error("Failed to get storage URL");
      }

      console.log(`[ProcessRun] ✓ Uploaded to storage with URL`);

      // 4️⃣ Complete run
      await runMutation(internal.generateBatch.completeRun, {
        runId,
        artistStmt: artistResponse.statement,
        imagePrompt: artistResponse.imagePrompt,
        imageUrl,
        meta: {
          enqueuedAt: run.meta?.enqueuedAt,
          startedAt:
            Date.now() - artistResponse.metadata.latencyMs - brushLatency,
          completedAt: Date.now(),
          artist: artistResponse.metadata,
          brush: {
            latencyMs: brushLatency,
            metadata: brushResult.metadata,
          },
          totalLatencyMs: artistResponse.metadata.latencyMs + brushLatency,
        },
      });

      const totalDuration = perfMonitor.end({
        runId,
        artistSlug: run.artistSlug,
        brushSlug: run.brushSlug,
        status: "done",
      });

      logger.info(`Run complete`, {
        runId,
        totalDurationMs: totalDuration,
        artistDurationMs: artistResponse.metadata.latencyMs,
        brushDurationMs: brushLatency,
      });

      // 5️⃣ Schedule analysis (runs in Node.js environment, non-blocking)
      await runAction(internal.runAnalysis.analyzeRun, {
        runId,
        artistSlug: run.artistSlug,
        statement: artistResponse.statement,
        imageUrl,
      });
    } catch (error) {
      logger.error(
        `Run failed`,
        error instanceof Error ? error : new Error(String(error)),
        { runId, artistSlug: run.artistSlug }
      );

      // Update run with error details, preserving any artist/prompt data we got
      await runMutation(internal.generateBatch.failRun, {
        runId,
        errorMessage:
          error instanceof Error
            ? error.message
            : String(error) || "Unknown error occurred",
      });
    }
  }
);

/**
 * Internal mutation to get a run
 */
export const getRun = internalMutation(
  async ({ db }, { runId }: { runId: Id<"runs"> }) => {
    return await db.get(runId);
  }
);

/**
 * Internal mutation to update run status
 */
export const updateRunStatus = internalMutation(
  async ({ db }, { runId, status }: { runId: Id<"runs">; status: string }) => {
    await db.patch(runId, {
      status,
    });
  }
);

/**
 * Internal mutation to mark run as failed with error instanceof Error ? error.message : String(error)
 */
export const failRun = internalMutation(
  async (
    { db },
    { runId, errorMessage }: { runId: Id<"runs">; errorMessage: string }
  ) => {
    await db.patch(runId, {
      status: "failed",
      errorMessage,
    });
  }
);

/**
 * Internal mutation to mark run as failed but preserve artist data
 */
export const failRunWithArtistData = internalMutation(
  async (
    { db },
    {
      runId,
      artistStmt,
      imagePrompt,
      errorMessage,
    }: {
      runId: Id<"runs">;
      artistStmt: string;
      imagePrompt: string;
      errorMessage: string;
    }
  ) => {
    await db.patch(runId, {
      artistStmt,
      imagePrompt,
      status: "failed",
      errorMessage,
    });
  }
);

/**
 * Internal mutation to complete a run with all results
 */
export const completeRun = internalMutation(
  async (
    { db },
    {
      runId,
      artistStmt,
      imagePrompt,
      imageUrl,
      meta,
    }: {
      runId: Id<"runs">;
      artistStmt: string;
      imagePrompt: string;
      imageUrl: string;
      // Dynamic metadata object with varying structure from different artists/brushes
      meta: Record<string, unknown>;
    }
  ) => {
    await db.patch(runId, {
      artistStmt,
      imagePrompt,
      imageUrl,
      status: "done",
      meta,
    });
  }
);

/**
 * Internal mutation to save sentiment analysis
 */
export const saveSentiment = internalMutation(
  async (
    { db },
    {
      runId,
      sentiment,
    }: {
      runId: Id<"runs">;
      sentiment: SentimentAnalysis;
    }
  ) => {
    await db.insert("sentiment_analysis", {
      runId,
      artistSlug: sentiment.artistSlug,
      emotions: sentiment.emotions,
      valence: sentiment.valence,
      arousal: sentiment.arousal,
      wordCount: sentiment.wordCount,
      uniqueWords: sentiment.uniqueWords,
      abstractness: sentiment.abstractness,
      createdAt: Date.now(),
    });
  }
);

/**
 * Internal mutation to save color analysis
 */
export const saveColorAnalysis = internalMutation(
  async (
    { db },
    {
      runId,
      colorAnalysis,
    }: {
      runId: Id<"runs">;
      colorAnalysis: ColorAnalysis;
    }
  ) => {
    await db.insert("color_analysis", {
      runId,
      artistSlug: colorAnalysis.artistSlug,
      dominantColors: colorAnalysis.dominantColors,
      temperature: colorAnalysis.temperature,
      avgSaturation: colorAnalysis.saturation,
      harmony: colorAnalysis.colorHarmony,
      createdAt: Date.now(),
    });
  }
);

/**
 * Internal mutation to save materiality analysis
 */
export const saveMaterialityAnalysis = internalMutation(
  async (
    { db },
    {
      runId,
      materialityAnalysis,
    }: {
      runId: Id<"runs">;
      materialityAnalysis: MaterialityAnalysis;
    }
  ) => {
    // Extract just the material strings from MaterialClassification objects
    const materials = materialityAnalysis.materials.map((m) => m.material);

    await db.insert("materiality_analysis", {
      runId,
      artistSlug: materialityAnalysis.artistSlug,
      materials,
      concreteMaterials: materialityAnalysis.concreteMedia,
      speculativeMaterials: materialityAnalysis.speculativeMedia,
      impossibilityScore: materialityAnalysis.impossibilityScore,
      technicalDetail: materialityAnalysis.technicalDetail,
      createdAt: Date.now(),
    });
  }
);
