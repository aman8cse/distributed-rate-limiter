import { redis } from "./config/redis.js";
import { RateLimiter } from "./core/RateLimiter.js";
import { RedisStore } from "./store/RedisStore.js";

const store = new RedisStore(redis);

const limiter = new RateLimiter(store, {
  capacity: 5,
  refillRate: 1,
});

for (let i = 1; i <= 7; i++) {
  const result = await limiter.allow("user:123");
  console.log(`Request ${i}:`, result);
}

await redis.quit();