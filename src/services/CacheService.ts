import type { URecord } from "@blazyts/better-standard-library";
import type { IRouteHandler } from "@blazyts/backend-lib/src/core/server/router/routeHandler";

export type CacheStorage = Map<string, HandlerCacheEntry>;

type CacheEntry = {
  value: unknown;
  expiresAt: number | null;
  timeoutId?: ReturnType<typeof setTimeout>;
};

type HandlerCacheEntry = {
  handler: IRouteHandler<URecord, URecord>;
  entries: Map<string, CacheEntry>;
};

export interface CacheHandlerConfig<TRequest extends URecord = URecord> {
  /** TTL in milliseconds for entries registered for this handler */
  ttl?: number;
  /** Optional key function for a specific request */
  key?: (request: TRequest) => string;
}

export class CacheService {
  private readonly cacheStorage: CacheStorage;

  constructor(options?: { cacheStorage?: CacheStorage }) {
    this.cacheStorage = options?.cacheStorage ?? new Map();
  }

  getStorage(): CacheStorage {
    return this.cacheStorage;
  }

  registerHandler(handlerId: string, handler: IRouteHandler<URecord, URecord>): void {
    if (!this.cacheStorage.has(handlerId)) {
      this.cacheStorage.set(handlerId, {
        handler,
        entries: new Map(),
      });
      return;
    }

    const existing = this.cacheStorage.get(handlerId);
    if (existing) {
      existing.handler = handler;
    }
  }

  getEntry(handlerId: string, requestKey: string): unknown | undefined {
    const handlerCache = this.cacheStorage.get(handlerId);
    if (!handlerCache) {
      return undefined;
    }

    const entry = handlerCache.entries.get(requestKey);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
      this.invalidateEntry(handlerId, requestKey);
      return undefined;
    }

    return entry.value;
  }

  hasEntry(handlerId: string, requestKey: string): boolean {
    const handlerCache = this.cacheStorage.get(handlerId);
    if (!handlerCache) {
      return false;
    }

    const entry = handlerCache.entries.get(requestKey);
    if (!entry) {
      return false;
    }

    if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
      this.invalidateEntry(handlerId, requestKey);
      return false;
    }

    return true;
  }

  setEntry(handlerId: string, requestKey: string, value: unknown, ttl?: number): void {
    const handlerCache = this.ensureHandlerCache(handlerId);

    const existingEntry = handlerCache.entries.get(requestKey);
    if (existingEntry?.timeoutId) {
      clearTimeout(existingEntry.timeoutId);
    }

    const normalizedTtl = typeof ttl === "number" && ttl > 0 ? ttl : undefined;
    const expiresAt = normalizedTtl ? Date.now() + normalizedTtl : null;

    const timeoutId = normalizedTtl
      ? setTimeout(() => {
        this.invalidateEntry(handlerId, requestKey);
      }, normalizedTtl)
      : undefined;

    handlerCache.entries.set(requestKey, {
      value,
      expiresAt,
      timeoutId,
    });
  }

  invalidateEntry(handlerId: string, requestKey?: string): void {
    const handlerCache = this.cacheStorage.get(handlerId);
    if (!handlerCache) {
      return;
    }

    if (requestKey) {
      const entry = handlerCache.entries.get(requestKey);
      if (!entry) {
        return;
      }

      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }
      handlerCache.entries.delete(requestKey);
      return;
    }

    handlerCache.entries.forEach(entry => {
      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }
    });
    handlerCache.entries.clear();
  }

  private ensureHandlerCache(handlerId: string): HandlerCacheEntry {
    if (!this.cacheStorage.has(handlerId)) {
      const defaultEntry: HandlerCacheEntry = {
        handler: {
          handleRequest: () => ({} as URecord),
          getClientRepresentation: () => ({} as unknown),
          metadata: {},
        },
        entries: new Map(),
      };
      this.cacheStorage.set(handlerId, defaultEntry);
      return defaultEntry;
    }

    return this.cacheStorage.get(handlerId)!;
  }
}
