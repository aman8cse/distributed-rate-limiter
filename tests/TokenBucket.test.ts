import { describe, expect, it } from "vitest";
import { TokenBucket } from "../src/core/TokenBucket.js";

describe("TokenBucket", () => {
  const config = {
    capacity: 3,
    refillRate: 1,
  };

  it("allows requests while tokens are available", () => {
    const state = {
      tokens: 3,
      lastRefillTime: 1000,
    };

    const result = TokenBucket.consume(
      state,
      config,
      1000,
    );

    expect(result.decision.allowed).toBe(true);
    expect(result.decision.remaining).toBe(2);
  });

  it("rejects requests when no tokens remain", () => {
    const state = {
      tokens: 0,
      lastRefillTime: 1000,
    };

    const result = TokenBucket.consume(
      state,
      config,
      1000,
    );

    expect(result.decision.allowed).toBe(false);
    expect(result.decision.retryAfterSeconds).toBe(1);
  });

  it("refills tokens over time", () => {
    const state = {
      tokens: 0,
      lastRefillTime: 1000,
    };

    const result = TokenBucket.consume(
      state,
      config,
      3000,
    );

    expect(result.decision.allowed).toBe(true);
    expect(result.decision.remaining).toBe(1);
  });
});