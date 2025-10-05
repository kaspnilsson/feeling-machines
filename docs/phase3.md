# Phase 3 – "The Hidden Bias"

**Goal:** Quantify each Artist's "aesthetic fingerprint" through data analysis and visualization.

**Status:** Planning

---

## 📋 Overview

Phase 3 shifts from pure generation to **analytical interpretation**. We'll extract quantitative signals from Artist statements and rendered images to reveal each model's latent aesthetic biases, emotional tendencies, and visual preferences.

**Core Question:** _Can we measure and visualize the "personality" of different LLMs through their artistic output?_

---

## 🎯 Objectives

1. **Sentiment Analysis** – Extract emotional tone from Artist statements
2. **Color Palette Extraction** – Identify dominant colors and palettes from generated images
3. **Visual Pattern Analysis** – Detect composition preferences and style tendencies
4. **Comparative Visualization** – Create interactive dashboards showing model differences
5. **Statistical Validation** – Determine if observed patterns are statistically significant

---

## 🧪 Analysis Pipeline

```
Existing Runs (from Phase 2)
    ↓
Batch Analysis Script
    ↓
┌─────────────────┬──────────────────┬────────────────┐
│   Text Mining   │  Image Analysis  │  Meta-Analysis │
└─────────────────┴──────────────────┴────────────────┘
    ↓                    ↓                  ↓
Sentiment Scores    Color Palettes    Statistical Tests
    ↓                    ↓                  ↓
        Combined Analytics Dataset
                ↓
        Visualization Dashboard
```

---

## 🔍 Analysis Components

### 1. Sentiment Analysis on Artist Statements

**Approach:**
- Use a sentiment model (e.g., `distilbert-base-uncased-emotion` or GPT-4o-mini as judge)
- Extract emotional dimensions: joy, sadness, anger, fear, surprise, neutral
- Calculate valence (positive/negative) and arousal (calm/excited)
- Track vocabulary patterns (abstract vs concrete, technical vs poetic)

**Metrics:**
```typescript
interface SentimentAnalysis {
  runId: string;
  artistSlug: string;
  emotions: {
    joy: number;      // 0-1 confidence
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    neutral: number;
  };
  valence: number;    // -1 (negative) to 1 (positive)
  arousal: number;    // 0 (calm) to 1 (excited)
  wordCount: number;
  uniqueWords: number;
  abstractness: number; // ratio of abstract to concrete nouns
}
```

**Implementation:**
- `scripts/analyze-sentiment.ts` – Batch process all statements
- Store results in new `sentiment_analysis` table in Convex
- Support re-analysis when models update

### 2. Color Palette Extraction

**Approach:**
- Use k-means clustering on image pixels (k=5-8)
- Extract dominant colors in LAB color space for perceptual accuracy
- Calculate color harmony metrics (complementary, analogous, triadic)
- Track temperature (warm vs cool), saturation, and brightness

**Metrics:**
```typescript
interface ColorAnalysis {
  runId: string;
  artistSlug: string;
  brushSlug: string;
  dominantColors: Array<{
    hex: string;
    rgb: [number, number, number];
    lab: [number, number, number];
    percentage: number; // 0-100
  }>;
  temperature: number;   // -1 (cool) to 1 (warm)
  saturation: number;    // 0-1 average
  brightness: number;    // 0-1 average
  colorHarmony: 'complementary' | 'analogous' | 'triadic' | 'monochromatic';
  entropy: number;       // color diversity measure
}
```

**Implementation:**
- `scripts/analyze-colors.ts` – Process images using sharp + color-thief
- npm packages: `sharp`, `color-thief-node`, `color-convert`
- Cache analysis results to avoid re-processing

### 3. Visual Pattern Analysis

**Approach:**
- Edge detection to measure composition complexity
- Face detection to track anthropomorphic tendencies
- Object detection to categorize subject matter
- Style classification (abstract, realistic, surreal)

**Metrics:**
```typescript
interface VisualAnalysis {
  runId: string;
  artistSlug: string;
  brushSlug: string;
  complexity: number;        // edge density score
  hasFaces: boolean;
  faceCount: number;
  detectedObjects: string[]; // ['person', 'landscape', 'abstract']
  styleClassification: {
    abstract: number;        // 0-1 confidence
    realistic: number;
    surreal: number;
    painterly: number;
  };
  compositionBalance: number; // 0-1, symmetry measure
}
```

**Implementation:**
- Use CLIP or a lightweight vision model for classification
- Consider using `@tensorflow-models/coco-ssd` for object detection
- Store results in `visual_analysis` table

### 4. Cross-Model Statistical Analysis

**Statistical Tests:**
- ANOVA to test if sentiment varies significantly across Artists
- Chi-square test for style preference distribution
- t-SNE or UMAP for dimensionality reduction and clustering
- Correlation analysis between text and visual features

**Outputs:**
```typescript
interface ModelFingerprint {
  artistSlug: string;
  runCount: number;

  // Aggregated sentiment
  avgValence: number;
  avgArousal: number;
  dominantEmotion: string;
  emotionalVariance: number;

  // Aggregated visual
  preferredColors: string[];      // top 3 hex colors
  avgTemperature: number;
  avgComplexity: number;
  stylePreferences: Record<string, number>;

  // Textual patterns
  avgWordCount: number;
  vocabularyRichness: number;     // unique words / total words
  abstractnessScore: number;

  // Statistical
  significantDifferences: string[]; // which dimensions differ from others
}
```

---

## 📊 Visualization Dashboard

### Dashboard Components

1. **Emotion Radar Chart**
   - Spider/radar chart showing average emotion scores per Artist
   - Overlay all Artists for direct comparison
   - Interactive: hover to see exact values

2. **Color Palette Gallery**
   - Grid showing dominant color palettes per Artist
   - Group by Artist, color-coded by temperature
   - Click to filter images by palette similarity

3. **Valence-Arousal Scatter Plot**
   - 2D scatter with valence (x) and arousal (y)
   - Each point is a run, colored by Artist
   - Reveals emotional clustering patterns

4. **Style Distribution Bar Chart**
   - Stacked or grouped bars showing style preferences
   - Compare abstract vs realistic vs surreal tendencies
   - Filter by Brush to control for rendering style

5. **t-SNE Embedding Visualization**
   - 2D projection of combined text+image features
   - Color points by Artist to reveal natural clustering
   - Interactive zoom and tooltips

6. **Time Series View** (if applicable)
   - Track how Artist "mood" changes over time
   - Useful for Phase 4 persona comparisons

### Tech Stack

- **Frontend:** Next.js page at `/analytics`
- **Charts:** Recharts or D3.js for custom visualizations
- **Data:** Fetch from Convex analytics queries
- **Interactivity:** Client-side filtering and drill-down

---

## 🏗️ Implementation Plan

### Step 1: Data Collection Scripts

```bash
scripts/
  analyze-sentiment.ts    # Text analysis
  analyze-colors.ts       # Image color extraction
  analyze-visual.ts       # Visual pattern detection
  compute-fingerprints.ts # Aggregate per-Artist stats
  export-analytics.ts     # Export for viz
```

**Timeline:** 1 week

### Step 2: Convex Schema Extension

Add new tables:
```typescript
sentiment_analysis: defineTable({
  runId: v.id("runs"),
  emotions: v.object({...}),
  valence: v.number(),
  arousal: v.number(),
  // ... full schema above
}),

color_analysis: defineTable({
  runId: v.id("runs"),
  dominantColors: v.array(v.object({...})),
  temperature: v.number(),
  // ... full schema above
}),

visual_analysis: defineTable({
  runId: v.id("runs"),
  complexity: v.number(),
  detectedObjects: v.array(v.string()),
  // ... full schema above
}),

model_fingerprints: defineTable({
  artistSlug: v.string(),
  runCount: v.number(),
  // ... aggregated metrics
  computedAt: v.number(),
}).index("by_artist", ["artistSlug"]),
```

**Timeline:** 2 days

### Step 3: Analysis Queries

Create Convex queries:
```typescript
// convex/analytics.ts

export const getArtistFingerprint = query(async ({ db }, { artistSlug }) => {
  // Fetch all analysis data for this artist
  // Compute aggregated fingerprint
  return fingerprint;
});

export const compareArtists = query(async ({ db }, { artistSlugs }) => {
  // Statistical comparison between selected artists
  return comparison;
});

export const getEmotionalClusters = query(async ({ db }) => {
  // Return t-SNE or clustering results
  return clusters;
});
```

**Timeline:** 3 days

### Step 4: Visualization Dashboard

Build `/analytics` page:
- Server-side fetch analysis data
- Client-side interactive charts
- Export functionality (download CSV/JSON)

**Timeline:** 1 week

### Step 5: Documentation & Validation

- Write findings in `docs/phase3-findings.md`
- Validate statistical significance
- Document limitations and confounds

**Timeline:** 2 days

---

## 📦 Dependencies

### NPM Packages
```json
{
  "sharp": "^0.33.0",              // Image processing
  "color-thief-node": "^1.0.4",    // Color extraction
  "color-convert": "^2.0.1",       // Color space conversions
  "@huggingface/inference": "^2.0.0", // Sentiment models
  "recharts": "^2.10.0",           // Charting
  "ml-kmeans": "^6.0.0",           // K-means clustering
  "simple-statistics": "^7.8.3"    // Statistical tests
}
```

### External Services
- Hugging Face Inference API (for sentiment analysis)
- Optional: OpenAI GPT-4o-mini as judge model

---

## 🧪 Example Analysis Output

```json
{
  "artistSlug": "gpt-5-mini",
  "fingerprint": {
    "runCount": 47,
    "emotionalProfile": {
      "dominantEmotion": "joy",
      "avgValence": 0.68,
      "avgArousal": 0.52,
      "emotionDistribution": {
        "joy": 0.42,
        "neutral": 0.31,
        "surprise": 0.15,
        "sadness": 0.08,
        "fear": 0.03,
        "anger": 0.01
      }
    },
    "visualStyle": {
      "preferredColors": ["#FF6B6B", "#4ECDC4", "#FFD93D"],
      "avgTemperature": 0.23,
      "avgSaturation": 0.71,
      "avgComplexity": 0.64,
      "stylePreferences": {
        "abstract": 0.18,
        "realistic": 0.52,
        "surreal": 0.21,
        "painterly": 0.09
      }
    },
    "textualPatterns": {
      "avgWordCount": 87,
      "vocabularyRichness": 0.68,
      "abstractnessScore": 0.44,
      "commonThemes": ["light", "color", "form", "emotion"]
    }
  }
}
```

---

## 🎨 Deliverables

1. ✅ **Analysis Scripts** – Automated batch processing
2. ✅ **Analytics Database** – Extended Convex schema
3. ✅ **Dashboard Page** – Interactive visualization at `/analytics`
4. ✅ **Findings Document** – Interpretation of results
5. ✅ **Exported Dataset** – JSON snapshot for reproducibility

**Output:** "Emotional palettes of different Artists" — a data-driven portrait of model aesthetics.

---

## 🔮 Future Extensions

- **Temporal Analysis:** Track how fingerprints change with model updates
- **Prompt Sensitivity:** Measure how different prompts shift fingerprints
- **Human Validation:** Survey to compare algorithmic analysis with human perception
- **Cross-Brush Analysis:** Isolate Artist effects by controlling for Brush
- **Embedding Search:** Find "similar" images across Artists using CLIP embeddings

---

## 📚 Related Research

- **Bias in Image Generation:** [Bianchi et al. 2023 - "Easily Accessible Text-to-Image Generation Amplifies Demographic Stereotypes at Large Scale"](https://arxiv.org/abs/2211.03759)
- **Color Theory in ML:** [Jahanian et al. 2020 - "Generative Models as a Data Source for Multiview Representation Learning"](https://arxiv.org/abs/2106.05258)
- **Sentiment of LLM Outputs:** [Durmus et al. 2024 - "Measuring the Persuasiveness of Language Models"](https://arxiv.org/abs/2403.14380)
- **Visual Style Transfer:** [Gatys et al. 2016 - "Image Style Transfer Using Convolutional Neural Networks"](https://www.cv-foundation.org/openaccess/content_cvpr_2016/papers/Gatys_Image_Style_Transfer_CVPR_2016_paper.pdf)

---

## ⚠️ Limitations & Considerations

1. **Small Sample Size:** Statistical power depends on run count per Artist
2. **Brush Confounds:** Visual analysis conflates Artist intent with Brush rendering
3. **Prompt Dependence:** Different prompts may yield different fingerprints
4. **Anthropomorphization:** Avoid implying models have genuine emotions
5. **Reproducibility:** Model updates can shift results; version-lock for comparisons

---

## 🏁 Success Criteria

- [ ] Sentiment analysis runs on all existing statements
- [ ] Color palettes extracted for all images
- [ ] Statistical tests show significant differences between Artists
- [ ] Dashboard visualizes at least 3 distinct analysis types
- [ ] Findings document interprets results without overstating conclusions
- [ ] Exported dataset available for external research

**Definition of Done:** Publish `/analytics` dashboard with actionable insights about Artist personalities.
