import { expect, test } from "bun:test";
import { z } from "zod";

import { MyZodDefinitions } from "../../../src/types/zod/zod.js";
import { zodSchemaIntoOpenapiResponseContentDefinition } from "../../../src/utils/zod-related/parseZodSchema.js";

test("zodSchemaIntoOpenapiResponseContentDefinition basic", () => {
  const expected = {
    h: {
      description: "pipi pupu",
      checks: {},
      properties: {
        e: {
          type: "string",
          description: "a string{\"kind\":\"min\",\"value\":4}",
          checks: {

            min: 4,
          },
          required: true,
        },
      },
      required: true,
      type: MyZodDefinitions.Shapes.Object,
    },
  };

  const result = z.object({
    h: z.object({
      e: z.string().min(4).describe("a string"),
    }).describe("pipi pupu"),
  });

  expect(zodSchemaIntoOpenapiResponseContentDefinition(result)).toMatchObject(expected);
}); // this checks if the general logic is there since there are some edge cases but here we are checking if your general logic is right

test("zodSchemaIntoOpenapiResponseContentDefinition testing if it is working correctly in the presence of an optional", () => {
  const exampleObject = z.object({
    h: z.object({
      e: z.string().min(4).describe("a string").optional(),
      g: z.string().min(4).describe("a string"),
    }),
  });

  const expected = {
    properties: {
      h: {
        type: "object",
        properties: {
          e: {
            type: "string",
            description: "a string{\"kind\":\"min\",\"value\":4}",
            checks: {

              min: 4,
            },
            required: false,
          },
          g: {
            type: "string",
            description: "a string{\"kind\":\"min\",\"value\":4}",
            checks: { min: 4 },
            required: true,
          },
        },
      },
    },
  };

  // logWithoutMethods()
  // logWithoutMethods(exampleObject.shape)
  // logWithoutMethods(exampleObject.shape.h.shape)

  const result = zodSchemaIntoOpenapiResponseContentDefinition(exampleObject);
  expect(result).toMatchObject(expected);
});
