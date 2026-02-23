import { describe, it, expect } from "bun:test";
import { Blazy } from "../src/core";
import { Message } from "../src/route-handlers/variations/ws/types";
import z from "zod/v4";

describe("Route structure test", () => {
  it("should organize routes by protocol", () => {
    const app = Blazy.create()
      .post({
        path: "/api/users",
        handeler: () => "created",
        args: z.object({ name: z.string() }),
      })
      .ws({
        path: "/chat",
        messages: {
          messagesItCanRecieve: {
            message: new Message(z.object({ text: z.string() }), () => {}),
          },
          messagesItCanSend: {
            response: new Message(z.object({ text: z.string() }), (v) => v.data.text),
          },
        },
      });

    console.log("Routes structure:");
    console.log(JSON.stringify(app.routes, null, 2));

    // Check POST route structure
    expect(app.routes.api).toBeDefined();
    expect(app.routes.api.users).toBeDefined();
    expect(app.routes.api.users["/"]).toBeDefined();
    expect(app.routes.api.users["/"].POST).toBeDefined();
    console.log("POST handler found at: /api/users -> / -> POST");

    // Check WS route structure
    expect(app.routes.chat).toBeDefined();
    expect(app.routes.chat["/"]).toBeDefined();
    expect(app.routes.chat["/"].ws).toBeDefined();
    console.log("WS handler found at: /chat -> / -> ws");
  });
});
