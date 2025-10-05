import { mutation } from "./_generated/server";

/**
 * Clear all data from all tables
 * WARNING: This is a destructive operation and cannot be undone
 */
export const clearAllData = mutation(async ({ db }) => {
  console.log("🗑️  [Admin] Starting to clear all data...");

  // Delete all runs
  const runs = await db.query("runs").collect();
  console.log(`  → Deleting ${runs.length} runs...`);
  for (const run of runs) {
    await db.delete(run._id);
  }

  // Delete all sentiment analysis
  const sentimentAnalysis = await db.query("sentiment_analysis").collect();
  console.log(`  → Deleting ${sentimentAnalysis.length} sentiment analysis records...`);
  for (const sentiment of sentimentAnalysis) {
    await db.delete(sentiment._id);
  }

  // Delete all color analysis
  const colorAnalysis = await db.query("color_analysis").collect();
  console.log(`  → Deleting ${colorAnalysis.length} color analysis records...`);
  for (const color of colorAnalysis) {
    await db.delete(color._id);
  }

  // Delete all materiality analysis
  const materialityAnalysis = await db.query("materiality_analysis").collect();
  console.log(`  → Deleting ${materialityAnalysis.length} materiality analysis records...`);
  for (const materiality of materialityAnalysis) {
    await db.delete(materiality._id);
  }

  console.log("🗑️  [Admin] ✓ All data cleared successfully");

  return {
    success: true,
    deleted: {
      runs: runs.length,
      sentimentAnalysis: sentimentAnalysis.length,
      colorAnalysis: colorAnalysis.length,
      materialityAnalysis: materialityAnalysis.length,
    },
  };
});
