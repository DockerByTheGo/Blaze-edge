import { describe, it, expect } from "bun:test";
import { add } from "main-app/src/hooks/add";


describe("add function", () => {
  it("should merge two objects", () => {
    const existing = { a: 1, b: 2 };
    const toAdd = { c: 3, d: 4 };
    const result = add(existing, toAdd);

    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });

  it("should overwrite existing keys", () => {
    const existing = { a: 1, b: 2 };
    const toAdd = { b: 999, c: 3 };
    const result = add(existing, toAdd);

    expect(result()).toEqual({ a: 1, b: 999, c: 3 });
  });

  it("should handle empty objects", () => {
    const existing = {};
    const toAdd = { a: 1 };
    const result = add(existing, toAdd);

    expect(result).toEqual({ a: 1 });
  });

  it("should handle empty toAdd", () => {
    const existing = { a: 1 };
    const toAdd = {};
    const result = add(existing, toAdd);

    expect(result).toEqual({ a: 1 });
  });

  it("should handle both empty", () => {
    const existing = {};
    const toAdd = {};
    const result = add(existing, toAdd);

    expect(result).toEqual({});
  });

  it("should work with nested objects", () => {
    const existing = { a: { x: 1 }, b: 2 };
    const toAdd = { c: { y: 3 } };
    const result = add(existing, toAdd);

    expect(result).toEqual({
      a: { x: 1 },
      b: 2,
      c: { y: 3 },
    });
  });

  it("should work with mixed value types", () => {
    const existing = { a: 1, b: "hello", c: true, d: null };
    const toAdd = { e: [1, 2, 3], f: { nested: true } };
    const result = add(existing, toAdd);

    expect(result()).toEqual({
      a: 1,
      b: "hello",
      c: true,
      d: null,
      e: [1, 2, 3],
      f: { nested: true },
    });
  });

  it("should preserve property order", () => {
    const existing = { z: 1, y: 2 };
    const toAdd = { x: 3, w: 4 };
    const result = add(existing, toAdd);

    const keys = Object.keys(result);
    expect(keys).toEqual(["z", "y", "x", "w"]);
  });
});
