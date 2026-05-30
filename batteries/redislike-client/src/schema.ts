import type { RedisLikeEntitySchemas } from "./types";

export function defineRedisLikeSchema<TSchemas extends RedisLikeEntitySchemas>(schemas: TSchemas): TSchemas {
  return schemas;
}
