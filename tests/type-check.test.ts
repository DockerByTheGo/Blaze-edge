import { describe, it, expect, expectTypeOf } from "bun:test";
import { Blazy } from "../src/core";
import z from "zod/v4";
import { Message } from "../src/route-handlers/variations/websocket/types";

describe("Type checking test", () => {
  it("should have correct types for protocol-based routes", () => {
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

    // Type checks - these should compile without errors
    type ClientType = typeof client;
    
    // Check that routes exist at type level
    type HasApi = ClientType["routes"]["api"];
    type HasUsers = ClientType["routes"]["api"]["users"];
    type HasSlash = ClientType["routes"]["api"]["users"]["/"];
    type HasPOST = ClientType["routes"]["api"]["users"]["/"]["POST"];
    
    type HasChat = ClientType["routes"]["chat"];
    type HasChatSlash = ClientType["routes"]["chat"]["/"];
    type HasWs = ClientType["routes"]["chat"]["/"]["ws"];

    // Runtime checks
    expect(client.routes.api).toBeDefined();
    expect(client.routes.api.users).toBeDefined();
    expect(client.routes.api.users["/"]).toBeDefined();
    expect(client.routes.api.users["/"].POST).toBeDefined();
    
    expect(client.routes.chat).toBeDefined();
    expect(client.routes.chat["/"]).toBeDefined();
    expect(client.routes.chat["/"].ws).toBeDefined();
    
    console.log("✓ All type checks passed");
  });
});
