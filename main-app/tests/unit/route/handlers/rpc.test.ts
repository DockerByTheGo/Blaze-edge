import { Path } from "@blazyts/backend-lib/src/core/server";
import { describe, expect, test } from "bun:test";
import { Blazy } from "src";
import { BlazyConstructor } from "src/app/constructors";
describe("RPC routes", () => {
  test("rpcFromFunction registers POST /rpc/{providedName}", () => {
    const receivedArgs: unknown[] = [];
    const rpcFunc: any = {
      name: "internalName",
      argsSchema: {},
      returnTypeSchema: {},
      execute: (args: unknown) => {
        receivedArgs.push(args);
        return { body: { ok: true, kind: "single" } };
      },
    };

    const app = BlazyConstructor.createEmpty().rpcFromFunction("publicRoute", rpcFunc);


    const routeResult = handlerByPath.POST.handleRequest({ body: { a: 1 } });
    expect(receivedArgs).toEqual([{ a: 1 }]);
    expect(routeResult).toEqual({ body: { ok: true, kind: "single" } });

    const client = app.createClient().createClient()("http://localhost:3000");
    expect(client.routes.rpc.publicRoute["/"].POST.method).toBe("post");
    expect(client.routes.rpc.publicRoute["/"].POST.path).toBe("/rpc/publicRoute");
  });

  test("rpcRoutify registers multiple RPC functions", () => {
    const calls: string[] = [];
    const addUserFunc: any = {
      name: "ignoredByRouteBuilder",
      argsSchema: {},
      returnTypeSchema: {},
      execute: () => {
        calls.push("addUser");
        return { body: { ok: true, name: "addUser" } };
      },
    };
    const deleteUserFunc: any = {
      name: "ignoredByRouteBuilder2",
      argsSchema: {},
      returnTypeSchema: {},
      execute: () => {
        calls.push("deleteUser");
        return { body: { ok: true, name: "deleteUser" } };
      },
    };
    let isCustomRouteCalled = false;
    const app = Blazy
    .createProd()
    .rpcRoutify({
      addUser: addUserFunc,
      deleteUser: deleteUserFunc,
    })
    .rpc({name: "customRoute", handler: () => { isCustomRouteCalled = true }})


    const client = app.createClient().createClient()("http://localhost:3000");
    client.routes.rpc.customRoute["/"].POST({})

    const addUserHandler = treeRouteFinder(app.routes, new Path("/rpc/addUser"))
      .expect("Route /rpc/addUser should exist")
      .valueOf() as any;
    const deleteUserHandler = treeRouteFinder(app.routes, new Path("/rpc/deleteUser"))
      .expect("Route /rpc/deleteUser should exist")
      .valueOf() as any;

    expect(addUserHandler.POST.handleRequest({ body: {} })).toEqual({
      body: { ok: true, name: "addUser" },
    });
    expect(deleteUserHandler.POST.handleRequest({ body: {} })).toEqual({
      body: { ok: true, name: "deleteUser" },
    });
    expect(calls).toEqual(["addUser", "deleteUser"]);
    expect(isCustomRouteCalled).toBe(false);
  });
});
