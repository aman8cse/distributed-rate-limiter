import "dotenv/config";
import { redis } from "./config/redis.js";
import { RateLimiter } from "./core/RateLimiter.js";
import { RedisStore } from "./store/RedisStore.js";
import { policies } from "./config/policies.js";

const limiter = new RateLimiter(new RedisStore(redis));

try {
  
} finally {
  await redis.quit();
}