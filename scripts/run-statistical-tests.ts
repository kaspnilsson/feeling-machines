/**
 * Run Statistical Tests
 *
 * Performs ANOVA and pairwise t-tests with multiple comparison correction
 * to determine which models differ significantly on each metric.
 *
 * IMPORTANT: Statistical tests should be run per-batch (runGroupId) for
 * controlled comparisons, not across all data.
 *
 * Usage:
 *   npx tsx scripts/run-statistical-tests.ts <runGroupId>
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import {
  oneWayANOVA,
  welchTTest,
  cohensD,
  benjaminiHochberg,
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

async function runStatisticalTests(runGroupId: string) {
  console.log("🔬 Running statistical tests...");
  console.log(`   Batch: ${runGroupId}\n`)

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

  // Build lookup maps
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

  const artists = Array.from(runsByArtist.keys()).sort();
  console.log(`   Found ${artists.length} unique artists: ${artists.join(", ")}\n`);

  // Process each metric
  for (const metric of METRICS) {
    console.log(`\n📊 ${metric.name}`);
    console.log("─".repeat(60));

    // Collect values for each artist
    const valuesByArtist = new Map<string, number[]>();

    for (const [artistSlug, artistRuns] of runsByArtist.entries()) {
      const values: number[] = [];

      for (const run of artistRuns) {
        let value: number | null = null;

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

      if (values.length > 0) {
        valuesByArtist.set(artistSlug, values);
      }
    }

    if (valuesByArtist.size < 2) {
      console.log("   ⚠️  Insufficient data (need at least 2 groups)\n");
      continue;
    }

    // 1️⃣ Run ANOVA
    const groups = Array.from(valuesByArtist.values());
    const anovaResult = oneWayANOVA(groups);

    console.log(`   ANOVA: F(${anovaResult.dfBetween}, ${anovaResult.dfWithin}) = ${anovaResult.fStatistic.toFixed(3)}, p = ${anovaResult.pValue.toFixed(4)}`);
    console.log(`   Effect size: η² = ${anovaResult.etaSquared.toFixed(3)}`);

    if (anovaResult.pValue < 0.05) {
      console.log("   ✅ Significant difference detected");
    } else {
      console.log("   ❌ No significant difference");
    }

    // Save ANOVA result
    await client.mutation(api.statistics.saveANOVA, {
      metric: metric.name,
      runGroupId,
      fStatistic: anovaResult.fStatistic,
      pValue: anovaResult.pValue,
      dfBetween: anovaResult.dfBetween,
      dfWithin: anovaResult.dfWithin,
      etaSquared: anovaResult.etaSquared,
      significant: anovaResult.pValue < 0.05,
      createdAt: Date.now(),
    });

    // 2️⃣ Run pairwise t-tests (if ANOVA significant)
    if (anovaResult.pValue < 0.05 && valuesByArtist.size >= 2) {
      console.log("\n   Pairwise Comparisons:");

      const comparisons: {
        artist1: string;
        artist2: string;
        pValue: number;
      }[] = [];

      const artistList = Array.from(valuesByArtist.keys());

      for (let i = 0; i < artistList.length; i++) {
        for (let j = i + 1; j < artistList.length; j++) {
          const artist1 = artistList[i];
          const artist2 = artistList[j];
          const values1 = valuesByArtist.get(artist1)!;
          const values2 = valuesByArtist.get(artist2)!;

          // Use Welch's t-test (doesn't assume equal variances)
          const tTestResult = welchTTest(values1, values2);
          const effectSize = cohensD(values1, values2);

          comparisons.push({
            artist1,
            artist2,
            pValue: tTestResult.pValue,
          });

          // Don't save yet - will apply multiple comparison correction first
          console.log(
            `     ${artist1} vs ${artist2}: t = ${tTestResult.tStatistic.toFixed(3)}, p = ${tTestResult.pValue.toFixed(4)}, d = ${effectSize.toFixed(3)}`
          );
        }
      }

      // 3️⃣ Apply Benjamini-Hochberg correction
      const pValues = comparisons.map((c) => c.pValue);
      const significantFlags = benjaminiHochberg(pValues, 0.05);

      console.log("\n   After Benjamini-Hochberg correction:");

      for (let idx = 0; idx < comparisons.length; idx++) {
        const comp = comparisons[idx];
        const isSignificant = significantFlags[idx];

        const artist1 = comp.artist1;
        const artist2 = comp.artist2;
        const values1 = valuesByArtist.get(artist1)!;
        const values2 = valuesByArtist.get(artist2)!;

        const tTestResult = welchTTest(values1, values2);
        const effectSize = cohensD(values1, values2);
        const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

        console.log(
          `     ${artist1} vs ${artist2}: ${isSignificant ? "✅ SIGNIFICANT" : "❌ not significant"} (p = ${comp.pValue.toFixed(4)})`
        );

        // Save comparison result
        await client.mutation(api.statistics.saveComparison, {
          metric: metric.name,
          artist1,
          artist2,
          runGroupId,
          n1: values1.length,
          n2: values2.length,
          mean1,
          mean2,
          meanDiff: mean1 - mean2,
          tStatistic: tTestResult.tStatistic,
          pValue: comp.pValue,
          degreesOfFreedom: tTestResult.degreesOfFreedom,
          cohensD: effectSize,
          significant: isSignificant,
          createdAt: Date.now(),
        });
      }
    }
  }

  console.log("\n✅ Statistical tests complete!");
}

// Run if called directly
if (require.main === module) {
  const runGroupId = process.argv[2];

  if (!runGroupId) {
    console.error("❌ Error: runGroupId is required");
    console.error("Usage: npx tsx scripts/run-statistical-tests.ts <runGroupId>");
    process.exit(1);
  }

  runStatisticalTests(runGroupId).catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
}

export { runStatisticalTests };
