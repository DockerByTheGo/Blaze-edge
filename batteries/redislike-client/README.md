# Redis-like client

Shared Redis-like client helpers for batteries that store JSON values behind a small Redis-compatible protocol.

```ts
import { RedisLikeEntityClient, defineRedisLikeSchema } from "@blazyts/batteries-redislike-client";
import z from "zod/v4";

const schema = defineRedisLikeSchema({
  token: z.object({
    userId: z.string(),
    expiresAt: z.number(),
  }),
});

const store = new RedisLikeEntityClient(redisClient, schema, { keyPrefix: "auth:" });

await store.put("token", "abc", { userId: "demo", expiresAt: Date.now() + 1000 });
const token = await store.get("token", "abc");
```

Values are validated with the entity's Zod v4 schema before they are written and after they are read from Redis.
