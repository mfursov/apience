/**
 * Apience Rate Limit Module.
 *
 * Provides in-memory rate limiting middleware for Express.js.
 *
 * Types:
 * - RateLimitConfig: Rate limiter configuration.
 * - RateLimitResult: Result from a rate limit consume operation.
 *
 * Utils:
 * - addRateLimitHeaders: Add RFC-compliant rate limit headers to response.
 * - msToSeconds: Convert milliseconds to seconds.
 *
 * Implementations:
 * - InMemoryRateLimiter: Sliding window counter rate limiter.
 * - createRateLimiterMiddleware: Create rate limit middleware.
 */

export type { RateLimitConfig, RateLimitResult } from './apience-rate-limit.types';
export { addRateLimitHeaders, msToSeconds } from './apience-rate-limit.utils';
export { InMemoryRateLimiter, createRateLimiterMiddleware } from './in-memory-rate-limiter';
