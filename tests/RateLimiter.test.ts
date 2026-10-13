import { describe, expect, it, vi } from "vitest";

import {
    RateLimiter,
    RateLimiterUnavailableError,
} from "../src/core/RateLimiter.js";

import type { RateLimitStore } from "../src/store/RateLimitStore.js";

import type {
    RateLimitDecision,
    RateLimitPolicy,
} from "../src/core/types.js";

const policy: RateLimitPolicy = {
    name: "test",
    capacity: 3,
    refillRate: 1,
};

describe("RateLimiter", () => {
    it("uses the primary store when it succeeds", async () => {
        const decision: RateLimitDecision = {
            allowed: true,
            remaining: 2,
        };

        const store: RateLimitStore = {
            consume: vi.fn().mockResolvedValue(decision),
        };

        const limiter = new RateLimiter(store);

        await expect(
            limiter.allow("client-1", policy),
        ).resolves.toEqual(decision);
    });

    it("uses the primary store again after it recovers", async () => {
        const store = {
            consume: vi
                .fn()
                .mockRejectedValueOnce(new Error("Redis unavailable"))
                .mockResolvedValue({
                    allowed: true,
                    remaining: 2,
                }),
        };

        const limiter = new RateLimiter(store, {
            fallbackLimit: 2,
        });

        // First call: primary store fails, so fallback is used.
        const first = await limiter.allow("client-1", policy);
        expect(first.allowed).toBe(true);

        // Second call: primary store succeeds again.
        const second = await limiter.allow("client-1", policy);
        expect(second.remaining).toBe(2);

        expect(store.consume).toHaveBeenCalledTimes(2);
    });

    it("fails closed when the primary store fails and fallback is disabled", async () => {
        const store: RateLimitStore = {
            consume: vi.fn().mockRejectedValue(
                new Error("Redis unavailable"),
            ),
        };

        const limiter = new RateLimiter(store);

        await expect(
            limiter.allow("client-1", policy),
        ).rejects.toBeInstanceOf(RateLimiterUnavailableError);
    });

    it("uses the local fallback when enabled", async () => {
        const store: RateLimitStore = {
            consume: vi.fn().mockRejectedValue(
                new Error("Redis unavailable"),
            ),
        };

        const limiter = new RateLimiter(store, {
            fallbackLimit: 2,
        });

        const first = await limiter.allow("client-1", policy);
        const second = await limiter.allow("client-1", policy);
        const third = await limiter.allow("client-1", policy);

        expect(first.allowed).toBe(true);
        expect(second.allowed).toBe(true);
        expect(third.allowed).toBe(false);
    });
});