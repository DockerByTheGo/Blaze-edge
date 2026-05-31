import { index, json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const loggerLogsTable = mysqlTable(
  "logger_logs",
  {
    id: varchar("id", { length: 191 }).primaryKey(),
    level: varchar("level", { length: 16 }).notNull(),
    message: varchar("message", { length: 2048 }).notNull(),
    payload: json("payload"),
    source: varchar("source", { length: 191 }),
    createdAt: timestamp("created_at", { mode: "date", fsp: 3 }).notNull(),
  },
  table => [
    index("logger_logs_level_idx").on(table.level),
    index("logger_logs_source_idx").on(table.source),
    index("logger_logs_created_at_idx").on(table.createdAt),
  ],
);

export type LoggerLogRow = typeof loggerLogsTable.$inferSelect;
export type NewLoggerLogRow = typeof loggerLogsTable.$inferInsert;
