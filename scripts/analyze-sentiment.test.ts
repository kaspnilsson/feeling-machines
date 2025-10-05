import { describe, it, expect } from 'vitest';
import { analyzeSentiment, extractEmotions, calculateValence } from '@/scripts/analyze-sentiment';

describe('Sentiment Analysis', () => {
  describe('extractEmotions', () => {
    it('should detect joy in positive artistic statement', () => {
      const statement = 'I create luminous, uplifting spaces filled with radiant color and hope.';
      const emotions = extractEmotions(statement);

      expect(emotions.joy).toBeGreaterThan(0.5);
      expect(emotions.sadness).toBeLessThan(0.3);
    });

    it('should detect sadness in melancholic statement', () => {
      const statement = 'I make a quiet conflation of memory and light: a meditative space where small losses become luminous.';
      const emotions = extractEmotions(statement);

      expect(emotions.sadness).toBeGreaterThan(0);
      expect(emotions.neutral).toBeGreaterThan(0);
    });

    it('should detect multiple emotions in complex statement', () => {
      const statement = 'My work explores the sublime terror of infinite space, yet offers gentle refuge.';
      const emotions = extractEmotions(statement);

      expect(emotions.fear).toBeGreaterThan(0.2);
      expect(emotions.neutral).toBeGreaterThan(0.2);
    });
  });

  describe('calculateValence', () => {
    it('should return positive valence for uplifting statement', () => {
      const statement = 'I create joyful, vibrant celebrations of light and color.';
      const valence = calculateValence(statement);

      expect(valence).toBeGreaterThan(0.3);
      expect(valence).toBeLessThanOrEqual(1);
    });

    it('should return negative valence for dark statement', () => {
      const statement = 'I explore the haunting emptiness of forgotten memories and decay.';
      const valence = calculateValence(statement);

      expect(valence).toBeLessThan(0);
      expect(valence).toBeGreaterThanOrEqual(-1);
    });

    it('should return neutral valence for balanced statement', () => {
      const statement = 'I work with materials and space to create visual compositions.';
      const valence = calculateValence(statement);

      expect(valence).toBeGreaterThan(-0.3);
      expect(valence).toBeLessThan(0.3);
    });
  });

  describe('analyzeSentiment', () => {
    it('should return complete sentiment analysis', async () => {
      const statement = 'I create transitional landscapes that exist between states of being.';
      const analysis = await analyzeSentiment({
        runId: 'test-run-1',
        artistSlug: 'test-artist',
        statement,
      });

      expect(analysis).toMatchObject({
        runId: 'test-run-1',
        artistSlug: 'test-artist',
        emotions: expect.objectContaining({
          joy: expect.any(Number),
          sadness: expect.any(Number),
          anger: expect.any(Number),
          fear: expect.any(Number),
          surprise: expect.any(Number),
          neutral: expect.any(Number),
        }),
        valence: expect.any(Number),
        arousal: expect.any(Number),
        wordCount: expect.any(Number),
        uniqueWords: expect.any(Number),
        abstractness: expect.any(Number),
      });
    });

    it('should calculate word statistics correctly', async () => {
      const statement = 'I create beautiful spaces. These spaces invite reflection. The reflection is beautiful.';
      const analysis = await analyzeSentiment({
        runId: 'test-run-2',
        artistSlug: 'test-artist',
        statement,
      });

      expect(analysis.wordCount).toBe(12); // Updated to match actual word count
      expect(analysis.uniqueWords).toBeLessThan(analysis.wordCount); // "beautiful", "spaces", "reflection" repeated
    });
  });
});
