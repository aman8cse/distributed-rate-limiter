export interface TokenBucketState {
    tokens: number;
    lastRefillTime: number;
}

export interface TokenBucketConfig {
    readonly capacity: number;
    readonly refillRate: number;
}

export interface RateLimitDecision {
    readonly allowed: boolean;
    readonly remaining: number;
    readonly retryAfterSeconds?: number;
}

export type RateLimitPolicyName = string;

export interface RateLimitPolicy {
  readonly name: RateLimitPolicyName;
  readonly capacity: number;
  readonly refillRate: number;
}