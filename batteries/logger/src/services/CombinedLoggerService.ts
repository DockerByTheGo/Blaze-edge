import type {
  LoggerInput,
  LoggerQuery,
  LoggerRouteHandler,
  LoggerStoredLog,
  LogStore,
} from "../types";
import { normalizeLogInput, normalizeStorageTarget } from "./utils";

export type CombinedLoggerServiceConfig<TPayload = unknown> = {
  handler: LoggerRouteHandler<TPayload>;
  mysql: LogStore<TPayload>;
  redis: LogStore<TPayload>;
  createId?: (input: LoggerInput<TPayload>) => string;
  readOrder?: Array<"mysql" | "redis">;
};

export class CombinedLoggerService<TPayload = unknown> {
  public readonly config: CombinedLoggerServiceConfig<TPayload>;
  private readonly readOrder: Array<"mysql" | "redis">;

  constructor(config: CombinedLoggerServiceConfig<TPayload>) {
    this.config = config;
    this.readOrder = config.readOrder ?? ["mysql", "redis"];
  }

  async log(input: LoggerInput<TPayload>): Promise<LoggerStoredLog<TPayload>> {
    const log = normalizeLogInput(input, this.config.createId);
    const target = normalizeStorageTarget(await this.config.handler(input));

    await Promise.all(target.map(storage => this.storeFor(storage).save(log)));
    return log;
  }

  async save(input: LoggerInput<TPayload>): Promise<LoggerStoredLog<TPayload>> {
    return this.log(input);
  }

  async get(id: string): Promise<LoggerStoredLog<TPayload> | null> {
    for (const storage of this.readOrder) {
      const log = await this.storeFor(storage).get(id);
      if (log) {
        return log;
      }
    }

    return null;
  }

  async getAll(query: LoggerQuery = {}): Promise<LoggerStoredLog<TPayload>[]> {
    const logs = await Promise.all(this.readOrder.map(storage => this.storeFor(storage).getAll(query)));
    const byId = new Map<string, LoggerStoredLog<TPayload>>();

    for (const log of logs.flat()) {
      byId.set(log.id, log);
    }

    return [...byId.values()]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, query.limit ?? 100);
  }

  private storeFor(storage: "mysql" | "redis"): LogStore<TPayload> {
    return storage === "mysql" ? this.config.mysql : this.config.redis;
  }
}
