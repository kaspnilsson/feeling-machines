/**
 * Sentiment analysis runner
 */
"use node";

import { AnalysisRunner, AnalysisResult, RunData } from "../analysisRunner";
import { DatabaseWriter } from "../_generated/server";
import { analyzeSentiment } from "../../scripts/analyze-sentiment";

interface SentimentAnalysisResult extends AnalysisResult {
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    neutral: number;
  };
  valence: number;
  arousal: number;
  wordCount: number;
  uniqueWords: number;
  abstractness: number;
}

export class SentimentRunner extends AnalysisRunner<SentimentAnalysisResult> {
  readonly name = "sentiment";
  readonly requiresImage = false;

  async analyze(data: RunData): Promise<SentimentAnalysisResult> {
    const result = await analyzeSentiment({
      runId: data.runId,
      artistSlug: data.artistSlug,
      statement: data.artistStmt,
    });

    return {
      runId: data.runId,
      artistSlug: data.artistSlug,
      emotions: result.emotions,
      valence: result.valence,
      arousal: result.arousal,
      wordCount: result.wordCount,
      uniqueWords: result.uniqueWords,
      abstractness: result.abstractness,
      createdAt: Date.now(),
    };
  }

  async save(db: DatabaseWriter, result: SentimentAnalysisResult): Promise<void> {
    await db.insert("sentiment_analysis", {
      runId: result.runId,
      artistSlug: result.artistSlug,
      emotions: result.emotions,
      valence: result.valence,
      arousal: result.arousal,
      wordCount: result.wordCount,
      uniqueWords: result.uniqueWords,
      abstractness: result.abstractness,
      createdAt: result.createdAt,
    });
  }
}
