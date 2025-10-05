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

/**
 * Phase 2: Enqueue a batch of runs for multiple artists
 * Creates placeholder runs and schedules background actions to generate each one
 */
export const enqueueRunGroup = mutation(
  async (
    { db, scheduler },
    { promptVersion = "v2-neutral" }: { promptVersion?: string }
  ) => {
    const runGroupId = crypto.randomUUID();
    const brush = DEFAULT_BRUSH;

    console.log(
      `🎨 [EnqueueRunGroup] Creating run group ${runGroupId} with ${ARTISTS.length} artists`
    );

    const runIds: Id<"runs">[] = [];

    for (const artist of ARTISTS) {
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
      artistCount: ARTISTS.length,
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

      // 1️⃣ Artist imagines
      console.log(`[ProcessRun] Calling artist ${run.artistSlug}...`);
      const artistResponse = await artistAdapter.generateArtistResponse(
        SYSTEM_PROMPT,
        V2_NEUTRAL
      );
      console.log(
        `[ProcessRun] ✓ Artist complete in ${artistResponse.metadata.latencyMs}ms`
      );

      // 2️⃣ Brush paints
      console.log(`[ProcessRun] Calling brush ${run.brushSlug}...`);
      const startBrush = Date.now();
      const brushResult = await brush.generate(artistResponse.imagePrompt);
      const brushLatency = Date.now() - startBrush;
      console.log(`[ProcessRun] ✓ Brush complete in ${brushLatency}ms`);

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
    } catch (error: any) {
      console.error(`[ProcessRun] ✗ Run ${runId} failed:`, error.message);

      await runMutation(internal.generateBatch.updateRunStatus, {
        runId,
        status: "failed",
        errorMessage: error.message,
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
  async (
    { db },
    {
      runId,
      status,
      errorMessage,
    }: { runId: Id<"runs">; status: string; errorMessage?: string }
  ) => {
    await db.patch(runId, {
      status,
      meta: errorMessage ? { errorMessage } : undefined,
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
