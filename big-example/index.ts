import { S3Client } from "@aws-sdk/client-s3";
import { backendUi, StandaloneLogsViewServer } from "@blazyts/backend-explorer";
import { ClerkAuthService } from "@blazyts/batteries-authentication-clerk";
import { GoogleAuthService } from "@blazyts/batteries-authentication-google";
import { SelfHostedAuthService, type PostgresLikeClient } from "@blazyts/batteries-authentication-self-hosted";
import { AdaptiveCacheService, type MySqlLikeClient } from "@blazyts/batteries-cache-adaptive";
import { InMemoryCacheService } from "@blazyts/batteries-cache-in-memory";
import { RedisCacheService } from "@blazyts/batteries-cache-redis";
import { MulterFileSaver } from "@blazyts/batteries-file-upload-multer";
import { S3FileSaver } from "@blazyts/batteries-file-upload-s3";
import { CombinedLoggerService, type LogStore } from "@blazyts/batteries-logger";
import { RedisLikeEntityClient, type RedisLikeClient } from "@blazyts/batteries-redislike-client";
import { BlazyConstructor } from "@blazyts/blazy-edge";
import z from "zod/v4";

type ExampleReport = {
  framework: string;
  redisEntity: unknown;
  caches: {
    inMemory: unknown;
    redis: unknown;
    adaptive: unknown;
  };
  auth: {
    google: unknown;
    selfHosted: unknown;
    clerk: unknown;
  };
  files: {
    multerRoot: string;
    s3Prefix: string;
  };
  logger: unknown;
  explorer: {
    middleware: string;
    logsView: string;
  };
};

class MemoryRedisLikeClient implements RedisLikeClient {
  private readonly values = new Map<string, { value: string; expiresAt?: number }>();

  set(key: string, value: string, mode?: "PX", ttl?: number): void {
    this.values.set(key, {
      value,
      expiresAt: mode === "PX" && ttl !== undefined ? Date.now() + ttl : undefined,
    });
  }

  get(key: string): string | null {
    const entry = this.values.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      this.values.delete(key);
      return null;
    }

    return entry.value;
  }

  exists(key: string): number {
    return this.get(key) === null ? 0 : 1;
  }

  del(key: string): number {
    return this.values.delete(key) ? 1 : 0;
  }

  keys(pattern: string): string[] {
    const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
    return [...this.values.keys()].filter(key => key.startsWith(prefix) && this.get(key) !== null);
  }
}

class MemoryAdaptiveMysql implements MySqlLikeClient {
  private readonly rows = new Map<string, {
    cache_key: string;
    cache_value: string;
    created_at: number;
    expires_at: number | null;
  }>();

  query<TRow = Record<string, unknown>>(sql: string, params: unknown[] = []): { rows: TRow[] } {
    if (/INSERT INTO/i.test(sql)) {
      const [key, value, createdAt, expiresAt] = params as [string, string, number, number | null];
      this.rows.set(key, {
        cache_key: key,
        cache_value: value,
        created_at: createdAt,
        expires_at: expiresAt,
      });
      return { rows: [] };
    }

    if (/SELECT/i.test(sql) && /WHERE cache_key/i.test(sql)) {
      const [key] = params as [string];
      const row = this.rows.get(key);
      return { rows: (row ? [row] : []) as TRow[] };
    }

    if (/SELECT/i.test(sql)) {
      return { rows: [...this.rows.values()] as TRow[] };
    }

    if (/DELETE FROM/i.test(sql) && /WHERE cache_key/i.test(sql)) {
      const [key] = params as [string];
      this.rows.delete(key);
    }

    if (/DELETE FROM/i.test(sql) && !/WHERE cache_key/i.test(sql)) {
      this.rows.clear();
    }

    return { rows: [] };
  }
}

class MemoryPostgresAuth implements PostgresLikeClient {
  private readonly users = new Map<string, { username: string; password_hash: string }>();

  query<TRow = Record<string, unknown>>(sql: string, params: unknown[] = []): { rows: TRow[] } {
    if (/INSERT INTO/i.test(sql) && /auth_users/i.test(sql)) {
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
    return [...this.logs.values()];
  }
}

export async function runBigExample(): Promise<ExampleReport> {
  const app = BlazyConstructor.createProd();
  const redis = new MemoryRedisLikeClient();

  const redisEntities = new RedisLikeEntityClient(
    redis,
    {
      session: z.object({
        userId: z.string(),
        roles: z.array(z.string()),
      }),
    },
    { keyPrefix: "example:" },
  );
  await redisEntities.put("session", "radoslav", { userId: "radoslav", roles: ["admin", "editor"] });

  const inMemoryCache = new InMemoryCacheService<string>({ defaultTtl: 30_000 });
  inMemoryCache.setEntry("homepage", "rendered-from-memory");

  const redisCache = new RedisCacheService<string>(redis, {
    keyPrefix: "cache:",
    valueSchema: z.string(),
  });
  await redisCache.setEntry("profile", "rendered-from-redis");

  const adaptiveCache = new AdaptiveCacheService<{ title: string; toDb?: boolean }>({
    redis,
    mysql: new MemoryAdaptiveMysql(),
    keyPrefix: "adaptive:",
    valueSchema: z.object({ title: z.string(), toDb: z.boolean().optional() }),
  });
  await adaptiveCache.setEntry("hot-story", { title: "Hot story" });
  await adaptiveCache.setEntry("archive-story", { title: "Archive story", toDb: true });

  const googleAuth = new GoogleAuthService({
    clientId: "google-client-id",
    clientSecret: "google-client-secret",
    redirectUri: "http://localhost:3000/auth/google/callback",
  });
  const googleAuthResult = await googleAuth.authenticate({ code: "demo-code" });

  const selfHostedAuth = new SelfHostedAuthService({
    postgres: new MemoryPostgresAuth(),
    tokenStore: { type: "memory" },
    passwordHash: { iterations: 1 },
  });
  await selfHostedAuth.registerUser("demo", "correct-horse-battery-staple");
  const selfHostedAuthResult = await selfHostedAuth.authenticate({
    username: "demo",
    password: "correct-horse-battery-staple",
  });

  const clerkAuth = new ClerkAuthService({
    publishableKey: "pk_test_example",
    secretKey: "sk_test_example",
    clerkClient: {
      signInTokens: {
        createSignInToken: async ({ userId }) => ({
          id: `ticket_${userId}`,
          token: `clerk-ticket-for-${userId}`,
          expiresAt: Date.now() + 60_000,
        }),
        revokeSignInToken: async () => ({}),
      },
      authenticateRequest: async () => ({
        isAuthenticated: true,
        toAuth: () => ({
          userId: "clerk-user",
          sessionClaims: { sub: "clerk-user", exp: Math.floor((Date.now() + 60_000) / 1000) },
        }),
      }),
    },
  });
  const clerkTokenResult = await clerkAuth.issueToken("clerk-user");

  const multerFileSaver = new MulterFileSaver("/tmp/blazy-edge-big-example/uploads");
  const s3FileSaver = new S3FileSaver(
    new S3Client({
      region: "us-east-1",
      credentials: { accessKeyId: "example", secretAccessKey: "example" },
    }),
    "blazy-edge-demo",
    "uploads",
  );

  const logger = new CombinedLoggerService<{ route: string }>({
    handler: input => input.level === "error" ? "both" : "redis",
    mysql: new MemoryLogStore(),
    redis: new MemoryLogStore(),
    createId: input => `log:${input.level}:${input.message}`,
  });
  await logger.log({
    level: "info",
    message: "big example booted",
    payload: { route: "/health" },
    source: "big-example",
  });

  return {
    framework: app.constructor.name,
    redisEntity: await redisEntities.get("session", "radoslav"),
    caches: {
      inMemory: inMemoryCache.getEntry("homepage").unpack().unpack_with_default("missing"),
      redis: (await redisCache.getEntry("profile")).unpack().unpack_with_default("missing"),
      adaptive: (await adaptiveCache.getAll()).unpack().map(entry => entry.key),
    },
    auth: {
      google: googleAuthResult.unpack(),
      selfHosted: selfHostedAuthResult.unpack(),
      clerk: clerkTokenResult.unpack(),
    },
    files: {
      multerRoot: multerFileSaver.config.rootDirectory,
      s3Prefix: s3FileSaver.config.prefix,
    },
    logger: await logger.getAll(),
    explorer: {
      middleware: typeof backendUi,
      logsView: typeof StandaloneLogsViewServer,
    },
  };
}

if (import.meta.main) {
  const report = await runBigExample();
  console.log(JSON.stringify(report, null, 2));
}
