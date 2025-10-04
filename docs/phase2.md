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

## 📦 Multi-Provider Support Strategy

### Provider Abstraction Layer

Similar to the Brush OOP pattern, we'll create an Artist adapter:

```ts
// convex/artistAdapters.ts
export abstract class ArtistAdapter {
  constructor(
    public readonly slug: string,
    public readonly displayName: string,
    public readonly provider: string
  ) {}

  abstract generateArtistResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<ArtistResponse>;
}

export interface ArtistResponse {
  fullText: string;
  statement: string;
  imagePrompt: string;
  metadata?: {
    model: string;
    tokens?: number;
    latencyMs: number;
    costEstimate?: number;
  };
}

// OpenAI implementation
export class OpenAIArtist extends ArtistAdapter {
  async generateArtistResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<ArtistResponse> {
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: this.slug,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const fullText = response.choices[0].message?.content ?? "";
    const { statement, imagePrompt } = parseArtistOutput(fullText);

    return {
      fullText,
      statement,
      imagePrompt,
      metadata: {
        model: this.slug,
        tokens: response.usage?.total_tokens,
        latencyMs: Date.now() - startTime,
        costEstimate: estimateOpenAICost(this.slug, response.usage),
      },
    };
  }
}

// Anthropic implementation
export class AnthropicArtist extends ArtistAdapter {
  async generateArtistResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<ArtistResponse> {
    const startTime = Date.now();
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: this.slug, // "claude-3-opus-20240229"
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      max_tokens: 1000,
    });

    const fullText = response.content[0].text;
    const { statement, imagePrompt } = parseArtistOutput(fullText);

    return {
      fullText,
      statement,
      imagePrompt,
      metadata: {
        model: this.slug,
        tokens: response.usage.input_tokens + response.usage.output_tokens,
        latencyMs: Date.now() - startTime,
        costEstimate: estimateAnthropicCost(this.slug, response.usage),
      },
    };
  }
}

// OpenRouter implementation (for Gemini, Mistral, etc.)
export class OpenRouterArtist extends ArtistAdapter {
  async generateArtistResponse(
    systemPrompt: string,
    userPrompt: string
  ): Promise<ArtistResponse> {
    const startTime = Date.now();
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.slug, // "google/gemini-pro-1.5"
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    const data = await response.json();
    const fullText = data.choices[0].message.content;
    const { statement, imagePrompt } = parseArtistOutput(fullText);

    return {
      fullText,
      statement,
      imagePrompt,
      metadata: {
        model: this.slug,
        tokens: data.usage?.total_tokens,
        latencyMs: Date.now() - startTime,
        costEstimate: data.usage?.total_cost, // OpenRouter provides this
      },
    };
  }
}

// Registry with factory pattern
const ARTIST_REGISTRY: Record<string, ArtistAdapter> = {
  "gpt-4o-mini": new OpenAIArtist("gpt-4o-mini", "GPT-4o Mini", "openai"),
  "claude-3-opus-20240229": new AnthropicArtist(
    "claude-3-opus-20240229",
    "Claude 3 Opus",
    "anthropic"
  ),
  "google/gemini-pro-1.5": new OpenRouterArtist(
    "google/gemini-pro-1.5",
    "Gemini Pro 1.5",
    "openrouter"
  ),
  "mistralai/mistral-large": new OpenRouterArtist(
    "mistralai/mistral-large",
    "Mistral Large",
    "openrouter"
  ),
};

export function getArtist(slug: string): ArtistAdapter {
  const artist = ARTIST_REGISTRY[slug];
  if (!artist) throw new Error(`Unknown artist: ${slug}`);
  return artist;
}
```

### Cost Estimation Helpers

```ts
// convex/costEstimation.ts
export function estimateOpenAICost(
  model: string,
  usage: { prompt_tokens: number; completion_tokens: number }
): number {
  const prices = {
    "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
    "gpt-4o": { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
  };

  const price = prices[model] || prices["gpt-4o-mini"];
  return (
    usage.prompt_tokens * price.input + usage.completion_tokens * price.output
  );
}

export function estimateAnthropicCost(
  model: string,
  usage: { input_tokens: number; output_tokens: number }
): number {
  const prices = {
    "claude-3-opus-20240229": { input: 15 / 1_000_000, output: 75 / 1_000_000 },
    "claude-3-sonnet-20240229": {
      input: 3 / 1_000_000,
      output: 15 / 1_000_000,
    },
  };

  const price = prices[model] || prices["claude-3-sonnet-20240229"];
  return usage.input_tokens * price.input + usage.output_tokens * price.output;
}
```

---

## 🔄 Queue Architecture & Scheduling

### Option A: Convex Scheduler (Recommended)

Use Convex's built-in scheduler for async fan-out:

```ts
// convex/generateBatch.ts
export const enqueueRunGroup = mutation(
  async ({ db, scheduler }, { promptVersion }: { promptVersion: string }) => {
    const runGroupId = crypto.randomUUID();
    const artists = ARTISTS; // From registry

    console.log(
      `🎨 Enqueueing run group ${runGroupId} with ${artists.length} artists`
    );

    for (const artist of artists) {
      // Create placeholder run
      const runId = await db.insert("runs", {
        runGroupId,
        artistSlug: artist.slug,
        brushSlug: DEFAULT_BRUSH.slug,
        promptVersion,
        artistStmt: "",
        imagePrompt: "",
        imageStorageId: undefined as any,
        status: "queued",
        meta: { enqueuedAt: Date.now() },
        createdAt: Date.now(),
      });

      // Schedule background action
      await scheduler.runAfter(0, internal.generateSingle.run, {
        runId,
      });
    }

    return { runGroupId, artistCount: artists.length };
  }
);
```

```ts
// convex/generateSingle.ts
export const run = internalAction(
  async ({ runMutation }, { runId }: { runId: Id<"runs"> }) => {
    const runDoc = await runMutation(internal.generateSingle.getRun, { runId });

    if (!runDoc) {
      console.error(`❌ Run ${runId} not found`);
      return;
    }

    try {
      // Update status to generating
      await runMutation(internal.generateSingle.updateStatus, {
        runId,
        status: "generating",
      });

      const artist = getArtist(runDoc.artistSlug);
      const brush = getBrush(runDoc.brushSlug);

      // 1. Artist imagines
      const artistResponse = await artist.generateArtistResponse(
        SYSTEM_PROMPT,
        V2_NEUTRAL
      );

      // 2. Brush paints
      const brushResult = await brush.generate(artistResponse.imagePrompt);

      // 3. Upload to storage
      const uploadUrl = await runMutation(api.generate.generateUploadUrl, {});
      const storageId = await uploadBase64Image(
        uploadUrl,
        brushResult.imageB64
      );

      // 4. Update run with results
      await runMutation(internal.generateSingle.completeRun, {
        runId,
        artistStmt: artistResponse.statement,
        imagePrompt: artistResponse.imagePrompt,
        imageStorageId: storageId,
        meta: {
          artist: artistResponse.metadata,
          brush: brushResult.metadata,
        },
      });

      console.log(
        `✓ Completed run ${runId} (${runDoc.artistSlug} + ${runDoc.brushSlug})`
      );
    } catch (error: any) {
      console.error(`✗ Failed run ${runId}:`, error.message);
      await runMutation(internal.generateSingle.updateStatus, {
        runId,
        status: "failed",
        errorMessage: error.message,
      });
    }
  }
);
```

### Option B: Manual Queue with Status Polling

For more control over parallelism:

```ts
// convex/queue.ts
export const processQueue = internalAction(async ({ runMutation }) => {
  // Get next queued run
  const queuedRun = await runMutation(internal.queue.getNextQueued, {});

  if (!queuedRun) return;

  // Process it
  await runMutation(internal.generateSingle.run, { runId: queuedRun._id });

  // Schedule next iteration
  await scheduler.runAfter(1000, internal.queue.processQueue, {});
});
```

**Recommendation:** Use Option A (Convex scheduler) for simplicity. Convex
handles parallelism and retries automatically.

---

## 📊 Analytics & Insights

### Metrics to Track (in `meta` field)

```ts
interface RunMeta {
  // Artist metadata
  artist: {
    model: string;
    tokens: number;
    latencyMs: number;
    costEstimate: number;
  };

  // Brush metadata
  brush: {
    model: string;
    size: string;
    quality?: string;
    latencyMs: number;
    costEstimate: number;
  };

  // Run metadata
  enqueuedAt: number;
  startedAt: number;
  completedAt: number;
  totalLatencyMs: number;
  errorMessage?: string;
}
```

### Analytics Queries

```ts
// convex/analytics.ts
export const getRunGroupStats = query(
  async ({ db }, { runGroupId }: { runGroupId: string }) => {
    const runs = await db
      .query("runs")
      .filter((q) => q.eq(q.field("runGroupId"), runGroupId))
      .collect();

    const stats = {
      total: runs.length,
      completed: runs.filter((r) => r.status === "done").length,
      failed: runs.filter((r) => r.status === "failed").length,
      generating: runs.filter((r) => r.status === "generating").length,
      queued: runs.filter((r) => r.status === "queued").length,
      totalCost: runs.reduce(
        (sum, r) =>
          sum +
          (r.meta?.artist?.costEstimate || 0) +
          (r.meta?.brush?.costEstimate || 0),
        0
      ),
      avgLatency:
        runs.reduce((sum, r) => sum + (r.meta?.totalLatencyMs || 0), 0) /
        runs.length,
    };

    return { runGroupId, stats, runs };
  }
);

export const getOverallStats = query(async ({ db }) => {
  const allRuns = await db.query("runs").collect();

  const byArtist = allRuns.reduce(
    (acc, run) => {
      if (!acc[run.artistSlug]) {
        acc[run.artistSlug] = { count: 0, cost: 0 };
      }
      acc[run.artistSlug].count++;
      acc[run.artistSlug].cost += run.meta?.artist?.costEstimate || 0;
      return acc;
    },
    {} as Record<string, { count: number; cost: number }>
  );

  return {
    totalRuns: allRuns.length,
    totalCost: allRuns.reduce(
      (sum, r) =>
        sum +
        (r.meta?.artist?.costEstimate || 0) +
        (r.meta?.brush?.costEstimate || 0),
      0
    ),
    byArtist,
  };
});
```

---

## 🎨 Compare View UI Specification

### Component Breakdown

```tsx
// app/compare/[runGroupId]/page.tsx
export default function CompareView({
  params,
}: {
  params: { runGroupId: string };
}) {
  const stats = useQuery(api.analytics.getRunGroupStats, {
    runGroupId: params.runGroupId,
  });

  if (!stats) return <Skeleton />;

  return (
    <div className="container mx-auto py-8">
      {/* Header with stats */}
      <CompareHeader stats={stats.stats} />

      {/* Grid of artworks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {stats.runs.map((run) => (
          <ArtworkCard key={run._id} run={run} />
        ))}
      </div>

      {/* Side-by-side statement comparison */}
      <StatementComparison runs={stats.runs} />
    </div>
  );
}

function CompareHeader({ stats }: { stats: RunGroupStats }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Compare Artists</h1>
        <p className="text-muted-foreground">
          {stats.completed} of {stats.total} artworks completed
        </p>
      </div>

      <div className="flex gap-4">
        <Badge variant="outline">
          ${stats.totalCost.toFixed(4)} total cost
        </Badge>
        <Badge variant="outline">
          {(stats.avgLatency / 1000).toFixed(1)}s avg latency
        </Badge>
      </div>
    </div>
  );
}

function ArtworkCard({ run }: { run: RunWithUrl }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square">
        <img
          src={run.imageUrl}
          alt={`${run.artistSlug} artwork`}
          className="object-cover w-full h-full"
        />
        {run.status === "generating" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="default">{run.artistSlug}</Badge>
          <Badge variant="secondary">{run.brushSlug}</Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide" : "Show"} details
        </Button>

        {showDetails && (
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-muted-foreground">{run.artistStmt}</p>
            <div className="flex gap-2">
              <Badge variant="outline">{run.meta?.artist?.tokens} tokens</Badge>
              <Badge variant="outline">
                $
                {(
                  (run.meta?.artist?.costEstimate || 0) +
                  (run.meta?.brush?.costEstimate || 0)
                ).toFixed(4)}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatementComparison({ runs }: { runs: RunWithUrl[] }) {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Artist Statements</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {runs.map((run) => (
          <Card key={run._id}>
            <CardHeader>
              <CardTitle className="text-lg">{run.artistSlug}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {run.artistStmt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Gallery List View Enhancement

```tsx
// app/page.tsx - Add filter by runGroupId
export default function Home() {
  const runs = useQuery(api.runs.list);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const runGroups = useMemo(() => {
    if (!runs) return [];
    const groups = new Map<string, typeof runs>();
    runs.forEach((run) => {
      if (!groups.has(run.runGroupId)) {
        groups.set(run.runGroupId, []);
      }
      groups.get(run.runGroupId)!.push(run);
    });
    return Array.from(groups.entries());
  }, [runs]);

  return (
    <div>
      {/* Filter tabs */}
      <Tabs value={selectedGroup || "all"}>
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSelectedGroup(null)}>
            All Artworks
          </TabsTrigger>
          {runGroups.map(([groupId, groupRuns]) => (
            <TabsTrigger
              key={groupId}
              value={groupId}
              onClick={() => setSelectedGroup(groupId)}
            >
              Group {groupId.slice(0, 8)} ({groupRuns.length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Existing gallery grid */}
    </div>
  );
}
```

---

## 🚨 Error Handling & Retry Logic

### Retry Strategy

```ts
// convex/generateSingle.ts - Enhanced with retry
export const run = internalAction(
  async ({ runMutation, scheduler }, { runId, retryCount = 0 }) => {
    const MAX_RETRIES = 3;

    try {
      // ... existing generation logic ...
    } catch (error: any) {
      console.error(
        `✗ Failed run ${runId} (attempt ${retryCount + 1}):`,
        error.message
      );

      if (retryCount < MAX_RETRIES) {
        // Exponential backoff: 5s, 10s, 20s
        const delayMs = 5000 * Math.pow(2, retryCount);

        console.log(`  ↻ Retrying in ${delayMs / 1000}s...`);

        await scheduler.runAfter(delayMs, internal.generateSingle.run, {
          runId,
          retryCount: retryCount + 1,
        });
      } else {
        // Max retries exceeded
        await runMutation(internal.generateSingle.updateStatus, {
          runId,
          status: "failed",
          errorMessage: `Failed after ${MAX_RETRIES} retries: ${error.message}`,
        });
      }
    }
  }
);
```

### Error Categories & Handling

```ts
// convex/errors.ts
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfterMs: number
  ) {
    super(message);
  }
}

export class QuotaExceededError extends Error {}

export class InvalidPromptError extends Error {}

export function handleAPIError(error: any): never {
  if (error.status === 429) {
    const retryAfter = parseInt(error.headers?.["retry-after"] || "60") * 1000;
    throw new RateLimitError("Rate limit exceeded", retryAfter);
  }

  if (error.status === 403 && error.message?.includes("quota")) {
    throw new QuotaExceededError("API quota exceeded");
  }

  if (error.status === 400) {
    throw new InvalidPromptError(`Invalid prompt: ${error.message}`);
  }

  throw error;
}
```

---

## 🔐 Environment Variables Management

For multi-provider support, organize env vars:

```bash
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-...
GOOGLE_AI_API_KEY=...  # If using Google AI SDK directly
```

Convex deployment:

```bash
npx convex env set OPENAI_API_KEY sk-...
npx convex env set ANTHROPIC_API_KEY sk-ant-...
npx convex env set OPENROUTER_API_KEY sk-or-...
```

---

## 📝 Open Questions for Phase 2

1. **Rate Limiting Strategy**
   - Should we throttle requests per provider?
   - Global concurrent request limit vs per-provider limits?
   - How to handle 429 errors gracefully?

2. **Run Group Management**
   - UI for canceling an in-progress run group?
   - Re-run failed artists within a group?
   - Delete entire run groups?

3. **Brush vs Artist Variation**
   - Phase 3: Should we also vary the Brush per Artist?
   - Or keep Brush constant as the "medium" and only vary "perspective"?

4. **Prompt Evolution**
   - Version control for prompts (v3, v4, etc.)?
   - A/B testing different prompt structures?
   - Allow user-provided prompts in UI?

5. **Cost Management**
   - Set budget limits per run group?
   - Pre-flight cost estimation before enqueuing?
   - Alert when approaching budget threshold?

6. **Real-time Updates**
   - WebSocket updates for run status in compare view?
   - Progress bar showing X/Y artists completed?

7. **Data Retention**
   - Archive old run groups after N days?
   - Export run groups as JSON for analysis?

---

**End of Phase 2 Design.** **Next:** Update Phase 1 with these schema changes.
