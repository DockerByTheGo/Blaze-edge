import { describe, expect, it } from "vitest";
import z from "zod/v4";

import { RedisLikeEntityClient, defineRedisLikeSchema, type RedisLikeClient } from "../index";

class FakeRedisClient implements RedisLikeClient {
  readonly entries = new Map<string, string>();

  del(key: string): number {
    return this.entries.delete(key) ? 1 : 0;
  }

  exists(key: string): number {
    return this.entries.has(key) ? 1 : 0;
  }

  get(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  keys(pattern: string): string[] {
    const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
    return [...this.entries.keys()].filter(key => key.startsWith(prefix));
  }

  set(key: string, value: string): string {
    this.entries.set(key, value);
    return "OK";
  }
}

const schema = defineRedisLikeSchema({
  token: z.object({
    expiresAt: z.number(),
    userId: z.string(),
  }),
});

describe("RedisLikeEntityClient", () => {
  it("validates values before writing and after reading", async () => {
    const redis = new FakeRedisClient();
    const store = new RedisLikeEntityClient(redis, schema, { keyPrefix: "test:" });

    await store.put("token", "abc", { expiresAt: 123, userId: "demo" });

    expect(redis.entries.get("test:token:abc")).toBe(JSON.stringify({ expiresAt: 123, userId: "demo" }));
    // @ts-expect-error Runtime validation should also reject invalid external input.
    await expect(store.put("token", "bad", { expiresAt: "soon", userId: "demo" })).rejects.toThrow();

    redis.entries.set("test:token:corrupt", JSON.stringify({ expiresAt: "soon", userId: "demo" }));

    await expect(store.get("token", "corrupt")).rejects.toThrow();
  });

  it("lists and deletes entity records", async () => {
    const redis = new FakeRedisClient();
    const store = new RedisLikeEntityClient(redis, schema, { keyPrefix: "test:" });

    await store.put("token", "one", { expiresAt: 1, userId: "demo" });
    await store.put("token", "two", { expiresAt: 2, userId: "demo" });
    redis.set("test:other:three", JSON.stringify({ expiresAt: 3, userId: "demo" }));

    expect(await store.getAll("token")).toEqual([
      { key: "one", redisKey: "test:token:one", value: { expiresAt: 1, userId: "demo" } },
      { key: "two", redisKey: "test:token:two", value: { expiresAt: 2, userId: "demo" } },
    ]);

    await store.deleteAll("token");

    expect(redis.entries.has("test:token:one")).toBe(false);
    expect(redis.entries.has("test:token:two")).toBe(false);
    expect(redis.entries.has("test:other:three")).toBe(true);
  });
});
