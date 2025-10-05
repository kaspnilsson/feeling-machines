import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { V2_NEUTRAL, SYSTEM_PROMPT } from "./prompts";
import { ARTISTS, BRUSHES } from "./artists";
import { getBrush } from "./brushes";
import { getArtist } from "./artistAdapters";

export const generate = action(
  async ({
    runMutation,
  }): Promise<{ runGroupId: string; statement: string; storageId: string }> => {
    // Use first artist and brush as defaults
    const artist = ARTISTS[0];
    const brushConfig = BRUSHES[0];
    const brush = getBrush(brushConfig.slug);
    const runGroupId = crypto.randomUUID();
    const promptVersion = "v2-neutral";

    console.log(`[Generate] Starting new run ${runGroupId}`);
    console.log(`[Generate] Artist: ${artist.slug} (${artist.displayName})`);
    console.log(`[Generate] Brush: ${brush.slug} (${brush.displayName})`);

    try {
      // 1️⃣ Artist imagines
      console.log(`[Artist Step] Calling ${artist.slug}...`);
      const artistAdapter = getArtist(artist.slug);
      const artistResponse = await artistAdapter.generateArtistResponse(
        SYSTEM_PROMPT,
        V2_NEUTRAL
      );
      console.log(
        `[Artist Step] ✓ Complete in ${artistResponse.metadata.latencyMs}ms`
      );
      console.log(
        `[Artist Step] Statement length: ${artistResponse.statement.length} chars`
      );
      console.log(
        `[Artist Step] Image prompt: "${artistResponse.imagePrompt.substring(0, 100)}..."`
      );
      console.log(
        `[Artist Step] Cost estimate: $${artistResponse.metadata.costEstimate.toFixed(6)}`
      );

      // 2️⃣ Brush paints
      console.log(`[Brush Step] Calling ${brush.slug}...`);
      const startBrush = Date.now();
      const { imageB64, metadata } = await brush.generate(
        artistResponse.imagePrompt
      );
      const brushDuration = Date.now() - startBrush;
      console.log(`[Brush Step] ✓ Complete in ${brushDuration}ms`);
      console.log(`[Brush Step] Image size: ${imageB64.length} bytes`);

      // 3️⃣ Upload image to storage
      console.log(`[Storage Step] Uploading image to Convex storage...`);
      const uploadUrl = await runMutation(api.generate.generateUploadUrl, {});

      // Convert base64 to Uint8Array (Buffer not available in Convex)
      const binaryString = atob(imageB64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload the image
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        storageId: storageId as any,
      });

      if (!imageUrl) {
        throw new Error("Failed to get storage URL");
      }

      console.log(`[Storage Step] ✓ Uploaded to storage with URL`);

      // 4️⃣ Persist metadata (via mutation since actions can't write directly)
      console.log(`[Save Step] Persisting to database...`);
      await runMutation(api.generate.saveRun, {
        runGroupId,
        artistSlug: artist.slug,
        brushSlug: brush.slug,
        promptVersion,
        artistStmt: artistResponse.statement,
        imagePrompt: artistResponse.imagePrompt,
        imageUrl,
        status: "done",
        meta: {
          promptText: V2_NEUTRAL,
          artist: artistResponse.metadata,
          brush: {
            latencyMs: brushDuration,
            metadata,
          },
          totalDuration: artistResponse.metadata.latencyMs + brushDuration,
        },
        createdAt: Date.now(),
      });
      console.log(`[Save Step] ✓ Saved to database`);
      console.log(
        `[Generate] ✓ Complete! Total time: ${artistResponse.metadata.latencyMs + brushDuration}ms`
      );

      return {
        runGroupId,
        statement: artistResponse.statement,
        storageId,
      };
    } catch (error) {
      console.error(`[Generate] ✗ Error during generation:`, error);
      if (error instanceof Error) {
        console.error(`[Generate] Error name: ${error.name}`);
        console.error(`[Generate] Error message: ${error.message}`);
      }
      throw error;
    }
  }
);

// Mutation to generate upload URL for storage
export const generateUploadUrl = mutation(async ({ storage }) => {
  return await storage.generateUploadUrl();
});

// Mutation to save the run (called from the action)
// Uses dynamic args matching the runs table schema
export const saveRun = mutation(async ({ db }, args: {
  runGroupId: string;
  artistSlug: string;
  brushSlug: string;
  promptVersion: string;
  artistStmt: string;
  imagePrompt: string;
  imageUrl: string;
  status: string;
  meta: Record<string, unknown>;
  createdAt: number;
}) => {
  await db.insert("runs", args);
});
