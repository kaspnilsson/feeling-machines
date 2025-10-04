# Feeling Machines – Project Plan

## 🧭 Overview

**Feeling Machines** is an open-source experiment exploring how generative
models imagine and express art when treated as _artists_. Each **Artist** (LLM)
describes the artwork it "wants" to create; each **Brush** (image model) renders
that vision. The project visualizes how different models reveal latent aesthetic
biases, emotional tones, and worldviews under identical creative constraints.

---

## 🎨 Core Concepts

| Concept        | Description                                                                      | Examples                                                     |
| -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Artist**     | The reasoning model that imagines the artwork and writes the "artist statement." | `gpt-5-mini`, `claude-3-opus`, `gemini-2.0`, `mistral-large` |
| **Brush**      | The image model that renders the Artist's prompt into an image.                  | `gpt-image-3`, `flux-1`, `sdxl`, `midjourney`                |
| **Prompt Set** | Canonical introspection prompt template; defines how Artists are queried.        | `v2-neutral`, `v2-artificial`, `persona-digital-monk`        |
| **Run**        | One complete execution of Artist → Brush → Output.                               | `{ artist, brush, promptVersion, seed, statement, image }`   |
| **Gallery**    | Front-end that displays runs and comparisons.                                    | Next.js + Convex app                                         |

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

### **Phase 3 – "The Hidden Bias"**

**Goal:** Quantify each Artist's "aesthetic fingerprint."

- Sentiment analysis on Artist Statements.
- Color palette extraction from images.
- Basic visualization (e.g., t-SNE or scatterplot). **Output:** Data viz
  dashboard: "emotional palettes of different Artists."

---

### **Phase 4 – "The Introspector"**

**Goal:** Add persona prompts (different creative identities).

- Examples: "digital monk," "alien anthropologist," "haunted museum server."
- Each Artist responds under multiple personas. **Output:** Persona gallery
  showing how context changes expression.

---

### **Phase 5 – "The Brush Lab" (optional)**

**Goal:** Fix one Artist and vary Brushes. **Deliverable:** Visual comparison of
identical prompts rendered across image models. **Output:** "Same idea,
different medium" exhibit.

---

### **Phase 6 – "The White Paper"**

**Goal:** Write and release a short publication documenting the experiment.
**Sections:** Abstract, Introduction, Methods, Results, Discussion, Conclusion.
**Output:** Publishable white paper + open dataset.

---

## 🧱 Data Schema (Convex)

```ts
runs: defineTable({
  artistSlug: v.string(),
  brushSlug: v.string(),
  promptVersion: v.string(),
  artistStmt: v.string(),
  imagePrompt: v.string(),
  imageUrl: v.string(),
  seed: v.optional(v.number()),
  createdAt: v.number(),
});
```

---

## 🧭 Roadmap Summary

| Phase | Name                  | Core Goal         | Fun Deliverable         |
| ----- | --------------------- | ----------------- | ----------------------- |
| 1     | The Spark             | MVP               | First live gallery      |
| 2     | The Chorus of Artists | Multi-LLM         | Compare view            |
| 3     | The Hidden Bias       | Analytics         | Emotional palette viz   |
| 4     | The Introspector      | Persona prompts   | Persona gallery         |
| 5     | The Brush Lab         | Multi-image-model | Visual style comparison |
| 6     | The White Paper       | Publication       | Dataset + paper         |

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
comparison?

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
