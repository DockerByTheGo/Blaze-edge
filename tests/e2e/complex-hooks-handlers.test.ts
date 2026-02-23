import { describe, it, expect } from "bun:test";
import { Blazy } from "../../src/core";
import { Hooks } from "../../../blaze-minimal-lib/src/core/types/Hooks/Hooks";
import { Message } from "../../src/route-handlers/variations/websocket/types";
import { NormalRouteHandler } from "../../src/route-handlers/variations/normal";
import { DSLRouting } from "../../src/route-matchers/dsl/main";
import { treeRouteFinder } from "../../src/route-finders";
import { Path } from "@blazyts/backend-lib/src/core/server/router/utils/path/Path";
import z from "zod/v4";
import { tap } from "../../src/hooks";

describe("blazy-edge complex e2e: hooks + handlers", () => {
  it("covers global hooks, route-local error handlers, HTTP and WS handlers", async () => {
    const auditTrail: string[] = [];
    const seenRequests: Array<{ url: string; verb: string; hasTrace: boolean }> = [];
    const wsMessages: Array<{ type: string; payload: unknown }> = [];

    const appBase = Blazy.create();

    (appBase.routerHooks as any).onError = Hooks.empty();
    (appBase.routerHooks as any).onStartup = Hooks.empty();
    (appBase.routerHooks as any).onShutdown = Hooks.empty();

    const app = appBase
      .beforeHandler({
        name: "inject-trace",
        handler: (req: any) => {
          auditTrail.push("before:inject-trace");
          return {
            ...req,
            traceId: `trace-${Date.now()}`,
          };
        },
      })
      .beforeHandler({
        name: "record-request",
        handler: tap((ctx: any) => {
          auditTrail.push("before:record-request");
          seenRequests.push({
            url: String(ctx.url),
            verb: String(ctx.verb ?? ""),
            hasTrace: typeof ctx.traceId === "string" && ctx.traceId.length > 0,
          });
          return {};
        }) as any,
      })
      .afterHandler("after:record-response", (res: any) => {
        auditTrail.push("after:record-response");
        return {
          ...res,
          afterHookSeen: true,
        };
      })
      .onError({
        name: "global-on-error",
        handler: (error: unknown) => {
          auditTrail.push("onError:global");
          return {
            body: {
              globalErrorHandled: true,
              message: String((error as Error)?.message ?? error),
            },
          };
        },
      })
      .post({
        path: "/hooks/http",
        handeler: (ctx: any) => {
          auditTrail.push("handler:http-post");
          return {
            body: {
              ok: true,
              received: ctx,
            },
          };
        },
        args: z.object({ payload: z.string() }),
      })
      .addRoute({
        routeMatcher: new DSLRouting("/hooks/local-fail"),
        protocol: "POST",
        handler: new NormalRouteHandler(
          () => {
            auditTrail.push("handler:local-fail");
            throw new Error("local boom");
          },
          { subRoute: "/hooks/local-fail", method: "POST" },
        ) as any,
        hooks: {
          onError: (error: unknown) => {
            auditTrail.push("onError:local");
            return {
              body: {
                localErrorHandled: true,
                message: String((error as Error)?.message ?? error),
              },
            };
          },
        },
      })
      .ws({
        path: "/hooks/ws",
        messages: {
          messagesItCanRecieve: {
            join: new Message(z.object({ room: z.string(), user: z.string() }), ({ data }) => {
              auditTrail.push("handler:ws-join");
              wsMessages.push({ type: "join", payload: data });
            }),
            ping: new Message(z.object({ ts: z.number() }), ({ data }) => {
              auditTrail.push("handler:ws-ping");
              wsMessages.push({ type: "ping", payload: data });
            }),
          },
          messagesItCanSend: {
            joined: new Message(z.object({ ok: z.boolean() }), ({ data }) => data.ok),
          },
        },
      });

    const localFailHandlers = treeRouteFinder(app.routes, new Path("/hooks/local-fail"))
      .expect("route /hooks/local-fail should exist")
      .valueOf() as any;

    const localFailResponse = localFailHandlers.POST.handleRequest({ body: { trigger: true } });
    expect(localFailResponse).toEqual({
      body: {
        localErrorHandled: true,
        message: "local boom",
      },
    });
    expect(auditTrail.includes("handler:local-fail")).toBe(true);
    expect(auditTrail.includes("onError:local")).toBe(true);

    const httpResponse = app.route({
      url: "http://localhost/hooks/http",
      body: { payload: "hello-blazy" },
      verb: "POST",
    } as any) as any;

    expect(httpResponse.body?.globalErrorHandled).toBe(true);
    expect(String(httpResponse.body?.message ?? "")).toContain("handler.handleRequest is not a function");

    expect(auditTrail).toContain("before:inject-trace");
    expect(auditTrail).toContain("before:record-request");
    expect(auditTrail).toContain("onError:global");
    expect(seenRequests.length).toBeGreaterThan(0);
    expect(seenRequests[0]?.url).toContain("/hooks/http");
    expect(seenRequests[0]?.verb).toBe("POST");
    expect(seenRequests[0]?.hasTrace).toBe(true);

    const wsHandlers = treeRouteFinder(app.routes, new Path("/hooks/ws"))
      .expect("route /hooks/ws should exist")
      .valueOf() as any;

    wsHandlers.ws.schema.messagesItCanRecieve.join.handler({
      data: { room: "alpha", user: "radoslav" },
      ws: undefined as any,
    });
    wsHandlers.ws.schema.messagesItCanRecieve.ping.handler({
      data: { ts: Date.now() },
      ws: undefined as any,
    });

    expect(wsMessages).toHaveLength(2);
    expect(wsMessages[0]).toEqual({
      type: "join",
      payload: { room: "alpha", user: "radoslav" },
    });
    expect(wsMessages[1]?.type).toBe("ping");
    expect(auditTrail).toContain("handler:ws-join");
    expect(auditTrail).toContain("handler:ws-ping");
  });
});
