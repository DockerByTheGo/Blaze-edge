import { describe, expect } from "bun:test";
import { DSLRouting } from "../../../../main-app/src/route-matchers/dsl/main";

describe("should match", () => {
    const r = new DSLRouting("/posts/:id$/")
    expect(r.match("/posts/3").isSome()).toBe(true)
})