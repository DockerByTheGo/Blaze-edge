import type {
  RedisLikeClient,
  RedisLikeEntityClientConfig,
  RedisLikeEntityInput,
  RedisLikeEntityRecord,
  RedisLikeEntitySchemas,
  RedisLikeEntityValue,
  RedisLikeSetOptions,
} from "./types";

export class RedisLikeEntityClient<TSchemas extends RedisLikeEntitySchemas> {
  private readonly config: Required<RedisLikeEntityClientConfig>;

  constructor(
    private readonly client: RedisLikeClient,
    private readonly schemas: TSchemas,
    config: RedisLikeEntityClientConfig = {},
  ) {
    this.config = {
      includeEntityInKey: config.includeEntityInKey ?? true,
      keyPrefix: config.keyPrefix ?? "",
      separator: config.separator ?? ":",
    };
  }

  async put<TEntity extends keyof TSchemas & string>(
    entity: TEntity,
    key: string,
    value: RedisLikeEntityInput<TSchemas, TEntity>,
    options: RedisLikeSetOptions = {},
  ): Promise<RedisLikeEntityValue<TSchemas, TEntity>> {
    const parsed = this.schemaFor(entity).parse(value) as RedisLikeEntityValue<TSchemas, TEntity>;
    const serialized = JSON.stringify(parsed);
    const redisKey = this.resolveKey(entity, key);

    if (options.ttl === undefined) {
      await this.client.set(redisKey, serialized);
      return parsed;
    }

    await this.client.set(redisKey, serialized, "PX", options.ttl);
    return parsed;
  }

  async get<TEntity extends keyof TSchemas & string>(
    entity: TEntity,
    key: string,
  ): Promise<RedisLikeEntityValue<TSchemas, TEntity> | null> {
    const raw = await this.client.get(this.resolveKey(entity, key));
    if (raw === null) {
      return null;
    }

    return this.parse(entity, raw);
  }

  async has<TEntity extends keyof TSchemas & string>(entity: TEntity, key: string): Promise<boolean> {
    if (this.client.exists) {
      return (await this.client.exists(this.resolveKey(entity, key))) > 0;
    }

    return (await this.get(entity, key)) !== null;
  }

  async delete<TEntity extends keyof TSchemas & string>(entity: TEntity, key: string): Promise<boolean> {
    return (await this.client.del(this.resolveKey(entity, key))) > 0;
  }

  async deleteAll<TEntity extends keyof TSchemas & string>(entity: TEntity): Promise<void> {
    const keys = await this.keys(entity);
    await Promise.all(keys.map(key => this.client.del(key)));
  }

  async getAll<TEntity extends keyof TSchemas & string>(
    entity: TEntity,
  ): Promise<RedisLikeEntityRecord<TSchemas, TEntity>[]> {
    const keys = await this.keys(entity);
    const records = await Promise.all(keys.map(async (redisKey) => {
      const raw = await this.client.get(redisKey);
      if (raw === null) {
        return null;
      }

      return {
        key: this.stripKeyPrefix(entity, redisKey),
        redisKey,
        value: this.parse(entity, raw),
      };
    }));

    return records.filter((record): record is RedisLikeEntityRecord<TSchemas, TEntity> => record !== null);
  }

  private async keys<TEntity extends keyof TSchemas & string>(entity: TEntity): Promise<string[]> {
    if (!this.client.keys) {
      throw new Error("Redis-like client does not expose keys(), so entity listing is unavailable");
    }

    return this.client.keys(this.resolvePattern(entity));
  }

  private parse<TEntity extends keyof TSchemas & string>(
    entity: TEntity,
    raw: string,
  ): RedisLikeEntityValue<TSchemas, TEntity> {
    return this.schemaFor(entity).parse(JSON.parse(raw)) as RedisLikeEntityValue<TSchemas, TEntity>;
  }

  private schemaFor<TEntity extends keyof TSchemas & string>(entity: TEntity): TSchemas[TEntity] {
    const schema = this.schemas[entity];
    if (!schema) {
      throw new Error(`Redis-like entity schema is not registered: ${entity}`);
    }

    return schema;
  }

  private resolveKey<TEntity extends keyof TSchemas & string>(entity: TEntity, key: string): string {
    return `${this.resolvePrefix(entity)}${key}`;
  }

  private resolvePattern<TEntity extends keyof TSchemas & string>(entity: TEntity): string {
    return `${this.resolvePrefix(entity)}*`;
  }

  private resolvePrefix<TEntity extends keyof TSchemas & string>(entity: TEntity): string {
    if (!this.config.includeEntityInKey) {
      return this.config.keyPrefix;
    }

    return `${this.config.keyPrefix}${entity}${this.config.separator}`;
  }

  private stripKeyPrefix<TEntity extends keyof TSchemas & string>(entity: TEntity, redisKey: string): string {
    const prefix = this.resolvePrefix(entity);
    return redisKey.startsWith(prefix) ? redisKey.slice(prefix.length) : redisKey;
  }
}
