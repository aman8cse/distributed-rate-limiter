import "dotenv/config";
import { redis } from "./config/redis.js";

try {
  console.log("Redis PING:", await redis.ping());
} finally {
  await redis.quit();
}