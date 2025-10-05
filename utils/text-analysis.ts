/**
 * Text Analysis Utilities
 * Shared utilities for analyzing text content across all analysis pipelines
 */

/**
 * Count occurrences of keywords in text (case-insensitive)
 *
 * @param text - The text to search
 * @param keywords - Array of keywords to count
 * @returns Number of keyword matches found
 *
 * @example
 * countKeywords("I feel joyful and happy", ["joy", "happy"]) // returns 2
 */
export function countKeywords(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.filter(word => lowerText.includes(word)).length;
}

/**
 * Normalize scores to 0-1 range based on maximum value
 *
 * @param scores - Object with numeric scores
 * @returns Normalized scores (0-1 range)
 *
 * @example
 * normalizeScores({ joy: 10, sadness: 5 }) // returns { joy: 1, sadness: 0.5 }
 */
export function normalizeScores(scores: Record<string, number>): Record<string, number> {
  const max = Math.max(...Object.values(scores));
  if (max === 0) return scores;

  return Object.fromEntries(
    Object.entries(scores).map(([key, value]) => [key, value / max])
  );
}

/**
 * Count unique words in text (case-insensitive, punctuation removed)
 *
 * @param text - The text to analyze
 * @returns Number of unique words
 *
 * @example
 * countUniqueWords("The quick brown fox jumps over the lazy dog") // returns 8
 */
export function countUniqueWords(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);

  return new Set(words).size;
}

/**
 * Count total words in text
 *
 * @param text - The text to analyze
 * @returns Number of words
 *
 * @example
 * countWords("Hello world") // returns 2
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Calculate normalized score based on keyword counts
 * Returns value between 0 and 1 based on the ratio of matching keywords
 *
 * @param text - The text to search
 * @param keywords - Array of keywords to count
 * @param maxScore - Maximum expected count (defaults to keywords.length)
 * @returns Normalized score (0-1)
 */
export function calculateKeywordScore(
  text: string,
  keywords: string[],
  maxScore: number = keywords.length
): number {
  const count = countKeywords(text, keywords);
  return Math.min(count / maxScore, 1);
}
