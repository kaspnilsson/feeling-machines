import { mutation } from "./_generated/server";
import OpenAI from "openai";
import { V2_NEUTRAL } from "./prompts";
import { ARTISTS, BRUSH } from "./artists";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const generate = mutation(async ({ db }) => {
  const artist = ARTISTS[0]; // For now, use first Artist
  const runGroupId = crypto.randomUUID();
  const promptVersion = "v2-neutral";

  // 1️⃣ Artist imagines
  const { statement, imagePrompt } = await generateArtist(
    artist.slug,
    V2_NEUTRAL
  );

  // 2️⃣ Brush paints
  const { imageUrl } = await generateBrush(BRUSH.slug, imagePrompt);

  // 3️⃣ Persist
  await db.insert("runs", {
    runGroupId,
    artistSlug: artist.slug,
    brushSlug: BRUSH.slug,
    promptVersion,
    artistStmt: statement,
    imagePrompt,
    imageUrl,
    status: "done",
    meta: { promptText: V2_NEUTRAL }, // Store prompt for reproducibility
    createdAt: Date.now(),
  });

  return { runGroupId, statement, imageUrl };
});

// Helper functions (abstracted for Phase 2 reuse)
async function generateArtist(modelSlug: string, prompt: string) {
  const chat = await openai.chat.completions.create({
    model: modelSlug,
    messages: [
      { role: "system", content: "You are an imaginative visual artist." },
      { role: "user", content: prompt },
    ],
  });

  const text = chat.choices[0].message?.content ?? "";
  const statement =
    /===ARTIST STATEMENT===([\s\S]*?)===FINAL IMAGE PROMPT===/i
      .exec(text)?.[1]
      ?.trim() ?? "";
  const imagePrompt =
    /===FINAL IMAGE PROMPT===([\s\S]*)$/i.exec(text)?.[1]?.trim() ?? "";

  return { statement, imagePrompt };
}

async function generateBrush(modelSlug: string, imagePrompt: string) {
  const img = await openai.images.generate({
    model: modelSlug,
    prompt: imagePrompt,
    size: "1024x1024",
  });

  return { imageUrl: img.data[0].url! };
}
