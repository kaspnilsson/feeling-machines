/**
 * Phase 3: Sentiment Analysis
 * Extracts emotional tone from Artist statements
 */

export interface EmotionScores {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  neutral: number;
}

export interface SentimentAnalysis {
  runId: string;
  artistSlug: string;
  emotions: EmotionScores;
  valence: number;    // -1 (negative) to 1 (positive)
  arousal: number;    // 0 (calm) to 1 (excited)
  wordCount: number;
  uniqueWords: number;
  abstractness: number; // ratio of abstract to concrete nouns
}

import { countKeywords, normalizeScores } from '../utils/text-analysis';

/**
 * Extract emotion scores from text using keyword-based heuristics
 * TODO: Replace with proper sentiment model (e.g., Hugging Face API)
 */
export function extractEmotions(text: string): EmotionScores {
  // Simple keyword-based scoring (placeholder for ML model)
  const joyKeywords = ['joy', 'happy', 'delight', 'radiant', 'luminous', 'uplifting', 'vibrant', 'celebration'];
  const sadnessKeywords = ['loss', 'melancholy', 'sadness', 'quiet', 'loss', 'sorrow', 'grief', 'forgotten'];
  const angerKeywords = ['anger', 'rage', 'fury', 'violent', 'harsh', 'brutal'];
  const fearKeywords = ['fear', 'terror', 'dread', 'anxiety', 'haunting', 'void', 'abyss', 'emptiness'];
  const surpriseKeywords = ['surprise', 'astonish', 'wonder', 'unexpected', 'shock', 'sudden'];

  const joyCount = countKeywords(text, joyKeywords);
  const sadnessCount = countKeywords(text, sadnessKeywords);
  const angerCount = countKeywords(text, angerKeywords);
  const fearCount = countKeywords(text, fearKeywords);
  const surpriseCount = countKeywords(text, surpriseKeywords);

  const total = joyCount + sadnessCount + angerCount + fearCount + surpriseCount;
  const neutralScore = total === 0 ? 1 : Math.max(0, 1 - (total * 0.2));

  // Normalize scores
  const rawScores = { joy: joyCount, sadness: sadnessCount, anger: angerCount, fear: fearCount, surprise: surpriseCount };
  const normalized = normalizeScores(rawScores);

  return {
    joy: normalized.joy,
    sadness: normalized.sadness,
    anger: normalized.anger,
    fear: normalized.fear,
    surprise: normalized.surprise,
    neutral: neutralScore,
  };
}

/**
 * Calculate valence (positive/negative sentiment) from text
 */
export function calculateValence(text: string): number {
  const positiveWords = [
    'beautiful', 'joy', 'happy', 'delight', 'radiant', 'luminous', 'uplifting',
    'vibrant', 'celebration', 'hope', 'love', 'gentle', 'tender', 'sublime'
  ];

  const negativeWords = [
    'loss', 'melancholy', 'sadness', 'grief', 'sorrow', 'decay', 'haunting',
    'void', 'emptiness', 'forgotten', 'terror', 'fear', 'dark', 'harsh'
  ];

  const positiveCount = countKeywords(text, positiveWords);
  const negativeCount = countKeywords(text, negativeWords);

  const total = positiveCount + negativeCount;
  if (total === 0) return 0;

  return (positiveCount - negativeCount) / total;
}

/**
 * Calculate arousal (calm/excited) from text
 */
export function calculateArousal(text: string): number {
  const highArousalWords = [
    'explosive', 'violent', 'intense', 'vibrant', 'radiant', 'terror',
    'ecstatic', 'frenzied', 'wild', 'surge', 'burst'
  ];

  const lowArousalWords = [
    'quiet', 'calm', 'gentle', 'soft', 'still', 'silent', 'slow',
    'meditative', 'peaceful', 'serene', 'tranquil'
  ];

  const highCount = countKeywords(text, highArousalWords);
  const lowCount = countKeywords(text, lowArousalWords);

  const total = highCount + lowCount;
  if (total === 0) return 0.5; // neutral arousal

  return highCount / total;
}

/**
 * Calculate abstractness score (abstract vs concrete language)
 */
export function calculateAbstractness(text: string): number {
  const abstractWords = [
    'concept', 'idea', 'essence', 'consciousness', 'being', 'existence',
    'thought', 'memory', 'feeling', 'emotion', 'meaning', 'transcend',
    'ineffable', 'liminal', 'ephemeral', 'transient'
  ];

  const concreteWords = [
    'paint', 'canvas', 'wood', 'metal', 'stone', 'fabric', 'silk',
    'oil', 'acrylic', 'brush', 'material', 'surface', 'object', 'wall'
  ];

  const abstractCount = countKeywords(text, abstractWords);
  const concreteCount = countKeywords(text, concreteWords);

  const total = abstractCount + concreteCount;
  if (total === 0) return 0.5; // neutral

  return abstractCount / total;
}

import { countWords, countUniqueWords } from '../utils/text-analysis';

/**
 * Analyze sentiment of an Artist statement
 *
 * Extracts emotional tone, valence, arousal, and abstractness from text
 * using keyword-based heuristics.
 *
 * @param input - Run metadata and statement text
 * @returns Complete sentiment analysis with emotion scores and metrics
 *
 * @example
 * const analysis = await analyzeSentiment({
 *   runId: "abc123",
 *   artistSlug: "claude-sonnet-4.5",
 *   statement: "I feel a deep sense of joy and wonder..."
 * });
 */
export async function analyzeSentiment(input: {
  runId: string;
  artistSlug: string;
  statement: string;
}): Promise<SentimentAnalysis> {
  const { runId, artistSlug, statement } = input;

  const emotions = extractEmotions(statement);
  const valence = calculateValence(statement);
  const arousal = calculateArousal(statement);
  const abstractness = calculateAbstractness(statement);

  const wordCount = countWords(statement);
  const uniqueWords = countUniqueWords(statement);

  return {
    runId,
    artistSlug,
    emotions,
    valence,
    arousal,
    wordCount,
    uniqueWords,
    abstractness,
  };
}
