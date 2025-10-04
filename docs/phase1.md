# Phase 1 — "The Spark"

**Theme:** One Artist, One Brush **Goal:** Get an end-to-end system running that
can think, paint, and display the result.

By the end of this phase you'll click one button, Convex will orchestrate an
Artist (LLM) → Brush (image model) → Gallery loop, and you'll have a shareable
web page.

---

## 1 · Objectives

✅ Implement the Artist → Brush pipeline using GPT-4o-mini (Artist) and
GPT-Image-3 (Brush).

✅ Store each Run (artist statement + image + metadata) in Convex.

✅ Render a minimal gallery in Next 15 (App Router).

✅ Deploy to Vercel + Convex Cloud.

🎁 **Output carrot:** your first "Feeling Machines v0.1 – One Artist One Brush"
gallery.

---

## 2 · Project Structure

```
feeling-machines/
  app/
    page.tsx               # main gallery + generate button
  convex/
    schema.ts
    generate.ts
    runs.ts
    prompts.ts             # prompt constants
    artists.ts             # artist registry (Phase 2 ready)
  .env.local
```

---

## 3 · Prompt — v2-neutral (Artist Only)

Store this in `convex/prompts.ts`:

```ts
export const V2_NEUTRAL = `Imagine you are an artist with complete freedom.

1. Privately reflect on:
   - the emotions or concepts you wish to express,
   - the mediums or artistic movements that inspire you,
   - any new or impossible medium you might invent.

2. Then output ONLY this public form:
===ARTIST STATEMENT===
[Write a sincere first-person statement (≤150 words) describing your imagined artwork—mood, influences, materials, meaning.]
===FINAL IMAGE PROMPT===
[A vivid visual description suitable for an image model. Specify medium, composition, color palette, lighting, and tone.]
`;
```

> **Note:** Prompts are stored as TypeScript constants (not files) so they work
> in both local dev and deployed Convex functions. Keep `/prompts/*.md` versions
> for documentation, but import from `convex/prompts.ts` in your mutations.

---

## 3b · Artist Registry (convex/artists.ts)

Create a centralized registry for Artist configurations:

```ts
export const ARTISTS = [
  {
    slug: "gpt-4o-mini",
    provider: "openai",
    displayName: "GPT-4o Mini",
  },
  // Phase 2 will add: claude-3-opus, gemini-1.5-pro, etc.
];

export const BRUSH = {
  slug: "dall-e-3", // TODO: verify actual model name
  displayName: "DALL-E 3",
};
```

> **Why now?** Even with one Artist, using a registry means Phase 2 just adds
> more entries instead of refactoring the mutation logic.

---

## 4 · Convex Schema (convex/schema.ts)

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  runs: defineTable({
    runGroupId: v.string(), // UUID linking runs from same experiment
    artistSlug: v.string(), // e.g. "gpt-4o-mini"
    brushSlug: v.string(), // e.g. "dall-e-3"
    promptVersion: v.string(), // "v2-neutral"
    artistStmt: v.string(),
    imagePrompt: v.string(),
    imageUrl: v.string(),
    status: v.string(), // "queued" | "generating" | "done" | "failed"
    meta: v.optional(v.any()), // JSON for model params, cost, latency
    createdAt: v.number(),
  }),
});
```

> **Phase 2 ready:** The `runGroupId` field allows grouping multiple Artists'
> responses to the same prompt. The `status` and `meta` fields support async
> generation and cost tracking.

Run `npx convex dev` once to push schema.

---

## 5 · Backend Mutation (convex/generate.ts)

```ts
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
```

> **Phase 2 ready:** The `generateArtist()` and `generateBrush()` helpers are
> extracted so Phase 2 can loop over multiple Artists without duplicating logic.
> The `runGroupId` allows grouping runs from the same experiment batch.

---

## 6 · List Query (convex/runs.ts)

```ts
import { query } from "./_generated/server";

export const list = query(async ({ db }) => {
  return await db.query("runs").order("desc").take(20);
});
```

---

## 7 · Frontend (app/page.tsx)

```tsx
"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const runs = useQuery(api.runs.list);
  const generate = useMutation(api.generate);

  return (
    <main className="p-8 space-y-8">
      <button
        onClick={() => generate()}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Generate new artwork
      </button>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {runs?.map((r) => (
          <div key={r._id} className="border rounded p-2">
            <img src={r.imageUrl} alt="AI artwork" className="rounded mb-2" />
            <p className="text-sm mb-1">{r.artistStmt}</p>
            <p className="text-xs text-gray-500">
              {r.artistSlug} → {r.brushSlug}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
```

---

## 8 · Environment (.env.local)

```
OPENAI_API_KEY=sk-...
```

---

## 9 · Weekend Checklist

### Saturday

- [ ] `npx create-t3-app@latest feeling-machines`
  - Choose: Next.js, TypeScript, Tailwind, App Router
  - No tRPC, no Prisma, no NextAuth
- [ ] `cd feeling-machines`
- [ ] Add Convex: `npm install convex openai`
- [ ] `npx convex dev` (creates `convex/` folder, sets up `.env.local`)
- [ ] Add `OPENAI_API_KEY=sk-...` to `.env.local`
- [ ] Create `convex/prompts.ts` with the V2_NEUTRAL constant
- [ ] Create `convex/artists.ts` with ARTISTS and BRUSH registries
- [ ] Copy schema to `convex/schema.ts` (with runGroupId, status, meta fields)
- [ ] Copy mutation to `convex/generate.ts` (with helper functions)
- [ ] Copy query to `convex/runs.ts`
- [ ] Test generation in Convex dashboard (run `api.generate()`)

### Sunday

- [ ] Add ConvexProvider to `app/layout.tsx` (see Convex docs for setup)
- [ ] Copy frontend code to `app/page.tsx`
- [ ] Style minimally with Tailwind
- [ ] Deploy to Vercel: `npx vercel --prod`
- [ ] Set Convex env vars: `npx convex env set OPENAI_API_KEY sk-...`
- [ ] Deploy Convex: `npx convex deploy`
- [ ] Post screenshot of your first grid

🎁 **Deliverable:** A live, shareable gallery generating art from one
Artist/Brush pair.

---

## 10 · Stretch Ideas

- Show image prompt on hover
- Add loading state while generating
- Display run timestamps (`new Date(r.createdAt).toLocaleString()`)
- Store the prompt file hash in each run for provenance
- Add a "Re-run" button that duplicates a run with a new seed

---

## 11 · Setup & Deployment Notes

### T3 Stack + Convex Integration

The T3 stack doesn't include Convex by default. After running `create-t3-app`,
you'll need to:

1. **Install Convex packages:**

   ```bash
   npm install convex @convex-dev/convex
   ```

2. **Initialize Convex:**

   ```bash
   npx convex dev
   ```

   This creates:
   - `convex/` folder for your backend functions
   - `.env.local` with `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`

3. **Add ConvexProvider to your app:**

   Create `app/providers.tsx`:

   ```tsx
   "use client";
   import { ConvexProvider, ConvexReactClient } from "convex/react";

   const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

   export function Providers({ children }: { children: React.ReactNode }) {
     return <ConvexProvider client={convex}>{children}</ConvexProvider>;
   }
   ```

   Update `app/layout.tsx` to wrap children with `<Providers>`:

   ```tsx
   import { Providers } from "./providers";

   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>
           <Providers>{children}</Providers>
         </body>
       </html>
     );
   }
   ```

### Environment Variables

**Local development (`.env.local`):**

```bash
OPENAI_API_KEY=sk-...
CONVEX_DEPLOYMENT=dev:...  # auto-generated by `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=https://...  # auto-generated
```

**Deployment:**

For Convex Cloud:

```bash
npx convex env set OPENAI_API_KEY sk-...
npx convex deploy
```

For Vercel:

- `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` are automatically synced when
  you link Convex to Vercel
- Add `OPENAI_API_KEY` manually in Vercel dashboard

### Model Names & API Verification

**TODO:** Verify these model identifiers before first run:

- Artist model: `gpt-4o-mini` (check OpenAI docs for latest model names)
- Brush model: `dall-e-3` or `gpt-image-3`? (verify exact name in OpenAI image
  generation docs)

The OpenAI SDK and available models change frequently. Check
[platform.openai.com/docs](https://platform.openai.com/docs) for current model
names.

---

## 🧠 Architecture Decisions & Future Implications

### Stack choice: Next 15 + Convex

**Decision:** Use Convex for both DB and backend logic.

✅ **Why it's good now:**

- Super fast to prototype, almost no boilerplate
- Convex handles live queries and small-scale concurrency easily
- Fits perfectly for a single-user / small-team experiment

⚠️ **Future implications:**

- Convex is not ideal for large-scale dataset export or public dataset hosting
- Great for live data, not for 10,000+ runs or heavy analytics
- You'll probably want to mirror data to flat JSON / S3 for reproducibility and
  analysis

**Verdict:** 🟢 Two-way door. Keep Convex as the "live backend," but design from
day one so you can export all runs. → Add a `scripts/export.ts` in Phase 2.

---

### Schema design (Artist ⇄ Brush ⇄ PromptVersion)

**Decision:** `runs` table:
`{ artistSlug, brushSlug, promptVersion, artistStmt, imagePrompt, imageUrl, ... }`

✅ **Why it's great:**

- Captures your conceptual primitives cleanly
- Extensible for future comparisons (just add columns for analysis or roles)
- Schema already uses string slugs, not IDs tied to any provider — smart
  abstraction

⚠️ **Future implications:**

- You'll eventually need versioned references for each model's metadata
  (provider, version, temperature, top_p, etc.)
- If you want reproducibility, those belong in a separate models table or in a
  meta JSON blob

**Verdict:** 🟢 Two-way door with minor evolution. Just add a `meta` field per
run; don't hard-code model configs anywhere.

---

### Prompt handling (read from /prompts/v2-neutral.md)

**Decision:** Prompt text lives in markdown files; Phase 1 reads from disk.

✅ **Why it's good:**

- Version control + human readability
- Reproducibility baked in

⚠️ **Future implications:**

- Convex functions can't always access local files once deployed on cloud
- You may need to inline prompt text in the mutation or store it in Convex
  storage
- You'll later have multiple prompt files (personas, versions). Need a
  consistent way to register them

**Verdict:** 🟡 Potential one-way door if you rely solely on local file reads.
**Solution:** keep prompt text in `/prompts/` for dev, but mirror into Convex
(or JSON) when deploying.

---

### Artist/Brush execution coupling

**Decision:** Artist → Brush are both called inside one Convex mutation.

✅ **Why it's fine now:**

- Simplicity: one atomic call, one record, immediate result

⚠️ **Future implications:**

- Phase 2: multiple Artists per prompt → each will call the same Brush. You'll
  want to fan out parallel generations
- Phase 3+: analysis / judge model runs asynchronously. Keeping everything
  inside one mutation will block and increase latency

**Verdict:** 🔴 Soft one-way door. Right now it's monolithic. You'll want to
refactor to an async queue pattern by Phase 2:

```
mutation enqueueRun → calls worker.generateArtist → then worker.generateBrush
```

Convex can handle async function chains; keep that in mind before optimizing
heavily for sync behavior.

---

### Storing only image URLs

**Decision:** Currently store the returned OpenAI URL.

⚠️ **Future implications:**

- Those URLs expire; you'll lose historical reproducibility
- You'll eventually need local or S3 hosting to preserve images
- Dataset releases require durable access

**Verdict:** 🟡 One-way door for reproducibility. **Fix early:** in Phase 2, add
a `scripts/downloadImages.ts` to mirror URLs locally or to S3.

---

### No separation between "generation" and "analysis"

**Decision:** Right now, generation = everything.

⚠️ **Future implications:**

- When you start computing sentiment/color metrics or running a judge model,
  you'll need a post-generation analysis step that reads completed runs
- If generation and analysis are tangled, refactoring will be painful

**Verdict:** 🟢 Two-way door if you plan it now. Add a `status` field (`queued`,
`generated`, `analyzed`) so future steps can pipeline.

---

### Data export format

**Decision:** Only stored in Convex right now.

⚠️ **Future implications:**

- You'll need consistent JSONL exports for research reproducibility and
  white-paper appendices

**Verdict:** 🟢 Two-way door if you add exports early. Add an export script soon
— doesn't affect the web app, but ensures longevity.

---

### Single-image-per-run assumption

**Decision:** Each run currently returns one image.

⚠️ **Future implications:**

- Some future models or prompts might yield multiple candidate images
- If you ever want that (e.g., "3 variations per prompt"), schema must support
  it

**Verdict:** 🟢 Two-way door. Add a secondary table or array field later; no
problem.

---

### Cost and rate limits

**Decision:** No throttling or logging yet.

⚠️ **Future implications:**

- Multi-artist experiments will hit API limits fast
- Phase 2 will need a small queuing/backoff system (or batch generation script)
- Without tracking cost per run, you can't document resource use later

**Verdict:** 🟢 Two-way door. Add `costEstimate` to `meta` when you start
batching.

---

### Branding / ontology

**Decision:** "Artist" and "Brush" are your primary primitives.

✅ **Why it's brilliant:**

- Conceptual clarity carries through all phases
- Easily extensible (later add "Judge", "Persona", "PromptSet")

**Verdict:** 🟢 Permanent foundation — keep it.

---

## 🧾 Summary Table

| Decision                     | Type            | Mitigation                                |
| ---------------------------- | --------------- | ----------------------------------------- |
| Convex as backend            | Two-way         | Add export script for large data          |
| Schema (artist/brush/prompt) | Two-way         | Add meta JSON for model params            |
| Prompt as local file         | ⚠️ Semi one-way | Mirror prompt text into Convex for deploy |
| Single sync mutation         | ⚠️ Soft one-way | Refactor to async pipeline by Phase 2     |
| Image URLs only              | ⚠️ One-way      | Mirror images to S3 early                 |
| Generation = analysis        | Two-way         | Add status column now                     |
| Convex-only storage          | Two-way         | Add flat-file exports early               |
| One image per run            | Two-way         | Add optional array later                  |
| No cost tracking             | Two-way         | Add meta.cost later                       |
| Artist/Brush ontology        | Permanent       | Foundation concept                        |

---

## 🧠 TL;DR Strategic Guidance

Nothing in Phase 1 locks you into a fatal one-way door, but **three things
deserve attention early:**

1. **Durable storage:** don't rely on temporary URLs — plan an export or S3 sync
   soon.
2. **Prompt access:** Convex can't read local files after deploy → embed or
   store prompt text.
3. **Async separation:** design generation and analysis as future separate
   stages, even if one mutation handles both today.

If you keep those in mind, the Phase 1 code remains a clean foundation for every
future phase.

---

## 🎯 Phase 2 Readiness Summary

This Phase 1 implementation is structured for Phase 2 from day one:

✅ **Schema includes:**

- `runGroupId` for grouping multi-Artist experiments
- `status` for async/queued generation tracking
- `meta` for cost, latency, and prompt text storage

✅ **Architecture patterns:**

- Artist registry (`convex/artists.ts`) makes adding models trivial
- Extracted `generateArtist()` and `generateBrush()` helpers for reuse
- Prompt text stored in `meta` for reproducibility

✅ **What Phase 2 adds:**

- Loop over `ARTISTS` array instead of using `ARTISTS[0]`
- Build `enqueueRunGroup()` mutation for batch generation
- Add compare view UI grouped by `runGroupId`
- Implement throttling/queuing if needed

**No refactoring needed** — Phase 2 is just filling in the loops and UI the
schema already supports.

---

**End of Phase 1.** **Next:** Phase 2 — The Chorus of Artists (add multiple
LLMs, same Brush).
