import { describe, expectTypeOf, it } from "vitest";
import z from "zod/v4";

import {
  RedisLikeEntityClient,
  defineRedisLikeSchema,
  type RedisLikeClient,
  type RedisLikeEntityInput,
  type RedisLikeEntityRecord,
  type RedisLikeEntityValue,
} from "../index";

const redis = {
  del: () => 1,
  get: () => null,
  keys: () => [],
  set: () => "OK",
} satisfies RedisLikeClient;

const schema = defineRedisLikeSchema({
  session: z.object({
    active: z.boolean(),
    scopes: z.array(z.string()),
  }),
  token: z.object({
    expiresAt: z.string().transform(value => Number(value)),
    userId: z.string(),
  }),
});

type TestSchema = typeof schema;

describe("RedisLikeEntityClient type tests", () => {
  it("infers entity input and output types from schemas", () => {
    expectTypeOf<RedisLikeEntityInput<TestSchema, "token">>().toEqualTypeOf<{
      expiresAt: string;
      userId: string;
    }>();

    expectTypeOf<RedisLikeEntityValue<TestSchema, "token">>().toEqualTypeOf<{
      expiresAt: number;
      userId: string;
    }>();

    expectTypeOf<RedisLikeEntityRecord<TestSchema, "session">>().toEqualTypeOf<{
      key: string;
      redisKey: string;
      value: {
        active: boolean;
        scopes: string[];
      };
    }>();
  });

  it("preserves entity-specific method return types", async () => {
    const store = new RedisLikeEntityClient(redis, schema);

    const storedToken = await store.put("token", "abc", { expiresAt: "123", userId: "demo" });
    const token = await store.get("token", "abc");
    const sessions = await store.getAll("session");

    expectTypeOf(storedToken).toEqualTypeOf<{ expiresAt: number; userId: string }>();
    expectTypeOf(token).toEqualTypeOf<{ expiresAt: number; userId: string } | null>();
    expectTypeOf(sessions).toEqualTypeOf<RedisLikeEntityRecord<TestSchema, "session">[]>();
  });

  it("rejects unknown entities and mismatched entity values", () => {
    const store = new RedisLikeEntityClient(redis, schema);

    if (false) {
      // @ts-expect-error Entity names must be registered in the schema.
      void store.get("missing", "abc");

      // @ts-expect-error Token writes must use the schema input type, before transforms run.
      void store.put("token", "abc", { expiresAt: 123, userId: "demo" });

      // @ts-expect-error Session writes cannot use the token payload shape.
      void store.put("session", "abc", { expiresAt: "123", userId: "demo" });
    }
  });
});
