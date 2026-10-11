import type { TokenBucketConfig, RateLimitDecision, TokenBucketState } from "../core/types.js";
import type { RateLimitStore } from "./RateLimitStore.js";
import { TokenBucket } from "../core/TokenBucket.js";

export class InMemoryStore implements RateLimitStore {
  private readonly store = new Map<string, TokenBucketState>();

  async consume(key: string, config: TokenBucketConfig, now: number): Promise<RateLimitDecision> {
    const state = this.store.get(key) ?? { tokens: config.capacity, lastRefillTime: now };
    const result = TokenBucket.consume(state, config, now);
    this.store.set(key, result.state);
    return result.decision;
  }
}