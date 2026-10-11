local tokens = tonumber(redis.call("HGET", KEYS[1], "tokens"))
local lastRefillTime = tonumber(redis.call("HGET", KEYS[1], "lastRefillTime"))

local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

if not tokens then
    tokens = capacity
    lastRefillTime = now
end

local elapsed = math.max(0, now - lastRefillTime) / 1000
local newTokens = math.min(capacity, tokens + elapsed * refillRate)

if newTokens < 1 then
    redis.call("HSET", KEYS[1], "tokens", newTokens, "lastRefillTime", now)

    local retryAfter = math.ceil((1 - newTokens) / refillRate)

    return {0, math.floor(newTokens), retryAfter}
end

newTokens = newTokens - 1

redis.call("HSET", KEYS[1], "tokens", newTokens, "lastRefillTime", now)

return {1, math.floor(newTokens), 0}