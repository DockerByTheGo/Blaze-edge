import type { URecord } from "@blazyts/better-standard-library";

import type { IRouteHandler } from "../types";



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


export class NormalRouteHandler<
  TCtx extends { body: URecord },
  TReturn extends { body: URecord },
> implements IRouteHandler<
  TCtx,
  TReturn
> {
  constructor(
    public handleRequest: (arg: TCtx) => TReturn,
  ) {

  }

  getClientRepresentation = () => ({
    method: "POST",
    path: "/api/route",
  });
}



// // Example usage of the decorator
export const EnhancedNormalRouteHandler = withStaticNew(NormalRouteHandler);

// // Now you can use the static new method
const handler = EnhancedNormalRouteHandler.new((req) => ({ body: { result: "success" } }));
