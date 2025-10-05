import {
  mutation,
  internalAction,
  internalMutation,
} from "./_generated/server";
import { internal, api } from "./_generated/api";
import { ARTISTS, DEFAULT_BRUSH } from "./artists";
import { getArtist } from "./artistAdapters";
import { getBrush } from "./brushes";
import { SYSTEM_PROMPT, V2_NEUTRAL } from "./prompts";
import { Id } from "./_generated/dataModel";
import { analyzeSentiment } from "../scripts/analyze-sentiment";

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
    }: {
      promptVersion?: string;
      artistSlugs?: string[];
      brushSlug?: string;
    }
  ) => {
    const runGroupId = crypto.randomUUID();

    // Use provided slugs or defaults
    const selectedArtists = artistSlugs
      ? ARTISTS.filter((a) => artistSlugs.includes(a.slug))
      : ARTISTS;
    const brush = brushSlug
      ? { slug: brushSlug }
      : DEFAULT_BRUSH;

    console.log(
      `🎨 [EnqueueRunGroup] Creating run group ${runGroupId} with ${selectedArtists.length} artists`
    );

    const runIds: Id<"runs">[] = [];

    for (const artist of selectedArtists) {
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
        },
        createdAt: Date.now(),
      });

      runIds.push(runId);

      console.log(`  → Queued run ${runId} for ${artist.slug} + ${brush.slug}`);

      // Schedule background action to process this run
      await scheduler.runAfter(0, internal.generateBatch.processSingleRun, {
        runId,
      });
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
  async ({ runMutation }, { runId }: { runId: Id<"runs"> }) => {
    console.log(`[ProcessRun] Starting run ${runId}`);

    // Get run details
    const run = await runMutation(internal.generateBatch.getRun, { runId });

    if (!run) {
      console.error(`[ProcessRun] ✗ Run ${runId} not found`);
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

      try {
        // 1️⃣ Artist imagines
        console.log(`[ProcessRun] Calling artist ${run.artistSlug}...`);
        artistResponse = await artistAdapter.generateArtistResponse(
          SYSTEM_PROMPT,
          V2_NEUTRAL
        );
        console.log(
          `[ProcessRun] ✓ Artist complete in ${artistResponse.metadata.latencyMs}ms`
        );

        // 2️⃣ Brush paints
        console.log(`[ProcessRun] Calling brush ${run.brushSlug}...`);
        const startBrush = Date.now();
        brushResult = await brush.generate(artistResponse.imagePrompt);
        brushLatency = Date.now() - startBrush;
        console.log(`[ProcessRun] ✓ Brush complete in ${brushLatency}ms`);
      } catch (error: any) {
        // If artist succeeded but brush failed, save the artist data
        if (artistResponse) {
          await runMutation(internal.generateBatch.failRunWithArtistData, {
            runId,
            artistStmt: artistResponse.statement,
            imagePrompt: artistResponse.imagePrompt,
            errorMessage: `Image generation failed: ${error.message}`,
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

      console.log(
        `[ProcessRun] ✓ Run ${runId} complete! Total: ${artistResponse.metadata.latencyMs + brushLatency}ms`
      );

      // 5️⃣ Analyze sentiment (async, don't block completion)
      try {
        console.log(`[ProcessRun] Analyzing sentiment for run ${runId}...`);
        const sentiment = await analyzeSentiment({
          runId,
          artistSlug: run.artistSlug,
          statement: artistResponse.statement,
        });

        await runMutation(internal.generateBatch.saveSentiment, {
          runId,
          sentiment,
        });

        console.log(`[ProcessRun] ✓ Sentiment analysis complete`);
      } catch (error: any) {
        console.error(
          `[ProcessRun] ⚠ Sentiment analysis failed (non-fatal): ${error.message}`
        );
        // Don't fail the run if sentiment analysis fails
      }
    } catch (error: any) {
      console.error(`[ProcessRun] ✗ Run ${runId} failed:`, error.message);

      // Update run with error details, preserving any artist/prompt data we got
      await runMutation(internal.generateBatch.failRun, {
        runId,
        errorMessage: error.message || "Unknown error occurred",
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
 * Internal mutation to mark run as failed with error message
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
      meta: any;
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
      sentiment: any;
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
