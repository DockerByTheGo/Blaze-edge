import { BlazyConstructor } from "@blazyts/blazy-edge";
import { describe, expect, it } from "bun:test";

import { setupServerHandlers } from "../../src/subapp/setupServerServiceHandlers";

describe("setupServerHandlers", () => {
  it("registers the dynamic service method POST route in app.routes", async () => {
    const app = setupServerHandlers(BlazyConstructor.createProd().addService("cart", {config: {}, getAll: () => ['']}));
    console.log(await app.route({
      reqData: {
        body: {},
        protocol: "POST",
        url: "http://localhost:300/cart/getAll"
      }
    }))

    expect(app.routes[":serviceName"][":methodName"]["/"].POST).toBeDefined();
  });
});
