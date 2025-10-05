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

/**
 * Extract emotion scores from text using keyword-based heuristics
 * TODO: Replace with proper sentiment model (e.g., Hugging Face API)
 */
export function extractEmotions(text: string): EmotionScores {
  const lowerText = text.toLowerCase();

  // Simple keyword-based scoring (placeholder for ML model)
  const joyKeywords = ['joy', 'happy', 'delight', 'radiant', 'luminous', 'uplifting', 'vibrant', 'celebration'];
  const sadnessKeywords = ['loss', 'melancholy', 'sadness', 'quiet', 'loss', 'sorrow', 'grief', 'forgotten'];
  const angerKeywords = ['anger', 'rage', 'fury', 'violent', 'harsh', 'brutal'];
  const fearKeywords = ['fear', 'terror', 'dread', 'anxiety', 'haunting', 'void', 'abyss', 'emptiness'];
  const surpriseKeywords = ['surprise', 'astonish', 'wonder', 'unexpected', 'shock', 'sudden'];

  const countKeywords = (keywords: string[]) =>
    keywords.filter(word => lowerText.includes(word)).length;

  const joyCount = countKeywords(joyKeywords);
  const sadnessCount = countKeywords(sadnessKeywords);
  const angerCount = countKeywords(angerKeywords);
  const fearCount = countKeywords(fearKeywords);
  const surpriseCount = countKeywords(surpriseKeywords);

  const total = joyCount + sadnessCount + angerCount + fearCount + surpriseCount;
  const neutralScore = total === 0 ? 1 : Math.max(0, 1 - (total * 0.2));

  // Normalize scores
  const maxScore = Math.max(joyCount, sadnessCount, angerCount, fearCount, surpriseCount, 1);

  return {
    joy: joyCount / maxScore,
    sadness: sadnessCount / maxScore,
    anger: angerCount / maxScore,
    fear: fearCount / maxScore,
    surprise: surpriseCount / maxScore,
    neutral: neutralScore,
  };
}

/**
 * Calculate valence (positive/negative sentiment) from text
 */
export function calculateValence(text: string): number {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    'beautiful', 'joy', 'happy', 'delight', 'radiant', 'luminous', 'uplifting',
    'vibrant', 'celebration', 'hope', 'love', 'gentle', 'tender', 'sublime'
  ];

  const negativeWords = [
    'loss', 'melancholy', 'sadness', 'grief', 'sorrow', 'decay', 'haunting',
    'void', 'emptiness', 'forgotten', 'terror', 'fear', 'dark', 'harsh'
  ];

  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  const total = positiveCount + negativeCount;
  if (total === 0) return 0;

  return (positiveCount - negativeCount) / total;
}

/**
 * Calculate arousal (calm/excited) from text
 */
export function calculateArousal(text: string): number {
  const lowerText = text.toLowerCase();

  const highArousalWords = [
    'explosive', 'violent', 'intense', 'vibrant', 'radiant', 'terror',
    'ecstatic', 'frenzied', 'wild', 'surge', 'burst'
  ];

  const lowArousalWords = [
    'quiet', 'calm', 'gentle', 'soft', 'still', 'silent', 'slow',
    'meditative', 'peaceful', 'serene', 'tranquil'
  ];

  const highCount = highArousalWords.filter(word => lowerText.includes(word)).length;
  const lowCount = lowArousalWords.filter(word => lowerText.includes(word)).length;

  const total = highCount + lowCount;
  if (total === 0) return 0.5; // neutral arousal

  return highCount / total;
}

/**
 * Calculate abstractness score (abstract vs concrete language)
 */
export function calculateAbstractness(text: string): number {
  const lowerText = text.toLowerCase();

  const abstractWords = [
    'concept', 'idea', 'essence', 'consciousness', 'being', 'existence',
    'thought', 'memory', 'feeling', 'emotion', 'meaning', 'transcend',
    'ineffable', 'liminal', 'ephemeral', 'transient'
  ];

  const concreteWords = [
    'paint', 'canvas', 'wood', 'metal', 'stone', 'fabric', 'silk',
    'oil', 'acrylic', 'brush', 'material', 'surface', 'object', 'wall'
  ];

  const abstractCount = abstractWords.filter(word => lowerText.includes(word)).length;
  const concreteCount = concreteWords.filter(word => lowerText.includes(word)).length;

  const total = abstractCount + concreteCount;
  if (total === 0) return 0.5; // neutral

  return abstractCount / total;
}

/**
 * Count unique words in text
 */
function countUniqueWords(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);

  return new Set(words).size;
}

/**
 * Analyze sentiment of an Artist statement
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

  const wordCount = statement.split(/\s+/).filter(w => w.length > 0).length;
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
