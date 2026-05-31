import { RedisLikeEntityClient, type RedisLikeClient } from "@blazyts/batteries-redislike-client";
import z from "zod/v4";

import type { LoggerStoredLog } from "../types";

export type { RedisLikeClient } from "@blazyts/batteries-redislike-client";

export const redisLoggerLogSchema = z.object({
  id: z.string(),
  level: z.enum(["debug", "info", "warn", "error"]),
  message: z.string(),
  payload: z.unknown().optional(),
  source: z.string().optional(),
  createdAt: z.coerce.date(),
}) satisfies z.ZodType<LoggerStoredLog>;

export type LoggerRedisClient = RedisLikeEntityClient<{ log: typeof redisLoggerLogSchema }>;

export type LoggerRedisClientConfig = {
  keyPrefix?: string;
};

export function createLoggerRedisClient(
  client: RedisLikeClient,
  config: LoggerRedisClientConfig = {},
): LoggerRedisClient {
  return new RedisLikeEntityClient(
    client,
    { log: redisLoggerLogSchema },
    { includeEntityInKey: true, keyPrefix: config.keyPrefix ?? "logger:" },
  );
}
