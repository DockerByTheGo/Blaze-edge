import { describe, it, expect } from "bun:test";
import { app } from "./server";
import { LoggerService } from "@src/pluings/logger/LoggerService";
import { ConsoleLogSaver } from "@src/pluings/logger/savers/ConsoleLogSaver";

describe("e2e simple app", () => {
  it("responds to POST /jiji/koko and WebSocket /rooms", async () => {
    const port = 3001;
    const server: any = app.listen(port);

    try {
      const client = app
      .beforeRequestHandler("attach", ctx => ({...ctx, services: {}})) 
      .beforeRequestHandler("koko", ctx => ({...ctx, services: new LoggerService(new ConsoleLogSaver())}))
      .beforeRequestHandler("log", ctx => {
        ctx.services.logRequest(ctx)
        
        
        return ctx})
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
