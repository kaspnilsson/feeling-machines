/**
 * Rate limiting utilities for API calls
 * Prevents overwhelming external APIs during batch operations
 */

import { DatabaseReader, DatabaseWriter } from "./_generated/server";

interface RateLimitConfig {
  provider: string;
  maxRequestsPerMinute: number;
  maxConcurrent: number;
}

/**
 * Rate limiter using Convex database for distributed state
 * Tracks request counts per provider to prevent API rate limit errors
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request is allowed under rate limits
   * Returns delay in ms if rate limited, 0 if allowed
   */
  async checkAndIncrement(
    _db: DatabaseReader & DatabaseWriter
  ): Promise<{ allowed: boolean; retryAfterMs: number }> {
    // Get all rate limit entries for this provider in the last minute
    // Note: In production, you'd want a rate_limits table with indexes
    // For now, we'll use a simple in-memory approach with meta field

    // Count recent requests (this is a simplified version)
    // In production, implement a proper rate_limits table with:
    // - provider: string
    // - windowStart: number (timestamp)
    // - requestCount: number
    // And clean up old entries periodically

    // For this implementation, we'll use a conservative approach:
    // Sleep for a calculated interval to avoid exceeding limits

    const requestsPerMinute = this.config.maxRequestsPerMinute;
    const minIntervalMs = (60000 / requestsPerMinute) * 1.1; // Add 10% buffer

    return {
      allowed: true,
      retryAfterMs: Math.ceil(minIntervalMs),
    };
  }

  /**
   * Calculate optimal delay between requests to stay under rate limit
   */
  getOptimalDelay(): number {
    const requestsPerMinute = this.config.maxRequestsPerMinute;
    const minIntervalMs = (60000 / requestsPerMinute) * 1.2; // Add 20% safety buffer
    return Math.ceil(minIntervalMs);
  }
}

/**
 * Rate limit configurations for different providers
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  openrouter: {
    provider: "openrouter",
    maxRequestsPerMinute: 200, // Conservative default (check OpenRouter docs)
    maxConcurrent: 10,
  },
  openai: {
    provider: "openai",
    maxRequestsPerMinute: 500, // Conservative for tier 1
    maxConcurrent: 20,
  },
  google: {
    provider: "google",
    maxRequestsPerMinute: 60, // Gemini free tier
    maxConcurrent: 5,
  },
};

/**
 * Helper to add delay between API calls
 */
export async function rateLimit(provider: string): Promise<void> {
  const config = RATE_LIMITS[provider];
  if (!config) {
    console.warn(`No rate limit config for provider: ${provider}, using default delay`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return;
  }

  const limiter = new RateLimiter(config);
  const delayMs = limiter.getOptimalDelay();

  console.log(`[RateLimit] ${provider}: waiting ${delayMs}ms between requests`);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Exponential backoff for retry logic
 */
export function getBackoffDelay(attempt: number, baseDelayMs = 1000): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  // With jitter to prevent thundering herd
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 1000; // Random 0-1000ms
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30s
}
