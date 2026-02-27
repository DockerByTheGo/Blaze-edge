import type { IRouteHandler } from "@blazyts/backend-lib";
import type { IRouteHandlerMetadata } from "@blazyts/backend-lib/src/core/server";
import type { URecord } from "@blazyts/better-standard-library";
import { fetch } from "bun";




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

type NormalRouteHandlerClientRepresentation<TCtx, TReturn> = (meta: IRouteHandlerMetadata) => (v: TCtx) => Promise<{ json(): Promise<TReturn> }>


export class NormalRouteHandler<
  TCtx extends { body: URecord },
  TReturn extends { body: URecord },
> implements IRouteHandler<
  TCtx,
  TReturn
> {
  constructor(
    public handleRequest: (arg: TCtx) => TReturn,
    public metadata: { subRoute: string, method: "POST" }
  ) {

  }

  getClientRepresentation: NormalRouteHandlerClientRepresentation<TCtx, TReturn> = (meta) => {
    const metadata: IRouteHandlerMetadata = {
      ...this.metadata,
      ...meta
    };

    const clientFn = async (v: TCtx) => {
      return await fetch(metadata.serverUrl, {
        method: metadata.verb,
        body: JSON.stringify(v),
      });
    };

    Object.assign(clientFn, {
      method: metadata.verb?.toLowerCase(),
      path: meta.path ?? this.metadata.subRoute,
      metadata,
    });

    return clientFn;
  }
}



// // Example usage of the decorator
export const EnhancedNormalRouteHandler = withStaticNew(NormalRouteHandler);
