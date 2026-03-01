// Type tests for the add function
// These tests verify that TypeScript correctly infers the merged types
import { expectType } from "bun:test";

function add<TExisting, TNew>(ctx: TExisting, thingToAdd: TNew): TExisting & TNew {
  return {
    ...ctx,
    ...thingToAdd,
  };
}

// Test 1: Basic merge
const result1 = add({ a: 1, b: 2 }, { c: 3 });
expectType<{ a: number; b: number; c: number }>(result1);

// Test 2: Type merging with different types
const result2 = add(
  { a: 1, b: "hello" },
  { c: true, d: [1, 2, 3] }
);
expectType<{ a: number; b: string; c: boolean; d: number[] }>(result2);

// Test 3: Overwriting keys (second argument wins)
const result3 = add({ a: 1, b: 2 }, { b: "overwritten" });

expectType<{ a: number; b: string }>(result3);

// Test 4: Empty first argument
const result4 = add({}, { x: 10, y: 20 });
expectType<{ x: number; y: number }>(result4);

// Test 5: Empty second argument
const result5 = add({ a: 1, b: 2 }, {});
expectType<{ a: number; b: number }>(result5);

// Test 6: Complex nested types
const result6 = add(
  { data: { id: 1, name: "test" }, count: 5 },
  { metadata: { created: new Date(), tags: ["a", "b"] } }
);
expectType<{
  data: { id: number; name: string };
  count: number;
  metadata: { created: Date; tags: string[] };
}>(result6);

// Test 7: Generic type parameter preservation
function testGeneric<T extends { x: number }, U extends { y: string }>(
  obj1: T,
  obj2: U
) {
  const result = add(obj1, obj2);
  expectType<T & U>(result);
  return result;
}

const testGenericResult = testGeneric({ x: 1 }, { y: "hello" });
expectType<{ x: number; y: string }>(testGenericResult);

console.log("✅ All type tests passed!");
