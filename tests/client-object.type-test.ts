import type { ClientObject } from "../src/client/Client";
import type { IRouteHandler } from "@blazyts/backend-lib";

// Minimal fake handler type for compile-time shape checking
declare class FakeHandler implements IRouteHandler<any, any> {
  getClientRepresentation(): { foo: string };
  handleRequest(arg: any): any;
}

type RouteTreeShape = {
  jiji: {
    "/": FakeHandler;
  };
  nested: {
    sub: {
      "/": FakeHandler;
    };
  };
};

type Expected = {
  jiji: {
    "/": ReturnType<FakeHandler["getClientRepresentation"]>;
  };
  nested: {
    sub: {
      "/": ReturnType<FakeHandler["getClientRepresentation"]>;
    };
  };
};

// Type-level equality helpers
type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

// Actual mapped client object type
type Actual = ClientObject<RouteTreeShape>;

// Assert they are identical; this will fail the TypeScript compile if mismatched
type _clientObject_type_test = Assert<Equals<Actual, Expected>>;
