import { RouterObject } from "@blazyts/backend-lib";
import type { IFunc, Last, URecord } from "@blazyts/better-standard-library";
import { BasicValidator, map, NormalFunc, objectEntries, Try } from "@blazyts/better-standard-library";
import { FunctionRouteHandler } from "./route-handlers/variations/function/FunctionRouteHandler";
import type { Schema } from "@blazyts/better-standard-library/src/others/validator/schema";
import { Path } from "@blazyts/backend-lib/src/core/server/router/utils/path/Path";
import { NormalRouting } from "./route-matchers/normal";
import { Hook, Hooks } from "@blazyts/backend-lib/src/core/types/Hooks/Hooks";
import type { RouterHooks, RouteTree } from "@blazyts/backend-lib/src/core/server/router/hooks";
import type { PathStringToObject } from "@blazyts/backend-lib/src/core/server/router/types/PathStringToObject";
import { HttpRouteHandler } from "./route-handlers/variations";
import { ComplexRouteFinder } from "./route-finders/complex";

/**
 * Main Blazy framework class that extends RouterObject for building backend applications.
 * Provides methods for adding services, authentication, routing, and request handling.
 */

export type BlazyInstance = Blazy<{
  beforeRequest: [], afterRequest: []
}, {}>

export class Blazy<
  TRouterHooks extends RouterHooks,
  TRoutes extends RouteTree
> extends RouterObject<
  TRouterHooks,
  TRoutes
> {
  constructor(v: { routes: TRoutes, hooks: TRouterHooks }) {
    // const cache = new Cache();
    super({
      beforeRequest: Hooks.empty(),
      afterRequest: Hooks.empty()
    }, {}, (routes, path) => {
      new ComplexRouteFinder().findRoute(path.path)
    });
    // this.addService("name", cache);
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
  auth() { // this is a middleware which runs right after the last before auth hook 

  } // sets a hook for authentication 

  /*
  
  the first hook which is being ran when a new req is recieved

  there are three types of hooks which are of type onRequest by default, they are called parse -> transforms json string into js object. Before transform 
  which takes the js object and transforms it into the RequestHelper object 
  
  */
  onRequestHook() {

  }

  /**
   * Sets up pre-authentication logic.
   * This method configures hooks that run before authentication.
   * it runs right after the last onRequest hook 
   */
  beforeAuth() {

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
   * If smart is true, intelligently routes based on property names:
   * - Contains "get" -> GET route
   * - Contains "create" -> POST route
   * - Contains "update" -> PATCH route
   * - Otherwise -> POST route
   * If smart is false and object has `isCrudified` property, treats it as CRUD operations.
   * Otherwise, adds each function as a POST route.
   * @param v - The object containing functions to be routed.
   * @param smart - Whether to use intelligent routing based on property names.
   * @template TObject - The type of the object.
   */
  routifySmart<
    TObject extends Record<string, unknown>,
    TSmart extends boolean
  >(
    v: TObject,
    smart: TSmart
  ): Blazy<
    TRouterHooks,
    TSmart extends true
    ? TRoutes & {
      [K in keyof TObject as
      K extends `${infer _}get${infer __}` ? "GET" :
      K extends `${infer _}Get${infer __}` ? "GET" :
      K extends `${infer _}create${infer __}` ? "POST" :
      K extends `${infer _}Create${infer __}` ? "POST" :
      K extends `${infer _}update${infer __}` ? "PATCH" :
      K extends `${infer _}Update${infer __}` ? "PATCH" :
      "POST"
      ]: TObject[K]
    }
    : TRoutes & { [K in keyof TObject]: "POST" }
  > {

    if (smart) {
      objectEntries(v)
        .filter(([key, val]) => typeof val === "function")
        .forEach(([key, value]) => {
          const keyStr = String(key).toLowerCase();
          if (keyStr.includes("get")) {
            this.get(key, value);
          } else if (keyStr.includes("create")) {
            this.post(key, value);
          } else if (keyStr.includes("update")) {
            this.patch(key, value);
          } else {
            this.post(key, value);
          }
        });
    } else if (v.isCrudified) {
      Object.entries(v).filter(([key, val]) => typeof val === "function").forEach(([key, value]) => {
        this[key](key, value);
      });
    }
    else {
      objectEntries(v).filter(([key, val]) => typeof val === "function").forEach(([key, value]) => {
        this.post(key, value);
      });
    }

    return this
  }

  routifyRpc() { }

  // allows you to call multiple methods on the app while using the app object, this allosws for use cases where you may need to access the app object but do not wanna breake method chaining for example 
  /*
   
    const app = new Blazy().addRoute().addRoute().block(console.log)
   
    // without it you will have to break the method chaining to console log at this current point since yeah you could at thend but then it will also have applied methods which you do not wanna observer 
  */




  block<TReturn extends BlazyInstance>(func: (app: this) => TReturn): TReturn {
    return func(this)
  }

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

  http<TPath extends string, Thandler extends (arg: Args extends null ? URecord : Args) => unknown, Args extends URecord | null = null>(v: {
    path: TPath,
    handler: Thandler,
    schema?: Args
  }) {
    return this.addRoute({
      routeMatcher: new DSLRouting(v.path),
      handler: new NormalRouteHandler()
    })
  }


  post<
    TPath extends string,
    TArgs extends URecord | undefined,
    THandlerHooks extends {
      // beforeRequest?: Hooks<[
      //   Hook<
      //     "initial",
      //     (arg: TRouterHooks["beforeRequest"]["TGetLastHookReturnType"]) => TRouterHooks["beforeRequest"]["TGetLastHookReturnType"]
      //   >,
      //   ...(Hook<string,any>)[]
      // ]>
      beforeRequest: (arg: TRouterHooks["beforeRequest"]["TGetLastHookReturnType"]) => unknown
    },
    THandler extends (
      arg:
        (
          TArgs extends undefined
          ? URecord
          : TArgs
        ) & ReturnType<THandlerHooks["beforeRequest"]>
      // &
      // (
      //   THandlerHooks["beforeRequest"] extends undefined
      //   ? {} 
      //   : ReturnType<THandlerHooks["beforeRequest"]>
      // )
    ) => unknown
  >(v: {

    path: TPath,
    handeler: THandler,
    args?: TArgs, // this applies a beforeHandler gaurd hook with passthrough  which makes a mutation of the previous type and the next combining them  and only overwriting properties which it has explicitely defined itself 
    hooks?: THandlerHooks,

  }
  ):

    Blazy<
      TRouterHooks,
      TRoutes & PathStringToObject<TPath, HttpRouteHandler<TArgs, ReturnType<THandler>>>
    > {
    this.addRoute({
      routeMatcher: new NormalRouting(v.path),
      handler: new HttpRouteHandler({}, v => {

      })
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

  fromNormalFunc<
    TFunc extends (arg: { body: URecord }) => unknown,
    TName extends string,
    TMode extends "REST" | "WEBSOCKET_REQUEST_RESPONSE" | "RPC" | "JSON-RPC"
  >(name: TName, func: TFunc, mode: TMode) {
    switch (mode) {
      case "JSON-RPC":

    }
  }

  /*
    json rpc version of routify
  */
  rpcRoutify()

  /*
  exposes a JSON RPC standard abiding the JSON rpc spec input and output, that is different from fromFunction which turns it into REST instead 
  */
  rpcFromFunction() { }


  object<T extends URecord>(obj: T, mode: "")

  /* proppiatary handler aims to achieve a mixture of good performace while still maintaing safety  
   
    comes from blazy rpc 
  */
  brpc() { }

  brpcFromFuncton() {

  }


  brpcRoutify() { }


  applySubRouter<T extends Blazy>(v: Blazy) {

  }


  applySubrouterInline<Treturn extends Blazy>(func: (subRouter: this) => Treturn): this { } // so that we preserve intellisense 

  createSubrouter(): this { // so that we preserve intellisnse however note that you can define a subrouter in different file that way because it will create circular dependnecy 

  }

  static startEmpty() {
    return new Blazy({
      hooks: {
        beforeRequest: Hooks
          .empty()
          .add({
            name: "prvide req",
            handler: v => ({ body: { hi: "" } })
          }),
        afterRequest: Hooks.new()
      },
      routes: {}
    })
  }
}