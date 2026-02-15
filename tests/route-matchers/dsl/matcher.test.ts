import { describe, expect } from "bun:test";
import { DSLRouting } from "../../../src/route-matchers/dsl/main";

describe("should match", () => {
    const r = new DSLRouting("/posts/:id$/")
    const j = r.match("/posts/3")
    expect(r.match("/posts/3").isSome()).toBe(true)
})