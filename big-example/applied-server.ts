import { backendUi } from "@blazyts/backend-explorer";
import {
  SelfHostedAuthService,
  type PostgresLikeClient,
} from "@blazyts/batteries-authentication-self-hosted";
import { applyCache, InMemoryCacheService } from "@blazyts/batteries-cache-in-memory";
import { MulterFileSaver } from "@blazyts/batteries-file-upload-multer";
import { CombinedLoggerService, type LogStore } from "@blazyts/batteries-logger";
import { getAvailablePort } from "@blazyts/better-standard-library";
import { BlazyConstructor } from "@blazyts/blazy-edge";
import z from "zod/v4";

type AppUserRow = {
  username: string;
  password_hash: string;
};

type ExplorerLog = {
  requestId: string;
  requestReceived: Record<string, unknown> & { recievedAt: Date };
  handlerLog: {
    startTime: Date;
    endTime: Date;
    got: Record<string, unknown>;
    returned: Record<string, unknown>;
  };
  responseSent: Record<string, unknown> & { sentAt: Date };
  hooks: {
    beforeHandler: unknown[];
    afterHandler: unknown[];
  };
  serviceLogs?: Array<{
    name: string;
    method: string;
    startTime: Date;
    endTime: Date;
    got: unknown;
    returned: unknown;
  }>;
};

type LoggerPayload = {
  explorerLog?: ExplorerLog;
  event?: string;
  data?: unknown;
};

class MemoryPostgresAuth implements PostgresLikeClient {
  private readonly users = new Map<string, AppUserRow>();

  query<TRow = Record<string, unknown>>(sql: string, params: unknown[] = []): { rows: TRow[] } {
    if (/CREATE TABLE/i.test(sql)) {
      return { rows: [] };
    }

    if (/INSERT INTO/i.test(sql) && /password_hash/i.test(sql)) {
      const [username, passwordHash] = params as [string, string];

      if (this.users.has(username)) {
        return { rows: [] };
      }

      this.users.set(username, { username, password_hash: passwordHash });
      return { rows: [{ username }] as TRow[] };
    }

    if (/SELECT username, password_hash/i.test(sql)) {
      const [username] = params as [string];
      const user = this.users.get(username);
      return { rows: (user ? [user] : []) as TRow[] };
    }

    return { rows: [] };
  }
}

class MemoryLogStore<TPayload> implements LogStore<TPayload> {
  private readonly logs = new Map<string, Awaited<ReturnType<LogStore<TPayload>["save"]>>>();

  async save(input: Awaited<ReturnType<LogStore<TPayload>["save"]>>): Promise<typeof input> {
    this.logs.set(input.id, input);
    return input;
  }

  async get(id: string): Promise<Awaited<ReturnType<LogStore<TPayload>["get"]>>> {
    return this.logs.get(id) ?? null;
  }

  async getAll(): Promise<Awaited<ReturnType<LogStore<TPayload>["getAll"]>>> {
    return [...this.logs.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

class LoggerBackedExplorerLogsRepo {
  constructor(private readonly logger: CombinedLoggerService<LoggerPayload>) {}

  async getRequestLog(id: string): Promise<ExplorerLog | null> {
    return (await this.getAllLogs()).find(log => log.requestId === id) ?? null;
  }

  async getAllLogs(): Promise<ExplorerLog[]> {
    const logs = await this.logger.getAll({ source: "applied-server", limit: 100 });
    return logs
      .map(log => log.payload?.explorerLog)
      .filter((log): log is ExplorerLog => Boolean(log));
  }

  async addLog(log: ExplorerLog): Promise<void> {
    await this.logger.log({
      level: "info",
      message: `${String(log.requestReceived.method)} ${String(log.requestReceived.path)}`,
      payload: { explorerLog: log },
      source: "applied-server",
    });
  }

  async clearLogs(): Promise<void> {
    return undefined;
  }
}

const jsonHeaders = { "content-type": "application/json" };

function requestBody(ctx: any): Record<string, unknown> {
  return ctx.request.body.raw();
}

async function recordRequest(
  logger: CombinedLoggerService<LoggerPayload>,
  ctx: any,
  response: { status: number; body: Record<string, unknown> },
  serviceLogs: ExplorerLog["serviceLogs"] = [],
): Promise<void> {
  const now = new Date();
  const requestId = crypto.randomUUID();
  const path = ctx.request.path;
  const method = ctx.request.method;
  const request = {
    method,
    path,
    headers: ctx.request.headers.raw(),
    body: requestBody(ctx),
    recievedAt: now,
  };

  const explorerLog: ExplorerLog = {
    requestId,
    requestReceived: request,
    handlerLog: {
      startTime: now,
      endTime: new Date(),
      got: request,
      returned: response.body,
    },
    responseSent: {
      statusCode: response.status,
      headers: jsonHeaders,
      body: response.body,
      sentAt: new Date(),
    },
    hooks: {
      beforeHandler: [],
      afterHandler: [],
    },
    serviceLogs,
  };

  await logger.log({
    level: response.status >= 400 ? "warn" : "info",
    message: `${method} ${path}`,
    payload: { explorerLog },
    source: "applied-server",
  });
}

const auth = new SelfHostedAuthService({
  postgres: new MemoryPostgresAuth(),
  tokenStore: { type: "memory" },
  tokenExpirationTime: 60 * 60 * 1000,
  passwordHash: { iterations: 1 },
});

const cache = new InMemoryCacheService<unknown>({ defaultTtl: 30_000 });
const fileSaver = new MulterFileSaver("/tmp/blazy-edge-applied-server/uploads");
const logger = new CombinedLoggerService<LoggerPayload>({
  handler: () => "redis",
  mysql: new MemoryLogStore(),
  redis: new MemoryLogStore(),
});
const explorerLogsRepo = new LoggerBackedExplorerLogsRepo(logger);

let featuredBuilds = 0;

const baseApp = applyCache(
  cache,
  BlazyConstructor.createProd(),
)
  .addService("auth", auth)
  .addService("cache", cache)
  .addService("fileSaver", fileSaver )
  .addService("logger", logger )
  .beforeRequestHandler("attachUser", async ctx => {
    const authorization = ctx.reqData.headers.authorization ?? ctx.reqData.headers.Authorization;
    const token = authorization?.replace(/^Bearer\s+/i, "");
    const user = token ? await auth.verifyToken(token) : null;

    return {
      ...ctx,
      user: user?.isOk() ? user.unpack() : null,
    };
  })
  .post({
    path: "/auth/register",
    args: z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }),
    handler: async ctx => {
      const username = String(ctx.request.body.get("username"));
      const password = String(ctx.request.body.get("password"));
      const started = new Date();
      const created = await ctx.services.getService("auth").registerUser(username, password);
      const body = created ? { username } : { error: "invalid_or_existing_user" };
      const status = created ? 201 : 400;

      await recordRequest(logger, ctx, { status, body }, [{
        name: "auth",
        method: "registerUser",
        startTime: started,
        endTime: new Date(),
        got: { username },
        returned: { created },
      }]);

      return { status, body };
    },
  })
  .post({
    path: "/auth/login",
    args: z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }),
    handler: async ctx => {
      const username = (ctx.request.body.get("username"));
      const password = (ctx.request.body.get("password"));
      const started = new Date();
      const result = await ctx.services.getService("auth").authenticate({ username, password });

      if (result.isError()) {
        const body = { error: result.v.error };
        await recordRequest(logger, ctx, { status: 401, body }, [{
          name: "auth",
          method: "authenticate",
          startTime: started,
          endTime: new Date(),
          got: { username },
          returned: body,
        }]);
        return { status: 401, body };
      }

      const body = result.unpack();
      await recordRequest(logger, ctx, { status: 201, body }, [{
        name: "auth",
        method: "authenticate",
        startTime: started,
        endTime: new Date(),
        got: { username },
        returned: { userId: body.userId },
      }]);
      return { status: 201, body };
    },
  })
  .get({
    path: "/me",
    handler: async ctx => {
      if (!ctx.user) {
        const body = { error: "unauthorized" };
        await recordRequest(logger, ctx, { status: 401, body });
        return { status: 401, body };
      }

      const body = { user: ctx.user };
      await recordRequest(logger, ctx, { status: 201, body });
      return { status: 201, body };
    },
  })
  .block(app => app.http({
    path: "/catalog/featured",
    meta: { verb: "GET", protocol: "GET" },
    handler: async (ctx) => {
      featuredBuilds += 1;
      const body = {
        build: featuredBuilds,
        products: [
          { id: "keyboard", name: "Low profile keyboard" },
          { id: "notebook", name: "Project notebook" },
        ],
      };

      await recordRequest(logger, ctx, { status: 201, body }, [{
        name: "cache",
        method: "getEntry/setEntry",
        startTime: new Date(),
        endTime: new Date(),
        got: { key: "featured-products" },
        returned: { cachedBy: "InMemoryCacheService" },
      }]);
      return { status: 201, body };
    },
  }))
  .post({
    path: "/files",
    args: z.object({
      path: z.string().min(1),
      content: z.string(),
    }),
    handler: async ctx => {
      const relativePath = String(ctx.request.body.get("path"));
      const content = String(ctx.request.body.get("content"));
      const started = new Date();
      const result = await ctx.services.getService("fileSaver").saveIfNotExists(relativePath, content);

      if (result.isError()) {
        const body = { error: result.v.error };
        await recordRequest(logger, ctx, { status: 409, body }, [{
          name: "fileSaver",
          method: "saveIfNotExists",
          startTime: started,
          endTime: new Date(),
          got: { relativePath },
          returned: body,
        }]);
        return { status: 409, body };
      }

      const body = result.unpack();
      await recordRequest(logger, ctx, { status: 201, body }, [{
        name: "fileSaver",
        method: "saveIfNotExists",
        startTime: started,
        endTime: new Date(),
        got: { relativePath },
        returned: body,
      }]);
      return { status: 201, body };
    },
  })
  .get({
    path: "/api/logs",
    handler: async ctx => {
      const body = { logs: await explorerLogsRepo.getAllLogs() };
      await recordRequest(logger, ctx, { status: 201, body });
      return { status: 201, body };
    },
  });

export const app = backendUi(baseApp as any, explorerLogsRepo as any);

if (import.meta.main) {
  const port =  await getAvailablePort()
  app.listen(port);
  console.log(`Applied Blazy server listening on http://localhost:${port}`);
  console.log("Explorer logs: http://localhost:%s/logs", port);
  console.log("Explorer services: http://localhost:%s/services", port);
}
