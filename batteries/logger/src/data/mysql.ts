import { sql, type SQL } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

import { loggerLogsTable } from "./schema";

export type LoggerMysqlDatabase = MySql2Database<Record<string, never>>;

export type LoggerMysqlClientOptions = PoolOptions;

export function createLoggerMysqlPool(options: LoggerMysqlClientOptions): Pool {
  return mysql.createPool(options);
}

export function createLoggerMysqlDrizzleClient(pool: Pool): LoggerMysqlDatabase {
  return drizzle(pool);
}

export async function setupLoggerMysqlDb(db: Pick<LoggerMysqlDatabase, "execute">): Promise<void> {
  await db.execute(createLoggerLogsTableSql());
}

export function createLoggerLogsTableSql(): SQL {
  return sql`
    CREATE TABLE IF NOT EXISTS ${loggerLogsTable} (
      id VARCHAR(191) PRIMARY KEY,
      level VARCHAR(16) NOT NULL,
      message VARCHAR(2048) NOT NULL,
      payload JSON NULL,
      source VARCHAR(191) NULL,
      created_at TIMESTAMP(3) NOT NULL,
      INDEX logger_logs_level_idx (level),
      INDEX logger_logs_source_idx (source),
      INDEX logger_logs_created_at_idx (created_at)
    )
  `;
}
