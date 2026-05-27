import type { CacheEntry, ICacheService } from "../../../framework/src/services/built-in/cache";

export type RedisLikeClient = {
  del: (key: string) => Promise<number> | number;
  exists: (key: string) => Promise<number> | number;
  get: (key: string) => Promise<string | null> | string | null;
  keys?: (pattern: string) => Promise<string[]> | string[];
  set: (
    key: string,
    value: string,
    mode?: "PX",
    ttl?: number,
  ) => Promise<unknown> | unknown;
};

export type RedisCacheConfig = {
  keyPrefix?: string;
  defaultTtl?: number;
};

export class RedisCacheService<TValue = unknown> implements ICacheService<TValue> {
  public readonly config: RedisCacheConfig;

  constructor(
    private readonly client: RedisLikeClient,
    config: RedisCacheConfig = {},
  ) {
    this.config = config;
  }

  async setEntry(key: string, value: TValue, ttl = this.config.defaultTtl): Promise<void> {
    const redisKey = this.resolveKey(key);
    const serialized = JSON.stringify(value);

    if (ttl === undefined) {
      await this.client.set(redisKey, serialized);
      return;
    }

    await this.client.set(redisKey, serialized, "PX", ttl);
  }

  async saveEntry(key: string, value: TValue, ttl = this.config.defaultTtl): Promise<void> {
    await this.setEntry(key, value, ttl);
  }

  async getEntry(key: string): Promise<TValue | undefined> {
    const raw = await this.client.get(this.resolveKey(key));
    if (raw === null) {
      return undefined;
    }

    return JSON.parse(raw) as TValue;
  }

  async hasEntry(key: string): Promise<boolean> {
    return (await this.client.exists(this.resolveKey(key))) > 0;
  }

  async invalidate(key: string): Promise<boolean> {
    return (await this.client.del(this.resolveKey(key))) > 0;
  }

  async flush(): Promise<void> {
    if (!this.client.keys) {
      throw new Error("Redis client does not expose keys(), so prefixed flush is unavailable");
    }

    const keys = await this.client.keys(`${this.config.keyPrefix ?? ""}*`);
    await Promise.all(keys.map(key => this.client.del(key)));
  }

  private resolveKey(key: string): string {
    return `${this.config.keyPrefix ?? ""}${key}`;
  }

  async getAll(): Promise<CacheEntry<TValue>[]> {
    if (!this.client.keys) {
      throw new Error("Redis client does not expose keys(), so getAll is unavailable");
    }

    const keys = await this.client.keys(`${this.config.keyPrefix ?? ""}*`);
    const entries = await Promise.all(keys.map(async (key) => {
      const raw = await this.client.get(key);
      if (raw === null) {
        return null;
      }

      return {
        key,
        value: JSON.parse(raw) as TValue,
        createdAt: 0,
      };
    }));

    return entries.filter((entry): entry is CacheEntry<TValue> => entry !== null);
  }
}
