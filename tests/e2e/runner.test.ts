import { describe, it, expect } from "bun:test";
import { app } from "./server";
import { LoggerService } from "@src/pluings/logger/LoggerService";
import { ConsoleLogSaver } from "@src/pluings/logger/savers/ConsoleLogSaver";
import { tap } from "@src/hooks";
import { AuthService } from "@src/pluings/auth";

describe("e2e simple app", () => {
  it("responds to POST /jiji/koko and WebSocket /rooms", async () => {
    const port = 3001;
    const server: any = app.listen(port);

    try {
      const client = app
      .beforeRequestHandler("provide user", ctx => ({...ctx, user: ctx.services.auth.getUserId(ctx.token)}))
      .beforeRequestHandler("log", ctx => {
        ctx.services.logger.logFromClientHandler(ctx.reqData)
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
