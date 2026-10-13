import type { RateLimitDecision, RateLimitPolicy } from "./types.js";
import type { RateLimitStore } from "../store/RateLimitStore.js";
import { InMemoryStore } from "../store/InMemoryStore.js";

export interface RateLimiterConfig {
  fallbackLimit?: number;
}

export class RateLimiterUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Rate limiter is unavailable", { cause });
    this.name = "RateLimiterUnavailableError";
  }
}

export class RateLimiter {
  private readonly fallbackStore = new InMemoryStore();
  private readonly fallbackLimit: number;

  constructor(
    private readonly store: RateLimitStore,
    config: RateLimiterConfig = {},
  ) {
    this.fallbackLimit = config.fallbackLimit ?? 0;

    if (
      !Number.isFinite(this.fallbackLimit) ||
      this.fallbackLimit < 0
    ) {
      throw new Error("fallbackLimit must be a non-negative number");
    }
  }

  public async allow(
    key: string,
    policy: RateLimitPolicy,
  ): Promise<RateLimitDecision> {
    const now = Date.now();

    try {
      return await this.store.consume(key, policy, now);
    } catch (error) {
      if (this.fallbackLimit === 0) {
        throw new RateLimiterUnavailableError(error);
      }

      try {
        const fallbackPolicy: RateLimitPolicy = {
          ...policy,
          capacity: this.fallbackLimit,
        };

        return await this.fallbackStore.consume(
          key,
          fallbackPolicy,
          now,
        );
      } catch (fallbackError) {
        throw new RateLimiterUnavailableError(fallbackError);
      }
    }
  }
}