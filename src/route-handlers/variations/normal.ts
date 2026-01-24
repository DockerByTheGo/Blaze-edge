import type { IRouteHandler } from "@blazyts/backend-lib/src/core/server/router/routeHandler";
import type { URecord } from "@blazyts/better-standard-library";




function withStaticNew<T extends new (...args: any[]) => any>(Class: T) {
  return class extends (Class as any) {
    static new(...args: ConstructorParameters<T>) {
      return new (this as any)(...args);
    }
  } as T & {
    new(...args: ConstructorParameters<T>): InstanceType<T>;
    new: (...args: ConstructorParameters<T>) => InstanceType<T>;
  };
}


export class HttpRouteHandler<
  TCtx extends { body: URecord, method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH" },
  TReturn extends { body: URecord } | Response,
> implements IRouteHandler<
  TCtx,
  TReturn
> {
  constructor(
    public readonly TCtxMetadata: TCtx,
    private readonly handleRequest: (arg: TCtx) => TReturn,
  ) { }

  getClientRepresentation = () => ({
    method: this.TCtxMetadata.method,
    path: "/api/route",
  });

  public handle(v: TCtx): TReturn | undefined {
    if (v.method !== this.TCtxMetadata.method) {
      return undefined;
    }
    return this.handleRequest(v);
  }

  public canHandle(method: string): boolean {
    return method === this.TCtxMetadata.method;
  }

}



// // Example usage of the decorator
export const EnhancedNormalRouteHandler = withStaticNew(HttpRouteHandler);

// // Now you can use the static new method
const handler = EnhancedNormalRouteHandler.new((req) => ({ body: { result: "success" } }));
