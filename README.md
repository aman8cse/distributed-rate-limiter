# Distributed Rate Limiter

**One shared limit. Every server. Atomic by design.**

A distributed rate-limiting engine built with TypeScript, Node.js, Redis, and Lua. Designed to enforce consistent request limits across multiple application servers using shared Redis state and atomic token-bucket operations.

The goal is to make distributed rate limiting accessible to backend developers through a simple, reusable interface.

> **Project status:** In active development. The token-bucket algorithm, in-memory store, Upstash Redis integration, and atomic Redis operation have been implemented and tested. Express middleware, configurable policies, packaging, and production-hardening features are planned.

## The Problem

When an application runs multiple API servers, a rate limiter that stores counters in local memory cannot enforce a consistent global limit.

For example, suppose a user has a limit of 100 requests per minute and requests are distributed across three servers.

A local rate limiter could independently allow 100 requests on each server, effectively permitting up to 300 requests.

This project addresses that coordination problem through shared Redis state and atomic operations.

## How It Works

```text
                    Incoming Requests
                           |
                           v
                    API Gateway / App
                           |
                           v
                    Rate Limit Engine
                           |
                           v
                     Redis Store
                           |
                           v
                    Atomic Lua Script
                           |
                           v
                    Rate Limit Decision
                       /         \
                  Allowed       Rejected
                     |              |
                     v              v
                API Endpoint    HTTP 429
```

The rate-limiting engine determines whether a request should be permitted. Redis stores shared bucket state, and a Lua script performs the state update atomically.

This allows multiple application servers to coordinate through the same Redis-backed limiter.

## Current Features

* **Token Bucket algorithm:** Supports controlled bursts and time-based token refill.
* **TypeScript:** Strict typing and explicit interfaces between components.
* **Redis integration:** Uses Upstash Redis for shared state.
* **Atomic operations:** Lua executes the token-bucket state transition as one Redis operation.
* **Storage abstraction:** Separates the rate-limiting logic from the storage implementation.
* **In-memory implementation:** Supports local development and algorithm testing.
* **Concurrency testing:** Verified that 20 concurrent requests against a fresh bucket with capacity 5 result in 5 allowed requests and 15 rejected requests.

## Technology Stack

| Technology    | Purpose                                |
| ------------- | -------------------------------------- |
| TypeScript    | Typed application logic and interfaces |
| Node.js       | Runtime                                |
| Express       | Planned HTTP middleware integration    |
| Redis         | Shared rate-limit state                |
| Upstash Redis | Managed Redis infrastructure           |
| Lua           | Atomic token-bucket operations         |

## Architecture

The project separates the core algorithm, orchestration, and storage.

```text
src/
├── config/
│   ├── env.ts
│   ├── redis.ts
│   └── policies.ts
├── core/
│   ├── types.ts
│   ├── TokenBucket.ts
│   └── RateLimiter.ts
├── middleware/
├── store/
│   ├── RateLimitStore.ts
│   ├── InMemoryStore.ts
│   ├── RedisStore.ts
│   └── tokenBucket.lua
└── server.ts
```

The structure is evolving as development progresses.

### Core responsibilities

* `TokenBucket.ts` — Implements the token-bucket calculation.
* `RateLimiter.ts` — Coordinates rate-limit decisions.
* `RateLimitStore.ts` — Defines the storage contract.
* `InMemoryStore.ts` — Maintains bucket state in application memory.
* `RedisStore.ts` — Executes rate-limit operations through Redis.
* `tokenBucket.lua` — Performs atomic state updates inside Redis.
* `config/` — Holds application configuration and rate-limit policies.
* `middleware/` — Will expose the engine to Express applications.

## Token Bucket Algorithm

Each bucket maintains two values:

* `tokens`: The number of currently available tokens.
* `lastRefillTime`: The timestamp of the previous refill calculation.

For a refill rate of \(r\) tokens per second and elapsed time \(\Delta t\):

```text
refilledTokens = min(capacity, tokens + r * elapsedSeconds)
```

If at least one token is available, the request consumes one token and is allowed. Otherwise, the request is rejected.

The algorithm supports bursts up to the bucket capacity while replenishing tokens over time.

## Planned Rate-Limit Policies

The project is being extended to support different policies for different routes.

| Policy   | Capacity |    Refill rate | Intended use         |
| -------- | -------: | -------------: | -------------------- |
| Products |      100 |  10 tokens/sec | Read-heavy endpoints |
| Orders   |       10 |    1 token/sec | Order creation       |
| Login    |        5 | 0.1 tokens/sec | Login attempts       |

These are illustrative development configurations, not production security recommendations.

## Roadmap

* [x] Implement the token-bucket algorithm.
* [x] Define TypeScript interfaces for rate-limit state and decisions.
* [x] Implement an in-memory store.
* [x] Integrate Upstash Redis.
* [x] Implement atomic Redis operations with Lua.
* [x] Verify behavior under concurrent requests.
* [ ] **1. Policies:** Named, configurable rate-limit policies.
* [ ] **2. Express middleware:** Protect endpoints with minimal configuration.
* [ ] **3. Identity and keys:** Support user IDs, API keys, and IP-based limiting.
* [ ] **4. HTTP responses:** Standard rejection responses and rate-limit headers.
* [ ] **5. Reliability:** Redis timeouts, failure policies, and fallback behavior.
* [ ] **6. Testing:** Unit tests, concurrency tests, and edge cases.
* [ ] **7. Distribution:** Publish a reusable npm package.
* [ ] **8. Integration:** Demonstrate API gateway integration.
* [ ] **9. Production readiness:** Docker, benchmarks, documentation, and deployment.

## Development Setup

### Prerequisites

* Node.js
* npm
* An Upstash Redis database or compatible Redis server

### Installation

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd distributed-rate-limiter
npm install
```

Create a `.env` file in the project root:

```env
REDIS_URL=rediss://your-upstash-connection-url
```

Use the connection URL provided by Upstash. Never commit credentials or `.env` files.

### Verify the project

Run the TypeScript checker:

```bash
npx tsc --noEmit
```

Run the relevant test or development entry point using the project's configured scripts or `tsx`.

> Development commands may change as the project evolves. Consult `package.json` for the current scripts.

## Design Principles

1. **Atomicity:** Concurrent requests must not corrupt shared bucket state.
2. **Separation of concerns:** Algorithm, orchestration, storage, and HTTP integration should remain distinct.
3. **Type safety:** Public contracts should be explicit and validated.
4. **Developer experience:** Integrating rate limiting should require minimal application code.
5. **Measurable correctness:** Concurrency, failure behavior, and performance must be tested rather than assumed.

## Intended Use Cases

* API request throttling
* Per-user or per-API-key quotas
* Protection against accidental request floods
* Distributed rate limiting across horizontally scaled services
* API gateway rate-limit integration

Rate limiting is one layer of application protection. It does not replace authentication, authorization, abuse detection, or other security controls.

## Contributing

Contributions, bug reports, and design discussions will be welcome as the public interfaces stabilize.

Before contributing, please discuss significant architectural changes through an issue so the project can maintain consistent design principles.

## License

The project license will be specified before the first public release.
