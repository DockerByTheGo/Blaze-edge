import type { IFunc } from "@blazyts/better-standard-library";

import { BasicValidator, map, objectEntries, Try } from "@blazyts/better-standard-library";

type FuncWithOneArg<Arg> = (arg: Arg) => unknown;

type Subscribeable<T extends Record<string, (value: unknown) => any>> = {
  [K in keyof T]: {
    invoke: (v: Parameters<T[K]>) => ReturnType<T[K]>;
    on: (v: Parameters<T[K]>) => void;
  }
};

function createSubscribeable<T extends Record<string, (value: unknown) => any>>(v: T): Subscribeable<T> {
  const result = {} as any;
  for (const key in v) {
    if (Object.prototype.hasOwnProperty.call(v, key)) {
      const handler = v[key]!;
      result[key] = {
        invoke: (args: Parameters<typeof handler>) => handler.apply(null, args),
        on: (args: Parameters<typeof handler>) => handler.apply(null, args),
      };
    }
  }
  return result;
}

class Node {
  constructor(public name: string, public children: Record<string, Node>) {

  }
}

function tokenizeRouter(x: Record<string, unknown>, r: Record<string, Node> = {}): Record<string, Node> {
  objectEntries(x).forEach(([name, value]) => {
    Try(r[name], {
      ifNone: () => {
        r[name] = new Node(name, {});
      },
      ifNotNone: (v) => {
      },
    });
  });
}

function checkEntry(x: string, existingRputes: Node) {
  Try(existingRputes.children[x], {
    ifNone: () => {
      existingRputes.children[x] = new Node(x, {});
    },
    ifNotNone: (v) => {
      checkEntry(x, v);
    },
  });

  return existingRputes;
}

console.log(checkEntry("", new Node("", {})));

const g = 0;

function tokenizeRoute(x: string, existingRputes: Node = new Node("", {})) {
  if (x === "/" || x === "") {
    return existingRputes;
  }
  console.log("k", x);
  map(x.slice(1, x.slice(1, x.length).indexOf("/") + 1), (part) => {
    Try(existingRputes.children[part], {
      ifNone: () => {
        existingRputes.children[part] = new Node(part, {});
        tokenizeRoute(x.slice(x.slice(1, x.length).indexOf("/") + 1, x.length), existingRputes.children[part]);
      },
      ifNotNone: (v) => {
        tokenizeRoute(x.slice(x.slice(1, x.length).indexOf("/") + 1, x.length), existingRputes.children[part]);
      },
    });
  });

  return existingRputes;
}

const k = tokenizeRoute("/api/:v1/users/", new Node("", {}));
const kk = tokenizeRoute("/api/:v1/koko/", k);

console.log(JSON.stringify(kk, null, 2));

function runHookHandler(route: string, definedRoutes: Node): void {

}

export class Blazy extends Extended<{}, {}> {
  constructor(

  ) {
    const cache = new Cache();
    super();
    this.addService("name", cache);
  }

  addService(name: string, v: Record<string, (value: any) => any>) {
    this.hook((v) => {
      return {
        ...v,
        [name]: createSubscribeable(v),
      };
    });
  }

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

  simpleAddRoute<TFunc extends IFunc<any, any, any>>(func: TFunc) {
    return (`/rpc/${func.name}`, (ctx) => {
      validateSchema(ctx.body, func.schema, {
        ifValid: v => new Response(JSON.stringify({ result: func.execute(v) }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
        ifInvalid: err => new Response(JSON.stringify({ error: "Invalid schema", details: err }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      });
    });
  }

  aspnetAddRoute<TFunc extends IFunc<any, any, any>>(v: TFunc) {
    const validator = new BasicValidator(v.argsSchema);
    if (req) {
      if (v.argsSchema?.body) {
        validator.validate(req.body);
      }
      else {
        // if no explicit body is set we assume everything is body
        validator.validate(req);
      }
    }
  }

  fromFunc1<T extends IFunc<string, unknown, unknown, unknown>>(v: T) {

  }

  // replicates asp net sy
  fromFunc2<T>(v: FuncWithOneArg<T>) {

  }

  websocketFromNormalFunc;

  rpcFromNormalFunc;
}

// simple add Routee is if you are already using blazy Functopn functions in your poeect and just want to simply epose them into blazy ts routes
new Blazy().simpleAddRoute(("koko", { a: "" }, "", (arg) => {
  return arg.a;
}));

new Blazy().fromFunc2((arg: { hi: string }) => {
  arg.hi;
});
