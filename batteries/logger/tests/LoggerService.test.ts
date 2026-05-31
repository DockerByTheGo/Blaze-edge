import { describe, expect, it } from "vitest";

import {
  CombinedLoggerService,
  createLoggerRedisClient,
  RedisLoggerService,
  type LoggerStoredLog,
  type LogStore,
  type RedisLikeClient,
} from "../index";

class FakeRedisClient implements RedisLikeClient {
  readonly entries = new Map<string, string>();

  del(key: string): number {
    return this.entries.delete(key) ? 1 : 0;
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

class FakeLogStore implements LogStore {
  readonly logs = new Map<string, LoggerStoredLog>();

  async save(input: LoggerStoredLog): Promise<LoggerStoredLog> {
    this.logs.set(input.id, input);
    return input;
  }

  async get(id: string): Promise<LoggerStoredLog | null> {
    return this.logs.get(id) ?? null;
  }

  async getAll(): Promise<LoggerStoredLog[]> {
    return [...this.logs.values()];
  }
}

describe("logger battery", () => {
  it("saves and retrieves logs from redis through the redis client utility", async () => {
    const redis = new FakeRedisClient();
    const logger = new RedisLoggerService(createLoggerRedisClient(redis, { keyPrefix: "test:" }), {
      createId: () => "redis-log",
    });

    await logger.log({
      level: "info",
      message: "order accepted",
      payload: { orderId: 123 },
      source: "orders",
      createdAt: new Date("2026-05-31T10:00:00.000Z"),
    });

    expect(redis.entries.has("test:log:redis-log")).toBe(true);
    expect(await logger.get("redis-log")).toMatchObject({
      id: "redis-log",
      level: "info",
      message: "order accepted",
      payload: { orderId: 123 },
      source: "orders",
    });
  });

  it("routes full log input to mysql, redis, or both before saving", async () => {
    const mysql = new FakeLogStore();
    const redis = new FakeLogStore();
    const logger = new CombinedLoggerService({
      mysql,
      redis,
      createId: input => input.message,
      handler: (input) => {
        if (input.level === "error") {
          return "both";
        }

        return input.payload && typeof input.payload === "object" && "fast" in input.payload
          ? "redis"
          : "mysql";
      },
    });

    await logger.log({ level: "info", message: "audit-log", payload: { durable: true } });
    await logger.log({ level: "debug", message: "hot-log", payload: { fast: true } });
    await logger.log({ level: "error", message: "incident-log" });

    expect(mysql.logs.has("audit-log")).toBe(true);
    expect(redis.logs.has("audit-log")).toBe(false);
    expect(redis.logs.has("hot-log")).toBe(true);
    expect(mysql.logs.has("hot-log")).toBe(false);
    expect(mysql.logs.has("incident-log")).toBe(true);
    expect(redis.logs.has("incident-log")).toBe(true);
    expect(await logger.get("incident-log")).toMatchObject({ id: "incident-log", level: "error" });
  });
});
