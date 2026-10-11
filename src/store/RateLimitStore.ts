import type { TokenBucketConfig, TokenBucketState, RateLimitDecision } from "../core/types.js";

export interface RateLimitStore {
  consume(key: string, config: TokenBucketConfig, now: number): Promise<RateLimitDecision>;
}