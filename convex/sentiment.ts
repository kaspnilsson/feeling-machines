import { query } from "@/convex/_generated/server";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Get sentiment analysis for a specific run
 */
export const getSentimentForRun = query(
  async ({ db }, { runId }: { runId: Id<"runs"> }) => {
    return await db
      .query("sentiment_analysis")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .first();
  }
);

/**
 * Get all sentiment analyses for a specific artist
 */
export const getSentimentByArtist = query(
  async ({ db }, { artistSlug }: { artistSlug: string }) => {
    return await db
      .query("sentiment_analysis")
      .withIndex("by_artist", (q) => q.eq("artistSlug", artistSlug))
      .collect();
  }
);

/**
 * Get aggregated sentiment statistics for an artist
 */
export const getArtistSentimentStats = query(
  async ({ db }, { artistSlug }: { artistSlug: string }) => {
    const sentiments = await db
      .query("sentiment_analysis")
      .withIndex("by_artist", (q) => q.eq("artistSlug", artistSlug))
      .collect();

    if (sentiments.length === 0) {
      return null;
    }

    // Calculate averages
    const sum = sentiments.reduce(
      (acc, s) => ({
        joy: acc.joy + s.emotions.joy,
        sadness: acc.sadness + s.emotions.sadness,
        anger: acc.anger + s.emotions.anger,
        fear: acc.fear + s.emotions.fear,
        surprise: acc.surprise + s.emotions.surprise,
        neutral: acc.neutral + s.emotions.neutral,
        valence: acc.valence + s.valence,
        arousal: acc.arousal + s.arousal,
        abstractness: acc.abstractness + s.abstractness,
        wordCount: acc.wordCount + s.wordCount,
        uniqueWords: acc.uniqueWords + s.uniqueWords,
      }),
      {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        neutral: 0,
        valence: 0,
        arousal: 0,
        abstractness: 0,
        wordCount: 0,
        uniqueWords: 0,
      }
    );

    const count = sentiments.length;

    const avgEmotions = {
      joy: sum.joy / count,
      sadness: sum.sadness / count,
      anger: sum.anger / count,
      fear: sum.fear / count,
      surprise: sum.surprise / count,
      neutral: sum.neutral / count,
    };

    const avgValence = sum.valence / count;
    const avgArousal = sum.arousal / count;
    const avgAbstractness = sum.abstractness / count;
    const avgWordCount = sum.wordCount / count;
    const avgUniqueWords = sum.uniqueWords / count;

    // Calculate standard deviations for valence and arousal
    const valenceVariance =
      sentiments.reduce((sum, s) => sum + Math.pow(s.valence - avgValence, 2), 0) / count;
    const arousalVariance =
      sentiments.reduce((sum, s) => sum + Math.pow(s.arousal - avgArousal, 2), 0) / count;

    return {
      artistSlug,
      count,
      avgEmotions,
      avgValence,
      avgArousal,
      avgAbstractness,
      avgWordCount,
      avgUniqueWords,
      valenceStdDev: Math.sqrt(valenceVariance),
      arousalStdDev: Math.sqrt(arousalVariance),
    };
  }
);

/**
 * Compare sentiment statistics across all artists
 */
export const compareArtistSentiments = query(async ({ db }) => {
  const allSentiments = await db.query("sentiment_analysis").collect();

  // Group by artist
  const byArtist = allSentiments.reduce((acc, sentiment) => {
    if (!acc[sentiment.artistSlug]) {
      acc[sentiment.artistSlug] = [];
    }
    acc[sentiment.artistSlug].push(sentiment);
    return acc;
  }, {} as Record<string, typeof allSentiments>);

  // Calculate stats for each artist
  const artistStats = Object.entries(byArtist).map(([artistSlug, sentiments]) => {
    const count = sentiments.length;

    const avgEmotions = {
      joy: sentiments.reduce((sum, s) => sum + s.emotions.joy, 0) / count,
      sadness: sentiments.reduce((sum, s) => sum + s.emotions.sadness, 0) / count,
      anger: sentiments.reduce((sum, s) => sum + s.emotions.anger, 0) / count,
      fear: sentiments.reduce((sum, s) => sum + s.emotions.fear, 0) / count,
      surprise: sentiments.reduce((sum, s) => sum + s.emotions.surprise, 0) / count,
      neutral: sentiments.reduce((sum, s) => sum + s.emotions.neutral, 0) / count,
    };

    const avgValence = sentiments.reduce((sum, s) => sum + s.valence, 0) / count;
    const avgArousal = sentiments.reduce((sum, s) => sum + s.arousal, 0) / count;
    const avgAbstractness = sentiments.reduce((sum, s) => sum + s.abstractness, 0) / count;

    return {
      artistSlug,
      count,
      avgEmotions,
      avgValence,
      avgArousal,
      avgAbstractness,
    };
  });

  return artistStats.sort((a, b) => b.count - a.count);
});

/**
 * Get sentiment analysis for all runs in a run group
 */
export const getSentimentForRunGroup = query(
  async ({ db }, { runGroupId }: { runGroupId: string }) => {
    // Get all runs in the group
    const runs = await db
      .query("runs")
      .filter((q) => q.eq(q.field("runGroupId"), runGroupId))
      .collect();

    // Get sentiment for each run
    const sentiments = await Promise.all(
      runs.map(async (run) => {
        const sentiment = await db
          .query("sentiment_analysis")
          .withIndex("by_run", (q) => q.eq("runId", run._id))
          .first();

        return {
          runId: run._id,
          artistSlug: run.artistSlug,
          sentiment,
        };
      })
    );

    return sentiments;
  }
);
