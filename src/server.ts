import "dotenv/config";
import express from "express";
import { redis } from "./config/redis.js";
import { RateLimiter } from "./core/RateLimiter.js";
import { RedisStore } from "./store/RedisStore.js";
import { policies } from "./config/policies.js";
import { rateLimit } from "./middleware/rateLimiter.js";

const app = express();
const limiter = new RateLimiter(new RedisStore(redis));

app.get("/api/products", rateLimit(limiter, { policy: policies.products }), (_req, res) => {
  res.json({ products: ["Laptop", "Phone"] });
});

app.get("/api/orders", rateLimit(limiter, { policy: policies.orders }), (_req, res) => {
  res.json({ orders: [] });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));