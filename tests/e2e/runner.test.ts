import { describe, it, expect } from "bun:test";
import { app } from "./server";

describe("e2e simple app", () => {
  it("responds to POST /jiji/koko and WebSocket /rooms", async () => {
    const port = 3001;
    const server: any = app.listen(port);

    try {
      const client = app.createClient().createClient()("http://localhost:" + port);
      
      // Test HTTP POST endpoint with new protocol structure
      const httpReq = await (await client.routes.jiji.koko["/"].POST({ koko: "" })).json();
      
      // Test WebSocket endpoint with new protocol structure
      await client.routes.rooms["/"].ws.send.join({ name: "test-user" });
      
      // Wait for message to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Test completed");
    } finally {
      try { server.stop?.(); } catch { }
    }
  });
});
