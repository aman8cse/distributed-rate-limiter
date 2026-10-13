import type { RateLimitPolicy, RateLimitDecision } from "../core/types.js";

export interface RateLimitStore {
  consume(key: string, policy: RateLimitPolicy, now: number): Promise<RateLimitDecision>;
}