import type { RateLimitPolicy } from "../core/types.js";

export const policies = {
  products: { name: "products", capacity: 100, refillRate: 10 },
  orders: { name: "orders", capacity: 10, refillRate: 1 },
  login: { name: "login", capacity: 5, refillRate: 0.1 },
} as const satisfies Record<string, RateLimitPolicy>;