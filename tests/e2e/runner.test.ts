import { describe, it, expect } from "bun:test";
import { app } from "./server";

describe("e2e simple app", () => {
  it("responds to POST /jiji/koko and WebSocket /rooms", async () => {
    const port = 3001;
    const server: any = app.listen(port);

    try {
      const client = app
      .beforeRequestHandler("provide user", ctx => ({...ctx, user: ctx.services.auth.getUserId(ctx.token)}))
      .beforeRequestHandler("log", ctx => {
        const recievedAt = Date.now();
        
        ctx.services.logger.saveLog({
          ...ctx.reqData,
          timestamp: recievedAt,
        })
        console.log("gg",ctx) 
        return ctx
      })
        .createClient()
        .createClient()("http://localhost:" + port);
      
      const httpReq = await (await client.routes.jiji.koko["/"].POST({ koko: "" })).json();
      

      
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Test completed");
    } finally {
      try { server.stop?.(); } catch { }
    }
  });
});
