# Redis-Like Entity Client

Typed entity wrapper around a small Redis-like key/value interface, with Zod schema validation and key-prefix conventions.

## Install

`bun add @blazyts/batteries-redislike-client`

## Usage

```ts
import { RedisLikeEntityClient } from '@blazyts/batteries-redislike-client';
```

- Define entity schemas with Zod, pass a `RedisLikeClient`, then use `put`, `get`, `has`, `delete`, `getAll`, and `deleteAll` by entity name.
- Use it to adapt Redis clients, test doubles, or compatible in-memory stores for other batteries.

## Public Surface

- Package name: `@blazyts/batteries-redislike-client`
- Module kind: `module`
- Entry point: `src/index.ts`

Runtime dependencies: `zod`.
Peer dependencies: `typescript`.

## Scripts

- `bun run lint`: `bun --bun eslint .`
- `bun run node:test`: `bun x --bun vitest run --config vitest.config.ts`
- `bun run bun:test`: `bun test`

## Notes

- The core Redis contract is intentionally tiny: set/get/exists/del/keys-style behavior.
- Key composition options such as `includeEntityInKey` and `keyPrefix` affect compatibility with cache packages.
