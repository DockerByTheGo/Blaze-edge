import { RouterObject } from "@blazyts/backend-lib";
import type { PathStringToObject, RouterHooks, type RouteTree } from "@blazyts/backend-lib/src/core/server/router/types";
import type { And, IFunc, KeyOfOnlyStringKeys, TypeSafeOmit, URecord, } from "@blazyts/better-standard-library";
import { BasicValidator, ifNotNone, map, NormalFunc, objectEntries, Optionable, Try } from "@blazyts/better-standard-library";
import { FunctionRouteHandler } from "./route-handlers/variations/function/FunctionRouteHandler";
import { Path } from "@blazyts/backend-lib/src/core/server/router/utils/path/Path";
import { FileRouteHandler, NormalRouteHandler } from "./route-handlers/variations";
import { DSLRouting } from "./route-matchers/dsl/main";
import { NormalRouting, } from "./route-matchers/normal";
import { Hook, Hooks, type HooksDefault } from "@blazyts/backend-lib/src/core/types/Hooks/Hooks";
import type { ExtractParams } from "./route-matchers/dsl/types/extractParams";
import { treeRouteFinder } from "./route-finders";
import z from "zod/v4";
import { CleintBuilderConstructors, ClientBuilder } from "./client/client-builder/clientBuilder";
import { RequestObjectHelper } from "@blazyts/backend-lib/src/core/utils/RequestObjectHelper";
import type { IRouteHandler, RouteFinder } from "@blazyts/backend-lib/src/core/server";
import type { ClientObject } from "./client/Client";
import type { HandlerProtocol } from "./types";
import { WebsocketRouteHandler } from "./route-handlers/variations/websocket";

type EmptyHooks = ReturnType<typeof Hooks.empty>

/**
 * Main Blazy framework class that extends RouterObject for building backend applications.
 * Provides methods for adding services, authentication, routing, and request handling.
 */
export class Blazy<
  TRouterTree extends RouteTree,
  THooks extends RouterHooks
> extends RouterObject<{
  beforeHandler: EmptyHooks,
  afterHandler: EmptyHooks,
  onError: EmptyHooks,
  onStartup: EmptyHooks,
  onShutdown: EmptyHooks

}, TRouterTree> {
  static create(): Blazy<{}, {}> {
    return new Blazy({
      beforeHandler: Hooks.empty(),
      afterHandler: Hooks.empty()

    }, {} as any, undefined as any);
  }
  /**
   * Creates a new instance of Blazy.
   * Initializes with a cache service.
   */
  constructor(routerHooks?: THooks, routes?: TRouterTree, routeFinder?: RouteFinder<any>) {
    // const cache = new Cache();
    super(
      routerHooks ?? {
        beforeHandler: Hooks.empty(),
        afterHandler: Hooks.empty(),
      },
      routes ?? {},
      routeFinder ?? treeRouteFinder
    );
    // this.addService("name", cache);
  }

  /**
   * Override addRoute to return a Blazy instance instead of RouterObject
   * and to structure routes with "/" prefix for tree-based routing
   */
  override addRoute<
    TPath extends string,
    THandler extends IRouteHandler<any, any>,
    TProtocol extends HandlerProtocol,
    TLocalHooks extends Record<string, any> | undefined = undefined,
  >(v: {
    routeMatcher: { getRouteString(): TPath },
    handler: THandler,
    hooks?: TLocalHooks,
    protocol?: TProtocol
  }): Blazy<
    TRouterTree &
    PathStringToObject<
      TPath,
      THandler,
      TProtocol
    >,
    THooks
  > {
    const routeString = v.routeMatcher.getRouteString();
    const segments = routeString.split("/").filter(s => s !== "");
    const newRoutes = { ...this.routes };
    let current: any = newRoutes;

    // Navigate/create nested structure
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!current[segment]) {
        current[segment] = {};
      }
      current = current[segment];
    }

    // Initialize "/" object if it doesn't exist
    if (!current["/"]) {
      current["/"] = {};
    }

    // Place handler at protocol key under "/"
    const modifiedHandler: any = {
      ...v.handler,
      getClientRepresentation: v.handler.getClientRepresentation,
      handleRequest: arg => {
        try {
          return v.handler.handleRequest(arg);
        } catch (e) {
          if (v.hooks?.onError) {
            return v.hooks.onError(e);
          }
          throw e;
        }
      }
    };

    const protocol = v.protocol || 'http';
    current["/"][protocol] = modifiedHandler;

    return new Blazy(this.routerHooks, newRoutes, this.routeFinder) as unknown as Blazy<
      TRouterTree &
      PathStringToObject<
        TPath,
        THandler,
        TProtocol
      >,
      THooks
    >;
  }

  /**
   * Adds a service to the Blazy instance, making it available through hooks.
   * @param name - The name of the service.
   * @param v - The service object containing functions.
   */
  addService(name: string, v: Record<string, (value: any) => any>) {
    this.hook((v) => {
      return {
        ...v,
        [name]: createSubscribeable(v),
      };
    });
  }

  /**
   * Sets up authentication for the application.
   * This method configures hooks for authentication.
   */
  auth() {

  } // sets a  guard hook for authentication 

  /**
   * Sets up pre-authentication logic.
   * This method configures hooks that run before authentication.
   */
  beforeAuth() {

  }


  beforeRequestHandler<TReturn, TName extends string>(
    name: TName,
    func: (arg: THooks["beforeHandler"]["TGetLastHookReturnType"]) => TReturn
  ): Blazy<
    TRouterTree,
    And<[
      TypeSafeOmit<THooks, "beforeHandler">,
      {
        beforeHandler: Hooks<[
          ...THooks["beforeHandler"]["v"],
          Hook<
            TName,
            (arg: THooks["beforeHandler"]["TGetLastHookReturnType"]) => TReturn
          >
        ]>
      }
    ]>
  > {
    this.beforeHandler({ name, handler: func })
    return this
  }
  /**
   * Handles logic after a request handler has been executed but before sending the response.
   * @param ctx - The request context.
   */
  afterRequestHandler(ctx) {
    if (ctx.isResponse) {
      // if a handler returned a response directly these will be skipped
    }
  } // runs after a req hanfdler has been ran but before sending the Response

  /**
   * Handles logic after the response has been sent.
   * This method configures hooks that run on sent responses.
   */
  afterResponse() {

  } // runs on a sent response

  /**
   * Converts an object with functions into routes.
   * If the object has an `isCrudified` property, it treats it as CRUD operations.
   * Otherwise, it adds each function as a POST route.
   * @param v - The object containing functions to be routed.
   * @template T - The type of the object.
   */
  routify<T extends Record<string, unknown>>(v: T) {
    if (v.isCrudified) {
      Object.entries(v).filter(([key, val]) => typeof val === "function").forEach(([key, value]) => {
        this[key](key, value);
      });
    }
    else {
      objectEntries(v).filter(([key, val]) => typeof val === "function").forEach(([key, value]) => {
        this.post(key, value);
      });
    }
  }

  routifyRpc() { }

  // allows you to call multiple methods on the app while using the app object, this allosws for use cases where you may need to access the app object but do not wanna breake method chaining for example 
  /*
  
    const app = new Blazy().addRoute().addRoute().block(console.log)
  
    // without it you will have to break the method chaining to console log at this current point since yeah you could at thend but then it will also have applied methods which you do not wanna observer 
  */




  block<TReturn extends Blazy>(func: (app: this) => TReturn): TReturn { }

  /**
   * Adds a simple route for a function with schema validation.
   * Creates an RPC-style route at `/rpc/{functionName}` that validates the request body
   * against the function's argument schema and executes the function.
   * the idea is that if you already have a function defined somewhere wjhich you want to quickly expose to use that, but if you are gonna be writing the func inside the router just use the http methoid which offers a much more elegant api for 
   * @param func - The function to add as a route.
   * @template TFunc - The type of the function.
   */
  simpleAddRoute<TFunc extends IFunc<string, Schema, URecord>>(func: TFunc) {
    this.addRoute({
      routeMatcher: new NormalRouting(`/rpc/${func.name}`),
      handler: new NormalRouteHandler(ctx => {
        return new BasicValidator(func.argsSchema).validate({}).try({
          ifError: {
            typeMismatch: v => new Response(JSON.stringify({ error: "Invalid schema", details: v }), {
              status: 400,
              headers: {
                "Content-Type": "application/json",
              },
            }),
          },
          "ifSuccess": v => new Response(JSON.stringify({ result: func.execute(v) }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        })
      }),
      hooks: {}
    });



  }
  // by defaulkt it adds the name of the file as the path for example File("/hi.txt") -> /hi.txt
  file<TPath extends string>(path: TPath, route?: string): this {// maybe use the builtin path strucutre
    return this.addRoute({
      routeMatcher: new NormalRouting(`/static/${route ? route : path}}`),
      handler: new FileRouteHandler(path),
    })
  }

  http<
    TPath extends string,
    Thandler extends (arg: Args extends null ? URecord : Args
    ) => unknown,
    TProtocol extends HandlerProtocol,
    Args extends z.ZodObject | null = null,
  >(v: {
    path: TPath,
    handler: Thandler,
    args?: Args,
    meta?: URecord & { protocol?: TProtocol }
  }): Blazy<
    TRouterTree &
    PathStringToObject<
      TPath,
      NormalRouteHandler<
        Parameters<Thandler>[0],
        ReturnType<Thandler>
      >,
      TProtocol
    >,
    THooks
  > {
    const metadata = { subRoute: v.path, ...v.meta }
    return this.addRoute({
      routeMatcher: new DSLRouting(v.path),
      protocol: (v.meta?.protocol as TProtocol) || ('http' as TProtocol),
      // the checking of definition of args could be done using a single normal routing handler and oing the check inside but this would hurt performace a bit and yeah we are missing the forst for the trees given the awful performace of the framework but its so easy to do it here 
      handler: (v.args)
        ? new NormalRouteHandler(arg => {
          const res = v.args.safeParse(arg)

          if (res.success) {
            return v.handler(res.data)
          }

          return res.error

        }, metadata)
        : new NormalRouteHandler(a => v.handler(a), metadata)
    })
  }


  notFound() {

  } // can be stacked and overwritten to


  // note if you try to introduce optional param it will lead to weird behaviour where it  creates two paths for one added handler one which is [''] and the other is the desried 
  post<
    THandler extends (arg: (TArgs extends undefined ? URecord : z.infer<TArgs>) & ExtractParams<TPath>) => unknown,
    TArgs extends z.ZodObject | undefined,
    TPath extends string,
  >(config: { path: TPath, handeler: THandler, args?: TArgs }): Blazy<
    TRouterTree &
    PathStringToObject<
      TPath,
      NormalRouteHandler<
        Parameters<THandler>[0],
        ReturnType<THandler>
      >,
      'POST'
    >,
    THooks
  > {

    return this.http<TPath, THandler, any, 'POST'>({
      path: config.path,
      handler: v => {
        if (v.verb?.indexOf("POST") > -1 && v.verb.length === 4)
          return config.handeler(v)
        return this.notFound()
      },
      meta: { verb: "POST", protocol: "POST" as const }
    })

  }

  getAll<
    THandler extends (arg: TArgs extends undefined ? URecord : TArgs) => unknown,
    TArgs extends URecord | undefined
  >(config: {
    args?: TArgs,
    handler: THandler
  }) {

    return this.get({
      path: "/",
      handler: config.handler,
      args: config.args
    })

  }

  get<
    TPath extends string,
    THandler extends (arg: (TArgs extends undefined ? URecord : TArgs) & ExtractParams<TPath>) => unknown,
    TArgs extends URecord | undefined
  >(config: {
    path: TPath,
    handler: THandler,
    args: TArgs
  }): Blazy<
    TRouterTree &
    PathStringToObject<
      TPath,
      NormalRouteHandler<
        Parameters<THandler>[0],
        ReturnType<THandler>
      >,
      'GET'
    >,
    THooks
  > {

    return this.http<TPath, THandler, any, 'GET'>({
      path: config.path,
      handler: v => v.path === "GET" ? config.handler(v) : this.notFound(),
      args: config.args,
      meta: { verb: "GET", protocol: "GET" as const }
    })

  }

  /**
   * Adds a route from a typed function.
   * @param name - The name of the route.
   * @param func - The typed function to add as a route.
   * @template TName - The name type.
   * @template TFunc - The function type.
   * @returns The result of adding the route.
   */
  fromFunc<
    TName extends string,
    TFunc extends IFunc<TName, any, any>,
  >(name: TName, func: TFunc): this {
    return this.addRoute({
      routeMatcher: new NormalRouting(),
      handler: new FunctionRouteHandler(func)
    })
  }

  /**
   * Adds a route from a normal function.
   * Converts the function to a typed function and adds it as a route.
   * Creats a REST endpoint
   * Automatically adds the result to the response body 
   * @param name - The name of the route.
   * @param func - The normal function to add as a route.
   * @template TFunc - The function type.
   * @template TName - The name type.
   * @returns The result of adding the route.
   *
   */
  fromNormalFunc<
    TFunc extends (arg: { body: URecord }) => unknown,
    TName extends string
  >(name: TName, func: TFunc) {
    return this.fromFunc(name, NormalFunc.fromFunc(func, name))
  }


  /*
    json rpc version of routify
  */
  rpcRoutify()

  /*
  exposes a JSON RPC standard abiding the JSON rpc spec input and output, that is different from fromFunction which turns it into REST instead 
  */
  rpcFromFunction() { }

  /* proppiatary handler aims to achieve a mixture of good performace while still maintaing safety  
  
    comes from blazy rpc 
  */
  brpc() { }

  brpcFromFuncton() {

  }


  requestResponseWebsocket<
    TPath extends string,
    TSchema extends z.ZodObject
  >(v: {
    path: TPath,
    TS
  })

  ws<
    TPath extends string,
    TMessages extends Schema
  >(v: {
    path: TPath,
    messages: TMessages
  }): Blazy<
    TRouterTree &
    PathStringToObject<
      TPath,
      WsRouteHandler<TMessages>,
      "ws"
    >,
    THooks
  > {
    return this.addRoute({
      routeMatcher: new NormalRouting(v.path),
      handler: new WebsocketRouteHandler(v.messages, { subRoute: v.path }),
      protocol: 'ws' 
    });
  }

  wsFromObject() { }


  brpcRoutify() { }

  createClient(): ClientBuilder<TRouterTree, { beforeSend: HooksDefault, afterReceive: HooksDefault, onErrored: HooksDefault }> {
    return CleintBuilderConstructors.fromRouteTree(this.routes)
  }

  listen(port: number = 3000) {
    const server = Bun.serve({
      port,
      fetch: async (req: Request) => {
        try {
          const url = new URL(req.url);
          const pathname = url.pathname;

          // Check if this is a WebSocket upgrade request
          const upgradeHeader = req.headers.get("upgrade");
          
          if (upgradeHeader?.toLowerCase() === "websocket") {
            const success = server.upgrade(req, { data: { pathname, body: {}, type: "join" } });
            console.log("Upgrade success:", success);
            if (success) {
              return undefined;
            }
          }


          const headers: Record<string, string> = {};
          req.headers.forEach((v, k) => (headers[k] = v));

          let body: any = {};
          const contentType = req.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            try { body = await req.json(); } catch { body = {} }
          } else {
            try { const text = await req.text(); if (text) body = { text }; } catch { body = {} }
          }

          const res = this.route({ url: req.url, body, verb: req.method });

          // If router returned a native Response, forward it. Otherwise try to coerce.
          if (res instanceof Response) return res;
          return new Response(JSON.stringify(res), { headers: { "content-type": "application/json" } });
        } catch (e) {
          console.log(e)
          return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
        }
      },

      websocket: {
        data: {} as WsMessage & { connectionId?: string }, 
        open: (ws) => {
          // Generate a unique connection ID
          const connectionId = crypto.randomUUID();
          ws.data.connectionId = connectionId;
          console.log("WebSocket connected:", connectionId, "pathname:", ws.data.pathname);
        },
        message: (ws, message) => {
            const parsedMessage = JSON.parse(message.toString()) as WsMessage;
            
            // Find the handler for this route
            const handlerOptional = treeRouteFinder(this.routes, new Path(ws.data.pathname));
            
            if (handlerOptional.isNone()) {
              console.error("No handler found for path:", ws.data.pathname);
              return;
            }
            
            const routeHandlers = handlerOptional.unpack();
            
            // Get the ws handler from the protocol-organized structure
            const routeHandler = routeHandlers.valueOf().ws;
            
            if (!routeHandler) {
              console.error("No ws handler found for path:", ws.data.pathname);
              console.log("Available protocols:", Object.keys(routeHandlers));
              return;
            }
            
            // Call the message handler directly from the schema
            const messageHandler = routeHandler.schema.messagesItCanRecieve[parsedMessage.type];
            if (messageHandler) {
              messageHandler.handler({ data: parsedMessage.body, ws });
            } else {
              console.error("No message handler for type:", parsedMessage.type);
            }
        },
        close: (ws) => {
          console.log("WebSocket closed:", ws.data.connectionId);
        },
      },
    });

    return server;
  }

  applySubRouter<T extends Blazy>(v: Blazy) {

  }


  applySubrouterInline<Treturn extends Blazy>(func: (subRouter: this) => Treturn): this { } // so that we preserve intellisense 

  createSubrouter(): this { // so that we preserve intellisnse however note that you can define a subrouter in different file that way because it will create circular dependnecy 

  }

}