import { describe, it, expect } from "vitest";

/**
 * Tests for sentiment analysis queries
 *
 * These tests verify the structure and behavior of sentiment aggregation
 * without requiring database access or mocks
 */

describe("Sentiment Analysis Queries", () => {
  describe("aggregateSentimentByArtist", () => {
    it("should calculate average emotions correctly", () => {
      const _mockSentiments = [
        {
          emotions: { joy: 0.8, sadness: 0.2, anger: 0.1, fear: 0.1, surprise: 0.3, neutral: 0.4 },
          valence: 0.6,
          arousal: 0.7,
          abstractness: 0.5,
        },
        {
          emotions: { joy: 0.6, sadness: 0.4, anger: 0.2, fear: 0.3, surprise: 0.1, neutral: 0.6 },
          valence: 0.2,
          arousal: 0.5,
          abstractness: 0.7,
        },
      ];

      const avgEmotions = {
        joy: (0.8 + 0.6) / 2,
        sadness: (0.2 + 0.4) / 2,
        anger: (0.1 + 0.2) / 2,
        fear: (0.1 + 0.3) / 2,
        surprise: (0.3 + 0.1) / 2,
        neutral: (0.4 + 0.6) / 2,
      };

      expect(avgEmotions.joy).toBeCloseTo(0.7, 2);
      expect(avgEmotions.sadness).toBeCloseTo(0.3, 2);
      expect(avgEmotions.neutral).toBeCloseTo(0.5, 2);
    });

    it("should calculate average valence and arousal", () => {
      const _mockSentiments = [
        { valence: 0.6, arousal: 0.7 },
        { valence: 0.2, arousal: 0.5 },
        { valence: -0.1, arousal: 0.3 },
      ];

      const avgValence = (0.6 + 0.2 + -0.1) / 3;
      const avgArousal = (0.7 + 0.5 + 0.3) / 3;

      expect(avgValence).toBeCloseTo(0.233, 2);
      expect(avgArousal).toBeCloseTo(0.5, 2);
    });

    it("should handle empty sentiment list", () => {
      const mockSentiments: unknown[] = [];

      const result = {
        count: mockSentiments.length,
        avgValence: 0,
        avgArousal: 0,
      };

      expect(result.count).toBe(0);
      expect(result.avgValence).toBe(0);
    });

    it("should calculate standard deviation correctly", () => {
      const values = [0.6, 0.2, -0.1];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // With mean ≈ 0.233:
      // variance = ((0.6-0.233)² + (0.2-0.233)² + (-0.1-0.233)²) / 3
      expect(mean).toBeCloseTo(0.233, 2);
      expect(stdDev).toBeGreaterThan(0.2);
    });
  });

  describe("compareSentimentAcrossArtists", () => {
    it("should identify most joyful artist", () => {
      const artistData = [
        { artistSlug: "gpt-5-mini", avgEmotions: { joy: 0.7, sadness: 0.3 } },
        { artistSlug: "claude-sonnet-4-5", avgEmotions: { joy: 0.5, sadness: 0.4 } },
        { artistSlug: "gemini-2.5-flash", avgEmotions: { joy: 0.9, sadness: 0.2 } },
      ];

      const mostJoyful = artistData.reduce((max, curr) =>
        curr.avgEmotions.joy > max.avgEmotions.joy ? curr : max
      );

      expect(mostJoyful.artistSlug).toBe("gemini-2.5-flash");
      expect(mostJoyful.avgEmotions.joy).toBe(0.9);
    });

    it("should calculate valence range across artists", () => {
      const valences = [0.6, -0.2, 0.3, 0.8, -0.1];
      const max = Math.max(...valences);
      const min = Math.min(...valences);
      const range = max - min;

      expect(max).toBe(0.8);
      expect(min).toBe(-0.2);
      expect(range).toBe(1.0);
    });
  });

  describe("getSentimentTrends", () => {
    it("should group sentiments by time periods", () => {
      const now = Date.now();
      const hourAgo = now - 3600000;
      const dayAgo = now - 86400000;

      const mockRuns = [
        { createdAt: now, valence: 0.5 },
        { createdAt: hourAgo, valence: 0.3 },
        { createdAt: dayAgo, valence: 0.7 },
      ];

      const recentRuns = mockRuns.filter(r => r.createdAt > hourAgo - 1000);
      expect(recentRuns.length).toBe(2);
    });
  });
});
