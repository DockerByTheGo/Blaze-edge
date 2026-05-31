import { and, desc, eq, type SQL } from "drizzle-orm";

import { loggerLogsTable, type LoggerMysqlDatabase, setupLoggerMysqlDb } from "../data";
import type { LoggerInput, LoggerQuery, LoggerStoredLog, LogStore } from "../types";
import { normalizeLogInput } from "./utils";

export type MysqlLoggerServiceConfig<TPayload = unknown> = {
  createSchema?: boolean;
  createId?: (input: LoggerInput<TPayload>) => string;
};

export class MysqlLoggerService<TPayload = unknown> implements LogStore<TPayload> {
  public readonly config: MysqlLoggerServiceConfig<TPayload>;
  private setupReady: Promise<void> | null = null;

  constructor(
    private readonly db: LoggerMysqlDatabase,
    config: MysqlLoggerServiceConfig<TPayload> = {},
  ) {
    this.config = config;
  }

  async setup(): Promise<void> {
    if (!this.setupReady) {
      this.setupReady = setupLoggerMysqlDb(this.db);
    }

    return this.setupReady;
  }

  async log(input: LoggerInput<TPayload>): Promise<LoggerStoredLog<TPayload>> {
    return this.save(normalizeLogInput(input, this.config.createId));
  }

  async save(input: LoggerStoredLog<TPayload>): Promise<LoggerStoredLog<TPayload>> {
    await this.ensureSchema();
    await this.db
      .insert(loggerLogsTable)
      .values({
        id: input.id,
        level: input.level,
        message: input.message,
        payload: input.payload,
        source: input.source,
        createdAt: input.createdAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          level: input.level,
          message: input.message,
          payload: input.payload,
          source: input.source,
          createdAt: input.createdAt,
        },
      });

    return input;
  }

  async get(id: string): Promise<LoggerStoredLog<TPayload> | null> {
    await this.ensureSchema();
    const rows = await this.db
      .select()
      .from(loggerLogsTable)
      .where(eq(loggerLogsTable.id, id))
      .limit(1);

    const row = rows[0];
    return row ? rowToLog<TPayload>(row) : null;
  }

  async getAll(query: LoggerQuery = {}): Promise<LoggerStoredLog<TPayload>[]> {
    await this.ensureSchema();
    const where = buildWhere(query);
    const rows = await this.db
      .select()
      .from(loggerLogsTable)
      .where(where)
      .orderBy(desc(loggerLogsTable.createdAt))
      .limit(query.limit ?? 100);

    return rows.map(row => rowToLog<TPayload>(row));
  }

  private async ensureSchema(): Promise<void> {
    if (this.config.createSchema === false) {
      return;
    }

    await this.setup();
  }
}

function buildWhere(query: LoggerQuery): SQL | undefined {
  const filters = [
    query.id ? eq(loggerLogsTable.id, query.id) : undefined,
    query.level ? eq(loggerLogsTable.level, query.level) : undefined,
    query.source ? eq(loggerLogsTable.source, query.source) : undefined,
  ].filter((filter): filter is SQL => filter !== undefined);

  return filters.length === 0 ? undefined : and(...filters);
}

function rowToLog<TPayload>(row: typeof loggerLogsTable.$inferSelect): LoggerStoredLog<TPayload> {
  return {
    id: row.id,
    level: row.level as LoggerStoredLog<TPayload>["level"],
    message: row.message,
    payload: row.payload as TPayload | undefined,
    source: row.source ?? undefined,
    createdAt: row.createdAt,
  };
}
