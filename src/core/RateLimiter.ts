import type { RateLimitDecision, RateLimitPolicy } from "./types.js";
import type { RateLimitStore } from "../store/RateLimitStore.js";

export class RateLimiter {
  constructor(private readonly store: RateLimitStore) {}

  public async allow(key: string, policy: RateLimitPolicy): Promise<RateLimitDecision> {
    return this.store.consume(key, policy, Date.now());
  }
}