# Logger Battery

Logging services for Blazy Edge with Redis, MySQL, and combined store implementations.

## Install

`bun add @blazyts/batteries-logger`

## Usage

```ts
import { CombinedLoggerService, RedisLoggerService, MysqlLoggerService } from '@blazyts/batteries-logger';
```

- Use one of the logger services where the framework expects a logging service or compose stores with `CombinedLoggerService`.
- Schemas and store-specific data helpers are exported for integration code that needs to provision backing storage.

## Public Surface

- Package name: `@blazyts/batteries-logger`
- Module kind: `module`
- Entry point: `index.ts`

Runtime dependencies: `@blazyts/batteries-redislike-client`, `drizzle-orm`, `mysql2`, `zod`.
Peer dependencies: `typescript`.

## Scripts

- `bun run lint`: `bun --bun eslint .`
- `bun run node:test`: `bun x --bun vitest run --config vitest.config.ts`
- `bun run bun:test`: `bun test`

## Notes

- The MySQL implementation uses Drizzle/MySQL dependencies; keep database calls behind service boundaries.
- The logger can depend on the Redis-like client, so key schema changes may affect multiple batteries.
