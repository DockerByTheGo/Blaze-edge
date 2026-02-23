import { describe, it, expect } from "bun:test";
import { Blazy } from "../../src/core";
import { Message } from "../../src/route-handlers/variations/websocket/types";
import z from "zod/v4";

describe("WebSocket handler test", () => {
  it("should call the handler function when message is received", async () => {
    let handlerCalled = false;
    let receivedData: any = null;

    // Create app with WebSocket route
    const app = Blazy.create().websocket({
      path: "/test",
      messages: {
        messagesItCanRecieve: {
          ping: new Message(
            z.object({ message: z.string() }),
            (data) => {
              console.log("=== HANDLER CALLED ===");
              console.log("Received data:", data);
              handlerCalled = true;
              receivedData = data;
            }
          ),
        },
        messagesItCanSend: {
          pong: new Message(
            z.object({ response: z.string() }),
            (v) => v.data.response
          ),
        },
      },
    });

    const port = 3002;
    const server: any = app.listen(port);

    try {
      // Create WebSocket client manually
      const ws = new WebSocket(`ws://localhost:${port}/test`);

      // Wait for connection to open
      await new Promise((resolve) => {
        ws.addEventListener("open", resolve, { once: true });
      });

      console.log("WebSocket connected, sending message...");

      // Send message
      ws.send(
        JSON.stringify({
          type: "ping",
          body: { message: "hello" },
          path: "/test",
        })
      );

      // Wait for message to be processed
      await new Promise((resolve) => setTimeout(resolve, 200));

      console.log("Handler called?", handlerCalled);
      console.log("Received data?", receivedData);

      // Verify handler was called
      expect(handlerCalled).toBe(true);
      expect(receivedData).toBeDefined();
      expect(receivedData.data.message).toBe("hello");

      ws.close();
    } finally {
      try {
        server.stop?.();
      } catch {}
    }
  });
});
