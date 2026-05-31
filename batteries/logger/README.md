# @blazyts/batteries-logger

Database-backed logger services for Blazy Edge.

Use this battery when logs need to be saved outside the running process and queried later. It includes a MySQL logger powered by Drizzle, a Redis logger powered by the shared Redis-like client utility, and a combined logger that routes each log to MySQL, Redis, or both.

## Usage

```ts
import {
  CombinedLoggerService,
  MysqlLoggerService,
  RedisLoggerService,
  createLoggerMysqlDrizzleClient,
  createLoggerMysqlPool,
  createLoggerRedisClient,
} from "@blazyts/batteries-logger";

const mysqlPool = createLoggerMysqlPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "app",
});

const mysql = new MysqlLoggerService(createLoggerMysqlDrizzleClient(mysqlPool));

const redis = new RedisLoggerService(
  createLoggerRedisClient(redisClient, {
    keyPrefix: "app:logs:",
  }),
);

const logger = new CombinedLoggerService({
  mysql,
  redis,
  handler: (input) => {
    if (input.level === "error") {
      return "both";
    }

    return input.payload && typeof input.payload === "object" && "persist" in input.payload
      ? "mysql"
      : "redis";
  },
});

await logger.log({
  level: "info",
  message: "User signed in",
  source: "auth",
  payload: { userId: "user_1" },
});

const logs = await logger.getAll({ source: "auth", limit: 25 });
```

## MySQL

The MySQL client and Drizzle setup live in `src/data/mysql.ts`. Tables are defined with Drizzle in `src/data/schema.ts`.

```ts
import {
  MysqlLoggerService,
  createLoggerMysqlDrizzleClient,
  createLoggerMysqlPool,
} from "@blazyts/batteries-logger";

const pool = createLoggerMysqlPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "app",
});

const logger = new MysqlLoggerService(createLoggerMysqlDrizzleClient(pool));

await logger.log({
  level: "error",
  message: "Payment failed",
  source: "payments",
  payload: { paymentId: "pay_1" },
});

const log = await logger.get("log-id");
```

By default the service creates the `logger_logs` table if it does not exist. Pass `createSchema: false` when migrations are handled somewhere else.

```ts
const logger = new MysqlLoggerService(db, {
  createSchema: false,
});
```

## Redis

The Redis logger uses `RedisLikeEntityClient` from `@blazyts/batteries-redislike-client`. The extracted Redis client setup lives in `src/data/redis.ts`.

```ts
import {
  RedisLoggerService,
  createLoggerRedisClient,
} from "@blazyts/batteries-logger";

const logger = new RedisLoggerService(
  createLoggerRedisClient(redisClient, {
    keyPrefix: "app:logs:",
  }),
  {
    ttl: 60_000,
  },
);

await logger.log({
  level: "debug",
  message: "Cache warmed",
  source: "cache",
});
```

The Redis-like client needs this shape:

```ts
type RedisLikeClient = {
  get: (key: string) => Promise<string | null> | string | null;
  set: (key: string, value: string, mode?: "PX", ttl?: number) => unknown;
  del: (key: string) => Promise<number> | number;
  exists?: (key: string) => Promise<number> | number;
  keys?: (pattern: string) => Promise<string[]> | string[];
};
```

`keys()` is required for `getAll()`.

## Combined Storage Routing

`CombinedLoggerService` receives a `handler` in the constructor. The handler runs before saving and receives the full log input. It decides where the log should be saved.

```ts
const logger = new CombinedLoggerService({
  mysql,
  redis,
  handler: (input) => {
    if (input.level === "error") {
      return "both";
    }

    if (input.source === "audit") {
      return "mysql";
    }

    return "redis";
  },
});
```

Supported handler return values:

- `"mysql"` saves to MySQL.
- `"db"` is an alias for MySQL.
- `"redis"` saves to Redis.
- `"both"` saves to MySQL and Redis.
- `["mysql", "redis"]` saves to every listed target.

## API

- `log(input)`
- `save(input)`
- `get(id)`
- `getAll(query?)`

`query` supports:

- `id`
- `level`
- `source`
- `limit`

## Scripts

```bash
bun run test
```
