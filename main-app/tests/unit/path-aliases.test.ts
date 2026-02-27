import { describe, expect, it } from "bun:test";
import { Blazy } from "main-app/src/core";
import { aliasFixture } from "@test/helpers/aliasFixture";
import { app } from "@test/mocks/App/SimpleApp.mock";

describe("path aliases", () => {
  it("resolves @src and @test in blazy-edge", () => {
    expect(Blazy.create()).toBeInstanceOf(Blazy);
    expect(aliasFixture).toBe("blazy-edge-alias-ok");
    expect(app).toBeDefined();
  });
});
