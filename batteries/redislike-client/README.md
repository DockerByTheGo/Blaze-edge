# @blazyts/batteries-redislike-client

Typed JSON helper for Redis-compatible clients.

This package wraps a small Redis-like protocol with entity-aware keys, JSON serialization, Zod validation, TTL support, and typed get/list results.

## Usage

```ts
import {
  RedisLikeEntityClient,
  defineRedisLikeSchema,
} from "@blazyts/batteries-redislike-client";
import z from "zod/v4";

const schema = defineRedisLikeSchema({
  token: z.object({
    userId: z.string(),
    expiresAt: z.number(),
  }),
});

const store = new RedisLikeEntityClient(redisClient, schema, {
  keyPrefix: "auth:",
});

await store.put("token", "abc", {
  userId: "demo",
  expiresAt: Date.now() + 60_000,
});

const token = await store.get("token", "abc");
```

Values are validated before write and after read.

## Redis-like Client Shape

```ts
type RedisLikeClient = {
  get: (key: string) => Promise<string | null> | string | null;
  set: (key: string, value: string, mode?: "PX", ttl?: number) => unknown;
  del: (key: string) => Promise<number> | number;
  exists?: (key: string) => Promise<number> | number;
  keys?: (pattern: string) => Promise<string[]> | string[];
};
```

The required methods work with clients like `ioredis`, `redis`, Bun Redis-compatible clients, or small adapters around another key-value store.

## Keys

By default, keys include the entity name:

```ts
new RedisLikeEntityClient(redis, schema, {
  keyPrefix: "app:",
  separator: ":",
});

// token abc -> app:token:abc
```

Disable entity names when you want the prefix to fully define the namespace:

```ts
new RedisLikeEntityClient(redis, schema, {
  includeEntityInKey: false,
  keyPrefix: "auth:token:",
});

// token abc -> auth:token:abc
```

## API

- `put(entity, key, value, { ttl }?)`
- `get(entity, key)`
- `has(entity, key)`
- `delete(entity, key)`
- `deleteAll(entity)`
- `getAll(entity)`

`getAll()` and `deleteAll()` require the Redis-like client to expose `keys(pattern)`.

## Scripts

```bash
bun run test
```
