import { describe, it, expect } from "bun:test";
import { app } from "./server";

describe("e2e simple app", () => {
  it("responds to POST /jiji/koko", async () => {
    const port = 3001;
    const server: any = app.listen(port);

    try {
      const client = app.createClient().createClient()("http://localhost:" + port);
      const httpReq = await (await client.routes.jiji.koko["/"]({ koko: "" })).json();
      // expect(httpReq).toMatchObject({v: {body: "fr"}})
      const websocketReq = (await client.routes.rooms["/"].send.join({ name: "" }))
      
      // Wait for message to be processed
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log("Test completed, waiting done");
    } finally {
      try { server.stop?.(); } catch { }
    }
  });
});
