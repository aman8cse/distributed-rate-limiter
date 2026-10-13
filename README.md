# Distributed Rate Limiter

A TypeScript rate-limiting library for Node.js and Express, supporting
in-memory and Redis-backed distributed rate limiting.

Use it to limit incoming requests by client identity, protect sensitive
endpoints, and share rate-limit state across multiple application instances.

## Features

- Token Bucket rate-limiting algorithm
- Express middleware
- In-memory storage
- Redis-backed distributed rate limiting
- Atomic Redis updates using a Lua script
- Configurable rate-limit policies
- Configurable in-memory fallback when Redis fails
- TypeScript declarations
- Custom client-key generation

## Installation

```bash
npm install distributed-rate-limiter express ioredis
```

If your project uses TypeScript, the package includes TypeScript declarations.

## Quick Start

```typescript
import express from "express";

import {
  RateLimiter,
  InMemoryStore,
  rateLimit,
} from "distributed-rate-limiter";

const app = express();

const limiter = new RateLimiter(
  new InMemoryStore(),
);

const policy = {
  name: "api",
  capacity: 10,
  refillRate: 1,
};

app.get(
  "/api",
  rateLimit(limiter, { policy }),
  (_req, res) => {
    res.json({ message: "Request allowed" });
  },
);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

This policy starts with 10 tokens and refills at one token per second.

Each allowed request consumes one token.

When no token is available, the middleware returns HTTP 429.

## Redis-backed Rate Limiting

For distributed rate limiting, use Redis as the shared store.

```typescript
import express from "express";
import Redis from "ioredis";

import {
  RateLimiter,
  RedisStore,
  rateLimit,
} from "distributed-rate-limiter";

const app = express();

const redis = new Redis(process.env.REDIS_URL!);

const limiter = new RateLimiter(
  new RedisStore(redis),
);

const policy = {
  name: "api",
  capacity: 100,
  refillRate: 10,
};

app.get(
  "/api",
  rateLimit(limiter, { policy }),
  (_req, res) => {
    res.json({ message: "Request allowed" });
  },
);

app.listen(3000);
```

Configure `REDIS_URL` in your environment.

Each application deployment should use its own appropriately secured Redis
connection. Multiple application instances can share rate-limit state by
using the same Redis database and key namespace.

Do not commit Redis credentials to source control.

## Rate-Limit Policies

A policy contains:

| Property | Description |
|---|---|
| `name` | Identifies the policy and separates its rate-limit keys |
| `capacity` | Maximum number of tokens the bucket can hold |
| `refillRate` | Tokens added per second |

Example:

```typescript
const loginPolicy = {
  name: "login",
  capacity: 5,
  refillRate: 0.1,
};
```

This allows up to five initial requests and refills at 0.1 tokens per second.

A token bucket is not a fixed-window limiter. Requests are permitted according
to the number of tokens currently available.

## Custom Client Identity

By default, the middleware uses the request IP address as the client key.

You can customize it:

```typescript
app.get(
  "/api/profile",
  rateLimit(limiter, {
    policy,
    getKey: (req) => {
      return req.header("x-user-id") ?? req.ip ?? "unknown";
    },
  }),
  (_req, res) => {
    res.json({ message: "Request allowed" });
  },
);
```

Only use identity values that your application can trust.

Do not trust arbitrary client-provided identity headers unless your application
authenticates or validates them.

If your application runs behind a reverse proxy, configure Express proxy
trust appropriately before relying on `req.ip`.

## Redis Failure and In-Memory Fallback

By default, `fallbackLimit` is zero.

```typescript
const limiter = new RateLimiter(
  new RedisStore(redis),
  { fallbackLimit: 0 },
);
```

If the Redis-backed store fails, the limiter fails closed. The middleware
returns HTTP 503 rather than allowing the request through without a rate-limit
decision.

To enable a local fallback:

```typescript
const limiter = new RateLimiter(
  new RedisStore(redis),
  { fallbackLimit: 5 },
);
```

When Redis fails, the limiter uses a local in-memory token bucket with the
configured fallback capacity.

The fallback uses the policy's refill rate.

### Important limitations

- In-memory fallback state is local to each application process.
- Multiple application instances do not share fallback state.
- Aggregate request allowance may increase during a Redis outage.
- A timed-out Redis operation may still execute on the Redis server.
- Redis recovery does not synchronize the local fallback bucket with Redis.

Choose fail-closed behavior for sensitive endpoints when enforcing a global
limit is more important than availability.

## HTTP Responses

Allowed requests continue to the next Express handler.

Rate-limited requests receive:

```http
HTTP/1.1 429 Too Many Requests
```

The middleware includes rate-limit headers and sets `Retry-After` when the
decision provides a retry duration.

When the rate limiter is unavailable and fallback is disabled, the middleware
returns HTTP 503.

## Architecture

```text
Express Middleware
        |
        v
    RateLimiter
        |
        v
  RateLimitStore
     /       \
    v         v
InMemory    RedisStore
              |
              v
          Lua Script
              |
              v
             Redis
```

The store interface separates the rate-limiting orchestration from the
storage implementation.

The Redis Lua script performs the token-bucket update atomically within Redis.

When multiple application instances use the same Redis keys, they share the
same distributed rate-limit state.

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/aman8cse/distributed-rate-limiter.git
cd distributed-rate-limiter
npm ci
```

Run the unit tests:

```bash
npm test
```

Run TypeScript type checking:

```bash
npx tsc --noEmit
```

Build the package:

```bash
npm run build
```

Inspect the package contents:

```bash
npm pack --dry-run
```

The build compiles TypeScript and copies the Lua script into `dist/store`.

## Testing

The unit tests cover the token-bucket algorithm and rate-limiter behavior,
including fallback behavior.

Redis-backed behavior should also be tested against a dedicated Redis instance.

## Contributing

Contributions and bug reports are welcome.

Before submitting a change:

1. Run the test suite.
2. Run TypeScript type checking.
3. Build the package.
4. Verify any changes to the public API and documentation.

Please include regression tests for bug fixes.

## License

See [LICENSE](./LICENSE).