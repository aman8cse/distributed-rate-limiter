export { RateLimiter, RateLimiterUnavailableError } from "./core/RateLimiter.js";
export { TokenBucket } from "./core/TokenBucket.js";
export { InMemoryStore } from "./store/InMemoryStore.js";
export { RedisStore } from "./store/RedisStore.js";
export type { RedisStoreOptions } from "./store/RedisStore.js";
export { rateLimit } from "./middleware/rateLimiter.js";

export type { RateLimiterConfig } from "./core/RateLimiter.js";

export type {
  RateLimitDecision,
  RateLimitPolicy,
  TokenBucketConfig,
  TokenBucketState,
} from "./core/types.js";

export type { RateLimitStore } from "./store/RateLimitStore.js";