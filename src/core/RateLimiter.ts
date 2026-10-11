import type { RateLimitDecision, TokenBucketConfig } from "./types.js";
import type { RateLimitStore } from "../store/RateLimitStore.js";

export class RateLimiter {
  constructor(private readonly store: RateLimitStore, private readonly config: TokenBucketConfig) {}

  public async allow(key: string): Promise<RateLimitDecision> {
    return this.store.consume(key, this.config, Date.now());
  }
}