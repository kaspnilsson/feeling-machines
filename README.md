# Feeling Machines – Project Plan

## 🧭 Overview

**Feeling Machines** is an open-source experiment exploring how generative
models imagine and express art when treated as _artists_. Each **Artist** (LLM)
describes the artwork it "wants" to create; each **Brush** (image model) renders
that vision. The project visualizes how different models reveal latent aesthetic
biases, emotional tones, and worldviews under identical creative constraints.

Feeling Machines now ships two tightly coupled experiences:

- **Gallery** – a public, research-forward showcase that juxtaposes model
  outputs in a striking, editorial layout. Visitors explore curated comparisons,
  skim insights, and understand the broader study.
- **Lab Console** – an internal workspace for researchers to configure batches,
  monitor progress, and review analytics that power the public story.

---

## 🎨 Core Concepts

| Concept        | Description                                                                      | Examples                                                                              |
| -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Artist**     | The reasoning model that imagines the artwork and writes the "artist statement." | `gpt-5-mini`, `claude-sonnet-4.5`, `gemini-2.5-flash`, `grok-4-fast`, `deepseek-chat` |
| **Brush**      | The image model that renders the Artist's prompt into an image.                  | `gemini-2.5-flash-image`, `gpt-image-1`                                               |
| **Prompt Set** | Canonical introspection prompt template; defines how Artists are queried.        | `v2-neutral`, `v2-artificial`, `persona-digital-monk`                                 |
| **Run**        | One complete execution of Artist → Brush → Output.                               | `{ artist, brush, promptVersion, seed, statement, image }`                            |
| **Gallery**    | Front-end that displays runs and comparisons.                                    | Next.js + Convex app                                                                  |

---

## 🧩 Architecture Overview

```
Artist (LLM)
    ↓
Artist Statement + Image Prompt
    ↓
Brush (Image Model)
    ↓
Generated Image
    ↓
Convex DB → Next.js Gallery
```

- **Artist → Brush** is the main creative pipeline.
- **Convex** handles storage and serverless functions.
- **Next.js** renders the public gallery.
- Prompts, statements, and metadata are all versioned for reproducibility.

---

## 🖼️ Experience Architecture

| Surface         | Audience                       | Purpose                                                                                   | Key Moments                                                                                |
| --------------- | ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Gallery**     | Visitors, press, collaborators | Showcase signature comparisons, narrate findings, and contextualize the research roadmap. | Hero collage, interactive comparison viewer, research highlights, dataset/newsletter CTAs. |
| **Lab Console** | Research team                  | Operate experiments, triage failures, and study analytics that feed the gallery.          | Batch queue manager, prompt/model library, analytics dashboards, data export.              |

**Gallery priorities**

- Hero strip featuring 3–4 curated comparisons with synchronized toggles for
  Artists and Brushes.
- Story-driven research hub summarizing each phase with visuals, key metrics,
  and methodology callouts.
- Comparison detail view with split-screen columns per Artist, synchronized
  zoom, and inline sentiment badges.
- Insights page summarizing aggregated metrics (sentiment, palette, materiality)
  in public-friendly charts.

**Lab Console priorities**

- Table-first batch manager with filters (queued, generating, done, failed) and
  inline retry/duplicate controls.
- Configurable run builder (prompt presets, artist sets, brush, batch size) with
  saved templates.
- Analytics dashboard surfacing emotional trends, cost curves, failure
  diagnostics, and export hooks for deeper analysis.

---

## 🚀 Project Phases

### **Phase 1 – "The Spark"**

**Goal:** Build an MVP pipeline: one Artist, one Brush, one canonical prompt.
**Deliverable:** Working Next.js + Convex gallery that generates and displays
runs. **Output:** "Feeling Machines v0.1 – One Artist, One Brush."

---

### **Phase 2 – "The Chorus of Artists"**

**Goal:** Add multiple Artists (LLMs) using the same Brush. **Deliverable:**
Compare-view grid showing how different Artists imagine art. **Output:** "Claude
vs GPT vs Gemini" visual comparison.

---

### **Phase 3 – "The Hidden Bias"** (In Progress)

**Goal:** Quantify each Artist's "aesthetic fingerprint" through statistical
analysis.

**What's Working:**

- ✅ Batch comparison with multiple models running simultaneously
- ✅ Automatic sentiment analysis on all artist statements
- ✅ Model parameter presets (default, deterministic, creative, balanced)
- ✅ Multi-iteration experiments (1×, 3×, 5×, 10×, 20× batch sizes)
- ✅ Sentiment data stored in database for analysis

**In Development:**

- Color palette extraction from rendered images
- Materiality analysis (concrete vs speculative materials)
- Cultural reference tracking
- Statistical validation across multiple runs
- Visualization dashboard showing model fingerprints

**Key Insight:** For statistically meaningful analysis, we need multiple runs
per model. The UI now supports batch sizes from 1× to 20× iterations, allowing
reproducibility testing and variance measurement.

**Output:** Data viz dashboard comparing emotional patterns, aesthetic
preferences, and creative biases across models.

---

### **Phase 4 – "The Introspector"**

**Goal:** Add persona prompts (different creative identities).

- Examples: "digital monk," "alien anthropologist," "haunted museum server."
- Each Artist responds under multiple personas. **Output:** Persona gallery
  showing how context changes expression.

---

### **Phase 5 – "The White Paper"**

**Goal:** Write and release a short publication documenting the experiment.
**Sections:** Abstract, Introduction, Methods, Results, Discussion, Conclusion.
**Output:** Publishable white paper + open dataset.

---

## 🧱 Data Schema (Convex)

```ts
runs: defineTable({
  runGroupId: v.string(), // Links multiple runs from same batch
  artistSlug: v.string(), // e.g. "gpt-5-mini", "claude-sonnet-4.5"
  brushSlug: v.string(), // e.g. "gemini-2.5-flash-image"
  promptVersion: v.string(), // "v2-neutral" | "v3-introspective"
  paramPreset: v.optional(v.string()), // "default" | "deterministic" | "creative" | "balanced"
  artistStmt: v.string(),
  imagePrompt: v.string(),
  imageUrl: v.union(v.string(), v.null()),
  status: v.string(), // "queued" | "generating" | "done" | "failed"
  meta: v.optional(v.any()), // Cost, latency, model params
  createdAt: v.number(),
});

sentiment_analysis: defineTable({
  runId: v.id("runs"),
  artistSlug: v.string(),
  emotions: v.object({
    joy: v.number(),
    sadness: v.number(),
    anger: v.number(),
    fear: v.number(),
    surprise: v.number(),
    neutral: v.number(),
  }),
  valence: v.number(), // -1 (negative) to 1 (positive)
  arousal: v.number(), // 0 (calm) to 1 (excited)
  wordCount: v.number(),
  uniqueWords: v.number(),
  abstractness: v.number(), // 0 to 1
  createdAt: v.number(),
})
  .index("by_run", ["runId"])
  .index("by_artist", ["artistSlug"]);
```

---

## 🧭 Roadmap Summary

| Phase | Name                  | Core Goal       | Fun Deliverable       |
| ----- | --------------------- | --------------- | --------------------- |
| 1     | The Spark             | MVP             | First live gallery    |
| 2     | The Chorus of Artists | Multi-LLM       | Compare view          |
| 3     | The Hidden Bias       | Analytics       | Emotional palette viz |
| 4     | The Introspector      | Persona prompts | Persona gallery       |
| 5     | The White Paper       | Publication     | Dataset + paper       |

---

## 💡 Guiding Principles

- **Artists imagine, Brushes render.**
- **Reproducibility over randomness:** log seeds, prompts, and model versions.
- **Transparency:** store all metadata; no silent post-processing.
- **Aesthetics as data:** treat art generation as interpretability.
- **Every phase ends with a visible artifact.**

---

## ⚒️ Implementation Notes (post-SnitchBench learnings)

### Dual-mode repo:

Keep both a live app (`apps/web` using Convex) and a `scripts/` folder for
reproducible offline generation and analysis.

- `scripts/generate.ts` → runs Artists → Brush and saves JSON/image artifacts.
- `scripts/analyze.ts` → judge model + color stats.
- `scripts/combine.ts` → merges everything for the web gallery.

### Frontend surfaces:

- Structure routes into `(public)` and `(console)` groups so the Gallery and Lab
  Console can evolve independently while sharing shadcn primitives.
- Centralize reusable patterns (`PageShell`, `SectionHeading`, `MetricGrid`,
  `InsightBadge`) under `components/patterns/` to keep typography, spacing, and
  data presentation consistent.
- Keep editorial content (hero copy, research notes) in MDX/markdown so the
  Gallery team can iterate without touching console logic.

See `docs/experience.md` for the full UX blueprint.

### Prompt versioning:

Store each canonical prompt as a markdown file in `/prompts/` with version
headers and metadata (id, description, inspiredBy, dateCreated). Reference these
file paths in your Convex schema (`promptVersion`).

### Multi-Artist routing via OpenRouter:

Adopt OpenRouter early so you can fan out to Claude, Gemini, Mistral, etc.
without bespoke API logic.

### Judging pass pattern:

Later phases should use a separate LLM to label or evaluate results (sentiment,
medium, tone) exactly like SnitchBench's "judge" model. Treat this as its own
reproducible phase so you can iterate without re-generating art.

### Flat-file artifacts:

Even though Convex handles the live DB, export snapshots (`/data/runs/*.json`)
after each experiment for transparency, reproducibility, and eventual
white-paper appendices.

### Cost + runtime logging:

Mirror SnitchBench's approach by recording approximate time and API cost per
batch in a `run-metadata.json`.

### Lightweight viz first:

Before the fancy gallery, push a simple static HTML page that reads a combined
JSON and shows a grid or scatter plot; this keeps progress tangible every
weekend.

---

## 🔮 Stretch Ideas

- Daily automated "Model Mood Tracker" (same prompt, regenerated daily).
- Public dataset release (`runs.jsonl` + images).
- Optional mini-study: human rating of "optimism," "surrealism," etc.

---

## 🧠 Open Questions & Research Directions

### 1. Conceptual

**Do models express distinct "worldviews"?** How can we rigorously define and
measure that — sentiment, color, medium, narrative tone, or something emergent?

**Where does personality live?** If an Artist's "voice" persists across prompts,
is that from training data, alignment layers, or anthropomorphic projection?

**How much introspection is too much?** Do longer reasoning prompts yield deeper
"emotion," or just verbose boilerplate?

**Does role framing matter most?** Are differences bigger between roles
("artist," "AI mind," "alien") or between models?

### 2. Experimental Design

**Prompt invariance:** How can we make sure all Artists interpret the same task
(avoiding misaligned meta-behavior)?

**Model reproducibility:** How often do outputs drift with temperature or minor
seed changes?

**Sampling scale:** How many runs per model are enough for a meaningful
comparison? **Current approach:** UI supports 1×, 3×, 5×, 10×, and 20× batch
sizes for statistical testing.

**Bias quantification:** What metrics best represent emotional bias — sentiment
polarity, vocabulary, color palette, image entropy?

### 3. Technical

**Rate limits and costs:** How to schedule or queue multiple model calls
economically?

**Image storage:** How to handle long-term hosting (Convex file storage, S3, or
static export)?

**Model integration:** Which API layer best normalizes multi-provider LLMs
(OpenAI, Anthropic, Google, Mistral)?

**Data schema extensions:** Should we log full raw responses for
reproducibility, and if so, how to safely anonymize or compress them?

### 4. Product & Experience

**UI storytelling:** How can the gallery communicate "Artist vs Brush" clearly
and elegantly to non-technical viewers?

**Attribution:** How should Artist and Brush names appear — like "Claude ×
Flux," "GPT-5 × GPT-Image-3," etc.?

**Public participation:** Should viewers be able to trigger new runs or remix
prompts?

### 5. Research & Publication

**Interpretation validity:** How do we talk about "model feelings" without
implying sentience? (This will be critical for credibility in the white paper.)

**Quantitative rigor vs artistic narrative:** Should the final paper be written
as empirical research, conceptual art, or hybrid design research?

**Ethics and licensing:** How to attribute generated artworks and ensure
compliance with each API's content policy?

---

## 🏁 Vision

**Feeling Machines** is both art and experiment — a living gallery of machine
imagination. By asking models to become artists, we expose the hidden aesthetics
of their design and training, turning AI introspection into a new kind of
creative research.
