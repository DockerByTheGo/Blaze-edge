import type { LoggerRedisClient } from "../data";
import type { LoggerInput, LoggerQuery, LoggerStoredLog, LogStore } from "../types";
import { normalizeLogInput } from "./utils";

export type RedisLoggerServiceConfig<TPayload = unknown> = {
  createId?: (input: LoggerInput<TPayload>) => string;
  ttl?: number;
};

export class RedisLoggerService<TPayload = unknown> implements LogStore<TPayload> {
  public readonly config: RedisLoggerServiceConfig<TPayload>;

  constructor(
    private readonly client: LoggerRedisClient,
    config: RedisLoggerServiceConfig<TPayload> = {},
  ) {
    this.config = config;
  }

  async log(input: LoggerInput<TPayload>): Promise<LoggerStoredLog<TPayload>> {
    return this.save(normalizeLogInput(input, this.config.createId));
  }

  async save(input: LoggerStoredLog<TPayload>): Promise<LoggerStoredLog<TPayload>> {
    await this.client.put("log", input.id, input, { ttl: this.config.ttl });
    return input;
  }

  async get(id: string): Promise<LoggerStoredLog<TPayload> | null> {
    return this.client.get("log", id) as Promise<LoggerStoredLog<TPayload> | null>;
  }

  async getAll(query: LoggerQuery = {}): Promise<LoggerStoredLog<TPayload>[]> {
    const records = await this.client.getAll("log");
    return records
      .map(record => record.value as LoggerStoredLog<TPayload>)
      .filter(log => matchesQuery(log, query))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, query.limit ?? 100);
  }
}

function matchesQuery(log: LoggerStoredLog, query: LoggerQuery): boolean {
  return (query.id === undefined || log.id === query.id)
    && (query.level === undefined || log.level === query.level)
    && (query.source === undefined || log.source === query.source);
}
