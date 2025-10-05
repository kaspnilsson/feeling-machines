/**
 * Compute Descriptive Statistics
 *
 * Aggregates analysis results across runs and computes descriptive statistics
 * (mean, stddev, median, quartiles, CI) for each model/metric combination.
 *
 * IMPORTANT: Statistics should be computed per-batch (runGroupId) for
 * controlled comparisons.
 *
 * Usage:
 *   npx tsx scripts/compute-descriptive-stats.ts <runGroupId>
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import {
  mean,
  standardDeviation,
  median,
  quartiles,
  confidenceInterval95,
} from "../utils/statistics";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface AnalysisData {
  runId: string;
  artistSlug: string;
  valence?: number;
  arousal?: number;
  abstractness?: number;
  wordCount?: number;
  emotions?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
  temperature?: number;
  avgSaturation?: number;
  impossibilityScore?: number;
  technicalDetail?: number;
  materials?: string[];
}

interface MetricExtractor {
  name: string;
  extract: (analysis: AnalysisData) => number | null;
}

// Define all metrics we want to compute statistics for
const METRICS: MetricExtractor[] = [
  // Sentiment metrics
  { name: "valence", extract: (s) => s.valence ?? null },
  { name: "arousal", extract: (s) => s.arousal ?? null },
  { name: "abstractness", extract: (s) => s.abstractness ?? null },
  { name: "wordCount", extract: (s) => s.wordCount ?? null },
  { name: "emotion_joy", extract: (s) => s.emotions?.joy ?? null },
  { name: "emotion_sadness", extract: (s) => s.emotions?.sadness ?? null },
  { name: "emotion_anger", extract: (s) => s.emotions?.anger ?? null },
  { name: "emotion_fear", extract: (s) => s.emotions?.fear ?? null },
  { name: "emotion_surprise", extract: (s) => s.emotions?.surprise ?? null },

  // Color metrics
  { name: "temperature", extract: (c) => c.temperature ?? null },
  { name: "saturation", extract: (c) => c.avgSaturation ?? null },

  // Materiality metrics
  { name: "impossibilityScore", extract: (m) => m.impossibilityScore ?? null },
  { name: "technicalDetail", extract: (m) => m.technicalDetail ?? null },
  { name: "materialCount", extract: (m) => (m.materials?.length ?? null) },
];

async function computeDescriptiveStats(runGroupId: string) {
  console.log("📊 Computing descriptive statistics...");
  console.log(`   Batch: ${runGroupId}\n`);

  // Fetch runs for this batch
  const runs = await client.query(api.runs.list, {});

  if (runs.length === 0) {
    console.log("⚠️  No runs found");
    return;
  }

  console.log(`   Found ${runs.length} runs`);

  // TODO: Uncomment when list queries are implemented
  // const [sentimentData, colorData, materialityData] = await Promise.all([
  //   client.query(api.sentiment.listSentimentAnalysis, {}),
  //   client.query(api.colors.listColorAnalysis, {}),
  //   client.query(api.materiality.listMaterialityAnalysis, {}),
  // ]);

  // Build lookup maps by runId
  const sentimentByRun = new Map<string, AnalysisData>();
  const colorByRun = new Map<string, AnalysisData>();
  const materialityByRun = new Map<string, AnalysisData>();

  // TODO: Populate these maps when data is available
  // const sentimentByRun = new Map(
  //   sentimentData.map((s: any) => [s.runId, s as AnalysisData])
  // );
  // const colorByRun = new Map(colorData.map((c: any) => [c.runId, c as AnalysisData]));
  // const materialityByRun = new Map(
  //   materialityData.map((m: any) => [m.runId, m as AnalysisData])
  // );

  // Group runs by artist
  const runsByArtist = new Map<string, typeof runs>();
  for (const run of runs) {
    if (!runsByArtist.has(run.artistSlug)) {
      runsByArtist.set(run.artistSlug, []);
    }
    runsByArtist.get(run.artistSlug)!.push(run);
  }

  console.log(`   Found ${runsByArtist.size} unique artists`);

  // Compute statistics for each artist × metric combination
  const statsToSave: {
    artistSlug: string;
    metric: string;
    runGroupId?: string;
    n: number;
    mean: number;
    stdDev: number;
    median: number;
    q1: number;
    q3: number;
    min: number;
    max: number;
    ci95Lower: number;
    ci95Upper: number;
    createdAt: number;
  }[] = [];

  for (const [artistSlug, artistRuns] of runsByArtist.entries()) {
    console.log(`\n   Processing ${artistSlug} (${artistRuns.length} runs)...`);

    for (const metric of METRICS) {
      // Extract values for this metric
      const values: number[] = [];

      for (const run of artistRuns) {
        let value: number | null = null;

        // Try to extract from each analysis type
        if (metric.name.startsWith("emotion_") || ["valence", "arousal", "abstractness", "wordCount"].includes(metric.name)) {
          const sentiment = sentimentByRun.get(run._id);
          if (sentiment) value = metric.extract(sentiment);
        } else if (["temperature", "saturation"].includes(metric.name)) {
          const color = colorByRun.get(run._id);
          if (color) value = metric.extract(color);
        } else if (["impossibilityScore", "technicalDetail", "materialCount"].includes(metric.name)) {
          const materiality = materialityByRun.get(run._id);
          if (materiality) value = metric.extract(materiality);
        }

        if (value !== null && !isNaN(value)) {
          values.push(value);
        }
      }

      if (values.length === 0) {
        continue; // Skip metrics with no data
      }

      // Compute descriptive statistics
      const n = values.length;
      const meanVal = mean(values);
      const stdDev = standardDeviation(values);
      const medianVal = median(values);
      const { q1, q3 } = quartiles(values);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const { lower: ci95Lower, upper: ci95Upper } = confidenceInterval95(values);

      const stats = {
        artistSlug,
        metric: metric.name,
        runGroupId,
        n,
        mean: meanVal,
        stdDev,
        median: medianVal,
        q1,
        q3,
        min: minVal,
        max: maxVal,
        ci95Lower,
        ci95Upper,
        createdAt: Date.now(),
      };

      statsToSave.push(stats);

      console.log(
        `     ${metric.name}: n=${n}, mean=${meanVal.toFixed(3)}, σ=${stdDev.toFixed(3)}, CI=[${ci95Lower.toFixed(3)}, ${ci95Upper.toFixed(3)}]`
      );
    }
  }

  // Save to database
  console.log(`\n💾 Saving ${statsToSave.length} statistics records...`);

  for (const stats of statsToSave) {
    await client.mutation(api.statistics.saveModelStatistics, stats);
  }

  console.log("✅ Done!");
}

// Run if called directly
if (require.main === module) {
  const runGroupId = process.argv[2];

  if (!runGroupId) {
    console.error("❌ Error: runGroupId is required");
    console.error("Usage: npx tsx scripts/compute-descriptive-stats.ts <runGroupId>");
    process.exit(1);
  }

  computeDescriptiveStats(runGroupId).catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
}

export { computeDescriptiveStats };
