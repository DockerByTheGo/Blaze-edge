import { describe, it, expect, vi, expectTypeOf } from "vitest";
import { Client } from "src/client/Client";
import type { IRouteHandler, IRouteHandlerMetadata } from "@blazyts/backend-lib/src/core/server";

// Client spreads extra fields (path, verb, …) on top of IRouteHandlerMetadata at runtime
type RuntimeMeta = IRouteHandlerMetadata & Record<string, unknown>;

// ---------------------------------------------------------------------------
// Mock handler factory
//
// Returns a fully-typed IRouteHandler whose getClientRepresentation produces
// a concrete function type – this is what drives ClientObject<T> intellisense.
// ---------------------------------------------------------------------------
function makeMockHandler<TArg, TReturn>(
  subRoute: string,
  response: TReturn,
) {
  type ClientFn = (arg: TArg) => Promise<TReturn>;

  const clientFn = vi.fn(async (_arg: TArg): Promise<TReturn> => response);

  const handler = {
    metadata: { subRoute, verb: "POST" as const },
    handleRequest: (_arg: TArg): TReturn => response,
    getClientRepresentation: (_meta: RuntimeMeta): ClientFn => {
      Object.assign(clientFn, {
        method: "post",
        path: _meta["path"] ?? subRoute,
        metadata: _meta,
      });
      return clientFn;
    },
  } satisfies IRouteHandler<any, any>;

  return handler;
}

// ---------------------------------------------------------------------------
// Typed route tree helpers
//
// Building the tree with explicit types lets TypeScript resolve ClientObject<T>
// all the way down, giving full intellisense on client.routes.
// ---------------------------------------------------------------------------
function protocolLeaf<
  TProtocol extends string,
  THandler extends IRouteHandler<any, any>,
>(protocol: TProtocol, handler: THandler) {
  return { "/": { [protocol]: handler } } as {
    "/": { [K in TProtocol]: THandler };
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Client", () => {
  it("exposes a route at the correct nested path", () => {
    const handler = makeMockHandler<{ name: string }, { id: number }>("/api/users", { id: 1 });
    const tree = { api: { users: protocolLeaf("POST", handler) } };

    const client = new Client(tree, "http://localhost:3000");

    // Full intellisense: client.routes.api.users["/"].POST is typed as
    // (arg: { name: string }) => Promise<{ id: number }>
    expect(client.routes.api.users["/"]).toBeDefined();
    expect(client.routes.api.users["/"].POST).toBeDefined();
    
  });

  it("calls getClientRepresentation with the correct serverUrl", () => {
    const receivedMeta: RuntimeMeta[] = [];

    const handler: IRouteHandler<any, any> = {
      metadata: { subRoute: "/items", verb: "POST" },
      handleRequest: () => ({}),
      getClientRepresentation: (meta) => {
        receivedMeta.push(meta as RuntimeMeta);
        return vi.fn(async () => ({}));
      },
    };

    const tree = { items: protocolLeaf("POST", handler) };
    new Client(tree, "http://example.com");

    expect(receivedMeta).toHaveLength(1);
    expect(receivedMeta[0]!.serverUrl).toBe("http://example.com/items");
  });

  it("the client fn is callable and returns the mocked response", async () => {
    const handler = makeMockHandler<{ qty: number }, { created: boolean }>("/orders", { created: true });
    const tree = { orders: protocolLeaf("POST", handler) };

    const client = new Client(tree, "http://localhost:3000");

    // intellisense knows this is (arg: { qty: number }) => Promise<{ created: boolean }>
    const result = await client.routes.orders["/"].POST({ qty: 3 });

    expect(result).toEqual({ created: true });
    expect(client.routes.orders["/"].POST).toHaveBeenCalledTimes(1);
    expect(client.routes.orders["/"].POST).toHaveBeenCalledWith({ qty: 3 });
  });

  it("multiple protocols on the same path are both built", () => {
    const postHandler = makeMockHandler<{ body: string }, { ok: boolean }>("/things", { ok: true });
    const getHandler  = makeMockHandler<void, { items: string[] }>("/things", { items: [] });

    const tree = {
      things: {
        "/": { POST: postHandler, GET: getHandler },
      } as {
        "/": { POST: typeof postHandler; GET: typeof getHandler };
      },
    };

    const client = new Client(tree, "http://localhost:3000");

    // intellisense: POST and GET are distinct typed fns
    expect(client.routes.things["/"].POST).toBeDefined();
    expect(client.routes.things["/"].GET).toBeDefined();
  });

  it("deeply nested routes are reachable", () => {
    const handler = makeMockHandler<{ x: number }, { y: number }>("/a/b/c", { y: 42 });
    const tree = { a: { b: { c: protocolLeaf("POST", handler) } } };

    const client = new Client(tree, "http://localhost:3000");

    // intellisense resolves all three levels
    expect(client.routes.a.b.c["/"].POST).toBeDefined();
  });

  it("passes path built from tree traversal to getClientRepresentation", () => {
    const receivedMeta: RuntimeMeta[] = [];

    const handler: IRouteHandler<any, any> = {
      metadata: { subRoute: "/deep/route", verb: "POST" },
      handleRequest: () => ({}),
      getClientRepresentation: (meta) => {
        receivedMeta.push(meta as RuntimeMeta);
        return vi.fn(async () => ({}));
      },
    };

    const tree = { deep: { route: protocolLeaf("POST", handler) } };
    new Client(tree, "http://localhost:3000");

    expect(receivedMeta[0]!["path"]).toBe("/deep/route");
  });

  it("skips protocol slots where getClientRepresentation is absent", () => {
    const broken = {
      metadata: { subRoute: "/bad" },
      handleRequest: () => ({}),
      // no getClientRepresentation
    };

    const tree = { bad: { "/": { POST: broken } } };

    // should not throw
    const client = new Client(tree as any, "http://localhost:3000");
    expect((client.routes as any).bad["/"].POST).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Type-level tests – these are compile-time only, no runtime assertions needed
// ---------------------------------------------------------------------------
describe("Client types", () => {
  it("POST route is typed as a callable fn with the correct arg and return", () => {
    const handler = makeMockHandler<{ name: string }, { id: number }>("/users", { id: 1 });
    const tree = { users: protocolLeaf("POST", handler) };
    const client = new Client(tree, "http://localhost:3000");

    // arg type
    expectTypeOf(client.routes.users["/"].POST).parameter(0).toEqualTypeOf<{ name: string }>();
    // return type
    expectTypeOf(client.routes.users["/"].POST).returns.toEqualTypeOf<Promise<{ id: number }>>();
  });

  it("nested path resolves to the correct leaf type", () => {
    const handler = makeMockHandler<{ q: string }, { results: string[] }>("/api/search", { results: [] });
    const tree = { api: { search: protocolLeaf("POST", handler) } };
    const client = new Client(tree, "http://localhost:3000");

    expectTypeOf(client.routes.api.search["/"].POST)
      .parameter(0)
      .toEqualTypeOf<{ q: string }>();

    expectTypeOf(client.routes.api.search["/"].POST)
      .returns
      .toEqualTypeOf<Promise<{ results: string[] }>>();
  });

  it("two protocols on the same path have independent types", () => {
    const postHandler = makeMockHandler<{ body: string }, { ok: boolean }>("/things", { ok: true });
    const getHandler  = makeMockHandler<undefined, { items: number[] }>("/things", { items: [] });

    const tree = {
      things: {
        "/": { POST: postHandler, GET: getHandler },
      } as {
        "/": { POST: typeof postHandler; GET: typeof getHandler };
      },
    };

    const client = new Client(tree, "http://localhost:3000");

    expectTypeOf(client.routes.things["/"].POST).parameter(0).toEqualTypeOf<{ body: string }>();
    expectTypeOf(client.routes.things["/"].POST).returns.toEqualTypeOf<Promise<{ ok: boolean }>>();

    expectTypeOf(client.routes.things["/"].GET).parameter(0).toEqualTypeOf<undefined>();
    expectTypeOf(client.routes.things["/"].GET).returns.toEqualTypeOf<Promise<{ items: number[] }>>();
  });

  it("deeply nested route resolves all the way down", () => {
    const handler = makeMockHandler<{ x: number }, { y: number }>("/a/b/c", { y: 0 });
    const tree = { a: { b: { c: protocolLeaf("POST", handler) } } };
    const client = new Client(tree, "http://localhost:3000");

    expectTypeOf(client.routes.a.b.c["/"].POST).parameter(0).toEqualTypeOf<{ x: number }>();
    expectTypeOf(client.routes.a.b.c["/"].POST).returns.toEqualTypeOf<Promise<{ y: number }>>();
  });

  it("client.routes itself is not any", () => {
    const handler = makeMockHandler<{ v: boolean }, { v: boolean }>("/flag", { v: true });
    const tree = { flag: protocolLeaf("POST", handler) };
    const client = new Client(tree, "http://localhost:3000");

    expectTypeOf(client.routes).not.toBeAny();
  });
});
