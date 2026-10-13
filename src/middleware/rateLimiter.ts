import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type { RateLimitPolicy } from "../core/types.js";
import {
  RateLimiter,
  RateLimiterUnavailableError,
} from "../core/RateLimiter.js";

interface RateLimiterOptions {
  policy: RateLimitPolicy;
  getKey?: (req: Request) => string;
}

export function rateLimit(
  limiter: RateLimiter,
  options: RateLimiterOptions,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const key =
        options.getKey?.(req) ??
        req.ip ??
        "unknown";

      const result = await limiter.allow(
        `${options.policy.name}:${key}`,
        options.policy,
      );

      res.setHeader(
        "X-RateLimit-Limit",
        options.policy.capacity,
      );

      res.setHeader(
        "X-RateLimit-Remaining",
        result.remaining,
      );

      if (!result.allowed) {
        if (result.retryAfterSeconds !== undefined) {
          res.setHeader(
            "Retry-After",
            result.retryAfterSeconds,
          );
        }

        res.status(429).json({
          error: "Too many requests",
        });

        return;
      }

      next();
    } catch (error) {
      if (error instanceof RateLimiterUnavailableError) {
        res.status(503).json({
          error: "Rate limiting service unavailable",
        });

        return;
      }

      next(error);
    }
  };
}