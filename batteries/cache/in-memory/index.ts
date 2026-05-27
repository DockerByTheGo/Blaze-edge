import type { CacheEntry, ICacheService } from "../../../framework/src/services/built-in/cache";

export type InMemoryCacheConfig = {
  defaultTtl?: number;
};

export class InMemoryCacheService<TValue = unknown> implements ICacheService<TValue> {
  public readonly config: InMemoryCacheConfig;
  private readonly entries = new Map<string, CacheEntry<TValue>>();

  constructor(config: InMemoryCacheConfig = {}) {
    this.config = config;
  }

  setEntry(key: string, value: TValue, ttl = this.config.defaultTtl): void {
    this.entries.set(key, {
      key,
      value,
      createdAt: Date.now(),
      expiresAt: ttl === undefined ? undefined : Date.now() + ttl,
    });
  }

  saveEntry(key: string, value: TValue, ttl = this.config.defaultTtl): void {
    this.setEntry(key, value, ttl);
  }

  getEntry(key: string): TValue | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value;
  }

  hasEntry(key: string): boolean {
    return this.getEntry(key) !== undefined;
  }

  invalidate(key: string): boolean {
    return this.entries.delete(key);
  }

  flush(): void {
    this.entries.clear();
  }

  getAll(): CacheEntry<TValue>[] {
    for (const [key, entry] of this.entries) {
      if (this.isExpired(entry)) {
        this.entries.delete(key);
      }
    }

    return Array.from(this.entries.values());
  }

  private isExpired(entry: CacheEntry<TValue>): boolean {
    return entry.expiresAt !== undefined && entry.expiresAt <= Date.now();
  }
}
