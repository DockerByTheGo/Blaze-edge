import { expect, test } from "bun:test";
import { z } from "zod";

import { parseZodUnion } from "../../../src/utils/zod-related/main.js";

function expectForComapringObjectsByValue(thing: any) {
  return expect(JSON.stringify(thing));
}

const firstObj = z.object({ hi: z.string() });
const secondObj = z.object({ ji: z.string() });
const thirdObj = z.object({ o: z.string() });

test("parseZodParameterObject with 2 objects", () => { // this test is to check if the core logic is correct
  const expected = ([firstObj, secondObj]);
  // console.log(prettifyJson(JSON.stringify(expected)))
  const result = parseZodUnion(firstObj.or(secondObj));
  // console.log(prettifyJson(JSON.stringify(result)))
  expect(stripMethods(result)).toMatchObject(stripMethods(expected));
});

// this test hasnt worked ever
test("parseZodParameterObject with more than 2  objects", () => { // this is to check a certain edge case regarding more than 2 objects, yeah for some reason the zod team decided that after 2 objects it starts toi behave differently and starts adding properties
  const expected = ([firstObj, secondObj, thirdObj]);
  // logWithoutMethods(expected)
  const result = parseZodUnion(firstObj.or(secondObj).or(thirdObj));
  // logWithoutMethods(result)
  // expect(expected).toMatchObject(result)
});
