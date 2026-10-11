import "dotenv/config";
import { redis } from "./config/redis.js";
import { RateLimiter } from "./core/RateLimiter.js";
import { RedisStore } from "./store/RedisStore.js";

const limiter = new RateLimiter(new RedisStore(redis), { capacity: 5, refillRate: 1 });

try {
  const key = `test:concurrent:${Date.now()}`;
  const results = await Promise.all(Array.from({ length: 20 }, () => limiter.allow(key)));

  const allowed = results.filter(r => r.allowed).length;
  const rejected = results.filter(r => !r.allowed).length;

  console.log({ total: results.length, allowed, rejected });
} finally {
  await redis.quit();
}