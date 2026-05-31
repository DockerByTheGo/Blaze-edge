# Logger Battery Onboarding

This file is for contributors changing `@blazyts/batteries-logger`. The README is for library consumers; keep implementation notes and project conventions here.

## Project Structure

- `src/services` contains Redis, MySQL, and combined logger service implementations.
- `src/data` contains schema and store data helpers.
- `src/types` contains public logger types.
- `tests/LoggerService.test.ts` covers behavior.

## Local Workflow

1. Install workspace dependencies from `project` with `bun install` unless this module has its own lockfile and you intentionally need isolated installs.
2. Make focused changes inside this module and its direct shared dependencies.
3. Run the narrowest relevant script before broad workspace checks.

## Scripts

- `bun run lint`: `bun --bun eslint .`
- `bun run node:test`: `bun x --bun vitest run --config vitest.config.ts`
- `bun run bun:test`: `bun test`

## Design Choices

- Use one of the logger services where the framework expects a logging service or compose stores with `CombinedLoggerService`.
- Schemas and store-specific data helpers are exported for integration code that needs to provision backing storage.

## Things To Know

- The MySQL implementation uses Drizzle/MySQL dependencies; keep database calls behind service boundaries.
- The logger can depend on the Redis-like client, so key schema changes may affect multiple batteries.

## Contribution Rules

- Keep public exports routed through the package entry point.
- Prefer existing Result/Option/service contracts from workspace packages over introducing parallel abstractions.
- Add tests beside the behavior you change when the module already has a `tests` directory.
- Do not commit secrets, generated coverage, or live-service credentials.
