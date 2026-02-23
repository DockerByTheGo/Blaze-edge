import { describe, it, expect } from "bun:test";
import { Blazy } from "../src/core";
import { Message } from "../src/route-handlers/variations/ws/types";
import z from "zod/v4";

describe("Client structure test", () => {
  it("should organize client routes by protocol", () => {
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

    const client = app.createClient().createClient()("http://localhost:3000");

    console.log("Client routes structure:");
    console.log("client.routes.api:", Object.keys(client.routes.api));
    console.log("client.routes.api.users:", Object.keys(client.routes.api.users));
    console.log("client.routes.api.users['/']:", Object.keys(client.routes.api.users["/"]));
    
    console.log("\nclient.routes.chat:", Object.keys(client.routes.chat));
    console.log("client.routes.chat['/']:", Object.keys(client.routes.chat["/"]));

    // Check POST route structure in client
    expect(client.routes.api).toBeDefined();
    expect(client.routes.api.users).toBeDefined();
    expect(client.routes.api.users["/"]).toBeDefined();
    expect(client.routes.api.users["/"].POST).toBeDefined();
    console.log("\n✓ POST handler accessible at: client.routes.api.users['/'].POST");

    // Check WS route structure in client
    expect(client.routes.chat).toBeDefined();
    expect(client.routes.chat["/"]).toBeDefined();
    expect(client.routes.chat["/"].ws).toBeDefined();
    expect(client.routes.chat["/"].ws.send).toBeDefined();
    console.log("✓ WS handler accessible at: client.routes.chat['/'].ws");
    console.log("✓ WS send methods:", Object.keys(client.routes.chat["/"].ws.send));
  });
});
