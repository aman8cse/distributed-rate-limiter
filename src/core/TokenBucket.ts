import type {
  RateLimitDecision,
  TokenBucketConfig,
  TokenBucketState,
} from "./types.js";

export class TokenBucket {
  public static consume(
    state: TokenBucketState,
    config: TokenBucketConfig,
    now: number,
  ): {
    state: TokenBucketState;
    decision: RateLimitDecision;
  } {
    const elapsedSeconds =
      (now - state.lastRefillTime) / 1000;

    const tokensToAdd =
      Math.max(0, elapsedSeconds) * config.refillRate;

    const tokens = Math.min(
      config.capacity,
      state.tokens + tokensToAdd,
    );

    const updatedState: TokenBucketState = {
      tokens,
      lastRefillTime: now,
    };

    if (tokens < 1) {
      return {
        state: updatedState,
        decision: {
          allowed: false,
          remaining: Math.floor(tokens),
          retryAfterSeconds: Math.ceil(
            (1 - tokens) / config.refillRate,
          ),
        },
      };
    }

    return {
      state: {
        ...updatedState,
        tokens: tokens - 1,
      },
      decision: {
        allowed: true,
        remaining: Math.floor(tokens - 1),
      },
    };
  }
}