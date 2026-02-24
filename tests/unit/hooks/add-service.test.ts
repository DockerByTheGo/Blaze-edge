import { describe, expect, it } from "bun:test";
import { Blazy } from "../../../src/core";
import { ConsoleLogSaver, LoggerService } from "@src/pluings/logger";

class ExampleService {
  public readonly tag = "example";
  public greet(): string {
    return "hello";
  }
}

describe("addService hook", () => {
  it("makes the new service available through the app context", () => {

    const service = new ExampleService();

       const app = Blazy.create()

    expect(app.ctx.services).toBe(app.services);
    expect(app.services.getService<ExampleService>("example")).toBe(service);
    expect(app.ctx.services.getService<ExampleService>("example")).toBe(service);
  });
});
