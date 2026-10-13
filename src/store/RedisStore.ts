import { Redis } from "ioredis";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { RateLimitDecision, RateLimitPolicy } from "../core/types.js";
import type { RateLimitStore } from "./RateLimitStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptPath = join(__dirname, "tokenBucket.lua");

export interface RedisStoreOptions {
  timeoutMs?: number;
}

export class RedisStore implements RateLimitStore {
  private readonly script: Promise<string>;
  private readonly timeoutMs: number;

  constructor(private readonly redis: Redis, options: RedisStoreOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 1000;

    if (
      !Number.isFinite(this.timeoutMs) ||
      this.timeoutMs <= 0
    ) {
      throw new Error("timeoutMs must be a positive number");
    }
    this.script = readFile(scriptPath, "utf8");
  }

  async consume(key: string, policy: RateLimitPolicy, now: number): Promise<RateLimitDecision> {
    const script = await this.script;

    const result = await new Promise<[number, number, number]>(
      (resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("Redis operation timed out"));
        }, this.timeoutMs);

        this.redis
          .eval(
            script,
            1,
            key,
            policy.capacity,
            policy.refillRate,
            now,
          )
          .then((value) => {
            clearTimeout(timer);
            resolve(value as [number, number, number]);
          })
          .catch((error: unknown) => {
            clearTimeout(timer);
            reject(error);
          });
      },
    );
    const [allowed, remaining, retryAfter] = result;

    return allowed
      ? { allowed: true, remaining }
      : { allowed: false, remaining, retryAfterSeconds: retryAfter };
  }
}