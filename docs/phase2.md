# Phase 2 — "The Chorus of Artists"

**Goal:** Run multiple Artists (LLMs) with the same Brush and identical prompt,
compare outputs, and visualize their differences.

**Core idea:** Keep the Brush constant to isolate the Artists' conceptual
differences.

---

## 🎨 Overview

Phase 2 transforms the single Artist/Brush pipeline into a multi-Artist
comparison system. Instead of generating one artwork, we'll orchestrate multiple
LLMs responding to the same creative prompt, then compare how their
"personalities" manifest through different artistic visions.

---

## 🧩 Key Design Changes from Phase 1

| Concern                  | Phase 1 State                       | Phase 2 Requirement                                              | Phase 1 Adjustment                            |
| ------------------------ | ----------------------------------- | ---------------------------------------------------------------- | --------------------------------------------- |
| Artist multiplicity      | One hard-coded Artist (gpt-4o-mini) | Dynamic list of Artists, selectable or batched                   | Parametrize artist slug + config              |
| Generation orchestration | One sync Convex mutation            | Multi-Artist fan-out (parallel or queued)                        | Plan async queue / "enqueue run" mutation now |
| Data schema              | Single runs table                   | Same table but add `runGroupId` to link sets of runs             | Add column now                                |
| Prompt                   | Single fixed prompt                 | Reuse canonical prompt across Artists                            | Store prompt text in DB or as constant        |
| Config management        | Implicit                            | Central registry of Artist metadata (slug, provider, model name) | Create `/data/artists.ts` or `artists.ts`     |
| Cost / rate control      | Not tracked                         | Sequentialized or throttled generation                           | Add lightweight rate limiter or queue         |
| Gallery                  | Displays individual runs            | Add "compare view" grouped by `runGroupId`                       | Structure data & UI accordingly               |

---

## 🧠 Architectural Diagram (Phase 2 Target)

```
+-------------+
|  Frontend   |
| (Next.js)   |
+-------------+
       |
       v
  enqueueRunGroup( promptVersion )
       |
       v
+-----------------------+
|  Convex Worker Layer  |
|-----------------------|
|  For each Artist in registry:      |
|   1. generateArtist() → statement  |
|   2. generateBrush() → image       |
|   3. insert run(record)            |
+-----------------------+
       |
       v
     Convex DB
       |
       v
    Gallery UI
   (Compare Grid)
```

---

## ⚙️ New Concepts Introduced

### 1️⃣ Artist Registry (`convex/artists.ts`)

```ts
export const ARTISTS = [
  {
    slug: "gpt-4o-mini",
    provider: "openai",
    displayName: "GPT-4o Mini",
  },
  {
    slug: "claude-3-opus",
    provider: "anthropic",
    displayName: "Claude 3 Opus",
  },
  {
    slug: "gemini-1.5-pro",
    provider: "google",
    displayName: "Gemini 1.5 Pro",
  },
  {
    slug: "mistral-large",
    provider: "mistral",
    displayName: "Mistral Large",
  },
];
```

Each entry may later include:

```ts
{
  temperature: 0.7,
  apiKeyEnv: "OPENROUTER_KEY",
  maxTokens: 1000
}
```

**Phase 1 action:** Import this list now, even if it contains only one Artist.

---

### 2️⃣ Run Groups

You'll eventually launch one prompt set across multiple Artists. Introduce
`runGroupId` now:

```ts
runs: defineTable({
  runGroupId: v.string(), // e.g. uuid for one "experiment batch"
  artistSlug: v.string(),
  brushSlug: v.string(),
  promptVersion: v.string(),
  artistStmt: v.string(),
  imagePrompt: v.string(),
  imageUrl: v.string(),
  status: v.string(), // "queued" | "generating" | "done" | "failed"
  meta: v.optional(v.any()), // JSON for model params, cost, latency
  createdAt: v.number(),
});
```

Generate a new UUID per batch and reuse it for all Artists. That way, the
gallery can filter by group later.

---

### 3️⃣ Generation Flow

```
enqueueRunGroup(promptVersion)
  → creates a runGroupId
  → enqueues one generateSingleRun mutation per Artist in ARTISTS
```

Pseudo-flow:

```ts
export const enqueueRunGroup = mutation(async ({ db, scheduler }) => {
  const runGroupId = crypto.randomUUID();

  for (const artist of ARTISTS) {
    const runId = await db.insert("runs", {
      runGroupId,
      artistSlug: artist.slug,
      brushSlug: "dall-e-3",
      promptVersion: "v2-neutral",
      status: "queued",
      createdAt: Date.now(),
    });

    // trigger background generation
    await scheduler.runAfter(0, "generateSingleRun", {
      runId,
      artistSlug: artist.slug,
    });
  }

  return runGroupId;
});
```

This prepares you for asynchronous fan-out without rewriting your schema later.

---

### 4️⃣ Compare View (Phase 2 UI Spec)

Minimal additions to gallery:

- **Group by `runGroupId`**
- Show 3–5 columns = Artists, 1 row = same prompt
- Labels under each image: `Artist Name → Brush Name`
- Click to see full artist statement + metadata

For now, Phase 1 just stores `runGroupId` — you'll implement the compare UI
later.

---

## 🔧 Phase 1 Adjustments to Make Now

### ✅ 1. Add these fields now

- `runGroupId` (string)
- `status` ("queued" | "generating" | "done" | "failed")
- `meta` (JSON for model params, cost estimate, latency)

### ✅ 2. Use centralized Artist registry (even with one)

Don't hard-code `"gpt-4o-mini"` in the mutation. Import from `ARTISTS[0]`. Later
you just loop instead of refactoring.

### ✅ 3. Store prompt text, not file path

When you create the run, insert the actual prompt text as part of metadata or
its SHA hash. Convex deploys are isolated from your filesystem, so this prevents
breakage later.

### ✅ 4. Abstract generation stages

Structure your mutation like:

```ts
const { statement, imagePrompt } = await generateArtist(
  artistSlug,
  canonicalPrompt
);
const { imageUrl } = await generateBrush(brushSlug, imagePrompt);
```

Even if both live in one file today, that separation makes Phase 2's loop
trivial.

### ✅ 5. Plan for async / queued execution

Convex supports `runAfter` for scheduling — build your generation function
idempotently so it can be queued or retried.

### ✅ 6. Think about cost & retry

Capture API latency and $ estimate in `meta`, so when you batch Artists later,
you can display runtime stats.

---

## 🧭 Example of Phase 1 Mutation Adjusted for Phase 2

```ts
import { mutation } from "./_generated/server";
import { ARTISTS } from "./artists";
import { V2_NEUTRAL } from "./prompts";

const BRUSH = { slug: "dall-e-3" };

export const generate = mutation(async ({ db }) => {
  const artist = ARTISTS[0]; // For now, just use the first one
  const runGroupId = crypto.randomUUID();
  const promptVersion = "v2-neutral";

  const { statement, imagePrompt } = await generateArtist(
    artist.slug,
    V2_NEUTRAL
  );
  const { imageUrl } = await generateBrush(BRUSH.slug, imagePrompt);

  await db.insert("runs", {
    runGroupId,
    artistSlug: artist.slug,
    brushSlug: BRUSH.slug,
    promptVersion,
    artistStmt: statement,
    imagePrompt,
    imageUrl,
    status: "done",
    createdAt: Date.now(),
  });

  return { runGroupId, statement, imageUrl };
});

// Helper functions (same file for now)
async function generateArtist(slug: string, prompt: string) {
  const chat = await openai.chat.completions.create({
    model: slug,
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

async function generateBrush(slug: string, prompt: string) {
  const img = await openai.images.generate({
    model: slug,
    prompt,
    size: "1024x1024",
  });
  return { imageUrl: img.data[0].url! };
}
```

Now Phase 2 just loops over multiple Artists.

---

## 🧾 TL;DR Checklist — What to Build in Phase 1 for Phase 2 Compatibility

- [ ] Add `runGroupId`, `status`, and `meta` columns to schema
- [ ] Create `convex/artists.ts` registry file
- [ ] Refactor mutation into `generateArtist()` + `generateBrush()` helpers
- [ ] Insert actual prompt text or hash into DB (in `meta`)
- [ ] Structure mutation so it can be called per Artist later
- [ ] Keep Brush constant (`dall-e-3`) for now
- [ ] Optional: add a `enqueueRunGroup()` stub to future-proof fan-out logic

---

## 🌈 Conceptual Framing

- **Phase 1 proves the pipeline.**
- **Phase 2 introduces the ensemble.**

Your Artist → Brush → RunGroup abstraction is now solid; nothing else changes
later except how many Artists you feed into it.

---

## 🎯 Phase 2 Implementation (Future Weekend)

When you're ready to build Phase 2:

1. **Add more Artists to registry** (Claude, Gemini, Mistral via OpenRouter)
2. **Build `enqueueRunGroup()` mutation** that creates runs for all Artists
3. **Add compare view UI** that groups by `runGroupId`
4. **Add cost/latency tracking** in the `meta` field
5. **Implement throttling/queuing** if rate limits become an issue

The schema and structure from Phase 1 will support all of this without changes.

---

**End of Phase 2 Design.** **Next:** Update Phase 1 with these schema changes.
