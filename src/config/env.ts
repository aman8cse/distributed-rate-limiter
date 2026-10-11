const redisUrl = process.env.REDIS_URL;

if (!redisUrl) throw new Error("REDIS_URL is not defined");

export const env = {
  redisUrl,
} as const;