# Blazy Edge Big Example Onboarding

This file is for contributors changing `big-example`. The README is for library consumers; keep implementation notes and project conventions here.

## Project Structure

- `index.ts` contains the entire example app and local fake clients.
- `package.json` lists all batteries that are expected to work together.

## Local Workflow

1. Install workspace dependencies from `project` with `bun install` unless this module has its own lockfile and you intentionally need isolated installs.
2. Make focused changes inside this module and its direct shared dependencies.
3. Run the narrowest relevant script before broad workspace checks.

## Scripts

- `bun run dev`: `bun run server.ts`
- `bun run start`: `bun run index.ts`
- `bun run typecheck`: `bunx tsc -p tsconfig.json --noEmit`

## Design Choices

- Use it as a reference app for combining framework batteries in one Blazy Edge server.
- The in-memory stub clients in `index.ts` show the minimum interfaces expected by Redis-like, MySQL-like, and auth providers.

## Things To Know

- The example intentionally uses fake in-memory clients for external services; do not treat them as production adapters.
- Keep this package compiling when changing any battery public API.

## Contribution Rules

- Keep public exports routed through the package entry point.
- Prefer existing Result/Option/service contracts from workspace packages over introducing parallel abstractions.
- Add tests beside the behavior you change when the module already has a `tests` directory.
- Do not commit secrets, generated coverage, or live-service credentials.
