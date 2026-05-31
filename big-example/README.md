# Blazy Edge Big Example

Integration example that wires Blazy Edge with all current batteries: cache, auth, file upload, logger, Redis-like client, and backend explorer.

## Install

`Run from the workspace with `bun install`, then enter this directory for the example scripts.`

## Usage

This is an executable example, not a library package. Start with `bun run start` and read `index.ts` for integration patterns.

- Use it as a reference app for combining framework batteries in one Blazy Edge server.
- The in-memory stub clients in `index.ts` show the minimum interfaces expected by Redis-like, MySQL-like, and auth providers.

## Public Surface

- Package name: `big-example`
- Module kind: `module`
- Entry point: `index.ts`

Runtime dependencies: `@aws-sdk/client-s3`, `@blazyts/backend-explorer`, `@blazyts/batteries-authentication-clerk`, `@blazyts/batteries-authentication-google`, `@blazyts/batteries-authentication-self-hosted`, `@blazyts/batteries-cache-adaptive`, `@blazyts/batteries-cache-in-memory`, `@blazyts/batteries-cache-redis`, `@blazyts/batteries-file-upload-multer`, `@blazyts/batteries-file-upload-s3`, `@blazyts/batteries-logger`, `@blazyts/batteries-redislike-client`, `@blazyts/blazy-edge`, `zod`.
Peer dependencies: `typescript`.

## Scripts

- `bun run dev`: `bun run server.ts`
- `bun run start`: `bun run index.ts`
- `bun run typecheck`: `bunx tsc -p tsconfig.json --noEmit`

## Notes

- The example intentionally uses fake in-memory clients for external services; do not treat them as production adapters.
- Keep this package compiling when changing any battery public API.
