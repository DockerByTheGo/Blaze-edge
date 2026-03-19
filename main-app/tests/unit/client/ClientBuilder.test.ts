import { describe, it, expect, expectTypeOf } from "vitest";
import { ClientBuilder, CleintBuilderConstructors } from "src/client/client-builder/clientBuilder";
import { Client } from "src/client/Client";
import type { IRouteHandler, IRouteHandlerMetadata } from "@blazyts/backend-lib/src/core/server";

// ---------------------------------------------------------------------------
// Shared mock handler helpers (same pattern as Client.test.ts)
// ---------------------------------------------------------------------------
type RuntimeMeta = IRouteHandlerMetadata & Record<string, unknown>;

function makeMockHandler<TArg, TReturn>(subRoute: string, response: TReturn) {
  type ClientFn = (arg: TArg) => Promise<TReturn>;
  const clientFn = async (_arg: TArg): Promise<TReturn> => response;

  return {
    metadata: { subRoute, verb: "POST" as const },
    handleRequest: (_arg: TArg): TReturn => response,
    getClientRepresentation: (_meta: RuntimeMeta): ClientFn => clientFn,
  } satisfies IRouteHandler<any, any>;
}

function protocolLeaf<TProtocol extends string, THandler extends IRouteHandler<any, any>>(
  protocol: TProtocol,
  handler: THandler,
) {
  return { "/": { [protocol]: handler } } as { "/": { [K in TProtocol]: THandler } };
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
describe("ClientBuilder", () => {
  describe("CleintBuilderConstructors", () => {
    it("empty() returns a ClientBuilder instance", () => {
      const builder = CleintBuilderConstructors.empty();
      expect(builder).toBeInstanceOf(ClientBuilder);
    });

    it("fromRouteTree() returns a ClientBuilder instance", () => {
      const handler = makeMockHandler<{ name: string }, { id: number }>("/users", { id: 1 });
      const tree = { users: protocolLeaf("POST", handler) };

      const builder = CleintBuilderConstructors.fromRouteTree(tree);
      expect(builder).toBeInstanceOf(ClientBuilder);
    });

    it("static empty() also returns a ClientBuilder instance", () => {
      const builder = ClientBuilder.empty();
      expect(builder).toBeInstanceOf(ClientBuilder);
    });
  });

  describe("createClient()", () => {
    
    it("client built from a route tree exposes the routes", () => {
      const handler = makeMockHandler<{ name: string }, { id: number }>("/users", { id: 1 });
      const tree = { users: protocolLeaf("POST", handler) };

      const client = CleintBuilderConstructors.fromRouteTree(tree).createClient()("http://localhost:3000");

      expect(client.routes.users["/"]).toBeDefined();
      expect(client.routes.users["/"].POST).toBeDefined();
    });

    it("calling createClient() twice produces independent Client instances", () => {
      const factory = CleintBuilderConstructors.empty().createClient();
      const a = factory("http://a.com");
      const b = factory("http://b.com");

      expect(a).not.toBe(b);
      expect(a.url).toBe("http://a.com");
      expect(b.url).toBe("http://b.com");
    });
  });
});

// ---------------------------------------------------------------------------
// Type-level tests
// ---------------------------------------------------------------------------
describe("ClientBuilder types", () => {
;

  it("client.routes from builder preserves the route tree type", () => {
    const handler = makeMockHandler<{ name: string }, { id: number }>("/users", { id: 1 });
    const tree = { users: protocolLeaf("POST", handler) };

    const client = CleintBuilderConstructors.fromRouteTree(tree).createClient()("http://localhost:3000");

    // POST fn arg and return are fully typed
    expectTypeOf(client.routes.users["/"].POST).parameter(0).toEqualTypeOf<{ name: string }>();
    expectTypeOf(client.routes.users["/"].POST).returns.toEqualTypeOf<Promise<{ id: number }>>();
  });

  it("empty builder produces Client<{}>", () => {
    const client = CleintBuilderConstructors.empty().createClient()("http://localhost:3000");
    expectTypeOf(client).toEqualTypeOf<Client<{}>>();
  });
});