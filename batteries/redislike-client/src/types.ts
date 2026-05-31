import type z from "zod/v4";

export type RedisLikeClient = {
  del: (key: string) => Promise<number> | number;
  exists?: (key: string) => Promise<number> | number;
  get: (key: string) => Promise<string | null> | string | null;
  keys?: (pattern: string) => Promise<string[]> | string[];
  set: (
    key: string,
    value: string,
    mode?: "PX",
    ttl?: number,
  ) => Promise<unknown> | unknown;
};

export type RedisLikeEntitySchemas = Record<string, z.ZodType>;

export type RedisLikeEntityValue<
  TSchemas extends RedisLikeEntitySchemas,
  TEntity extends keyof TSchemas,
> = z.output<TSchemas[TEntity]>;

export type RedisLikeEntityInput<
  TSchemas extends RedisLikeEntitySchemas,
  TEntity extends keyof TSchemas,
> = z.input<TSchemas[TEntity]>;

export type RedisLikeEntityRecord<
  TSchemas extends RedisLikeEntitySchemas,
  TEntity extends keyof TSchemas,
> = {
  key: string;
  redisKey: string;
  value: RedisLikeEntityValue<TSchemas, TEntity>;
};

export type RedisLikeEntityClientConfig = {
  includeEntityInKey?: boolean;
  keyPrefix?: string;
  separator?: string;
};

export type RedisLikeSetOptions = {
  ttl?: number;
};
