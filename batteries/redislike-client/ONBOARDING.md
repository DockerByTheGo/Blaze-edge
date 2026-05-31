# Redis-Like Entity Client Onboarding

This file is for contributors changing `@blazyts/batteries-redislike-client`. The README is for library consumers; keep implementation notes and project conventions here.

## Project Structure

- `src/client.ts` contains `RedisLikeEntityClient`.
- `src/schema.ts` contains schema helpers.
- `src/types.ts` contains the Redis-like interface and option types.
- `index.ts` and `src/index.ts` re-export the public API.

## Local Workflow

1. Install workspace dependencies from `project` with `bun install` unless this module has its own lockfile and you intentionally need isolated installs.
2. Make focused changes inside this module and its direct shared dependencies.
3. Run the narrowest relevant script before broad workspace checks.

## Scripts

- `bun run lint`: `bun --bun eslint .`
- `bun run node:test`: `bun x --bun vitest run --config vitest.config.ts`
- `bun run bun:test`: `bun test`

## Design Choices

- Define entity schemas with Zod, pass a `RedisLikeClient`, then use `put`, `get`, `has`, `delete`, `getAll`, and `deleteAll` by entity name.
- Use it to adapt Redis clients, test doubles, or compatible in-memory stores for other batteries.

## Things To Know

- The core Redis contract is intentionally tiny: set/get/exists/del/keys-style behavior.
- Key composition options such as `includeEntityInKey` and `keyPrefix` affect compatibility with cache packages.

## Contribution Rules

- Keep public exports routed through the package entry point.
- Prefer existing Result/Option/service contracts from workspace packages over introducing parallel abstractions.
- Add tests beside the behavior you change when the module already has a `tests` directory.
- Do not commit secrets, generated coverage, or live-service credentials.
