import { Redis } from "ioredis";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { TokenBucketConfig, RateLimitDecision } from "../core/types.js";
import type { RateLimitStore } from "./RateLimitStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptPath = join(__dirname, "tokenBucket.lua");

export class RedisStore implements RateLimitStore {
  private readonly script: Promise<string>;

  constructor(private readonly redis: Redis) {
    this.script = readFile(scriptPath, "utf8");
  }

  async consume(key: string, config: TokenBucketConfig, now: number): Promise<RateLimitDecision> {
    const script = await this.script;

    const result = await this.redis.eval(script, 1, key, config.capacity, config.refillRate, now) as [number, number, number];
    const [allowed, remaining, retryAfter] = result;

    return allowed
      ? { allowed: true, remaining }
      : { allowed: false, remaining, retryAfterSeconds: retryAfter };
  }
}