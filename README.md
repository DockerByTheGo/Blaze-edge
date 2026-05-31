# Blazy Edge

Blazy Edge is a TypeScript backend framework workspace plus a set of optional batteries for auth, caching, file storage, Redis-like persistence, and backend exploration.

The core package is `@blazyts/blazy-edge`. Batteries are small packages that implement framework service contracts or add supporting tooling.

## Packages

| Package | Purpose |
| --- | --- |
| `@blazyts/blazy-edge` | Core app, routing, hooks, services, HTTP/RPC/WebSocket helpers, and Bun server adapter. |
| `@blazyts/batteries-authentication-self-hosted` | Username/password auth with PostgreSQL users and memory/Postgres/Redis token storage. |
| `@blazyts/batteries-authentication-clerk` | Clerk-backed implementation of the Blazy auth service contract. |
| `@blazyts/batteries-authentication-google` | Google OAuth-style auth battery with a local token store. |
| `@blazyts/batteries-cache-in-memory` | In-process cache service implementation. |
| `@blazyts/batteries-cache-redis` | Redis-backed cache service implementation. |
| `@blazyts/batteries-redislike-client` | Typed JSON helper around Redis-compatible clients. |
| `@blazyts/batteries-file-upload-multer` | Local filesystem file saver and Multer storage engine. |
| `@blazyts/batteries-file-upload-s3` | S3-backed file saver. |
| `@blazyts/backend-explorer` | React UI and server helpers for exploring Blazy services and logs. |

## Quick Start

```ts
import { BlazyConstructor } from "@blazyts/blazy-edge";

export const app = BlazyConstructor
  .createProd()
  .get({
    path: "/health",
    handler: () => ({ body: { ok: true } }),
  })
  .post({
    path: "/echo",
    handler: ctx => ({ body: ctx.request.body.raw() }),
  });

app.listen(3000);
```

Services are attached with `addService()` and become available in route handlers through `ctx.services`.

```ts
const app = BlazyConstructor
  .createProd()
  .addService("cart", {
    config: {},
    getAll: () => ["cart-1", "cart-2"],
  })
  .get({
    path: "/cart",
    handler: ctx => ({ body: ctx.services.cart.getAll() }),
  });
```

## Development

This workspace is built around Bun and TypeScript.

```bash
bun install
bun test
```

Most packages also expose their own package-level test script. See each module README for focused examples and commands.
