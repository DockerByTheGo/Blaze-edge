import { describe, expectTypeOf, it } from "vitest";

import type { Optionable } from "@blazyts/better-standard-library/src/data_structures/functional-patterns/option/main";

import type { ExtractParams } from "../../../src/route-matchers/dsl/types/extractParams";

describe("ExtractParams type tests", () => {
    describe("static routes (no parameters)", () => {
        it("extracts empty object for static route", () => {
            type Result = ExtractParams<"/users/">;
            expectTypeOf<Result>().toEqualTypeOf<{}>();
        });

        it("extracts empty object for nested static route", () => {
            type Result = ExtractParams<"/api/users/list/">;
            expectTypeOf<Result>().toEqualTypeOf<{}>();
        });
    });

    describe("single parameter routes", () => {
        it("extracts single string parameter", () => {
            type Result = ExtractParams<"/users/:id/">;
            expectTypeOf<Result>().toEqualTypeOf<{ id: string }>();
        });

        it("extracts single number parameter ($ suffix)", () => {
            type Result = ExtractParams<"/users/:id$/">;
            expectTypeOf<Result>().toEqualTypeOf<{ id: number }>();
        });

        it("extracts single date parameter (( suffix)", () => {
            type Result = ExtractParams<"/events/:date(/">;
            expectTypeOf<Result>().toEqualTypeOf<{ date: Date }>();
        });

        it("extracts single boolean parameter (^ suffix)", () => {
            type Result = ExtractParams<"/flags/:enabled^/">;
            expectTypeOf<Result>().toEqualTypeOf<{ enabled: boolean }>();
        });
    });

    describe("optional parameters", () => {
        it("extracts optional string parameter (? prefix)", () => {
            type Result = ExtractParams<"/users/:?id/">;
            expectTypeOf<Result>().toEqualTypeOf<{ id: Optionable<string> }>();
        });

        it("extracts optional number parameter", () => {
            type Result = ExtractParams<"/users/:?id$/">;
            expectTypeOf<Result>().toEqualTypeOf<{ id: Optionable<number> }>();
        });

        it("extracts optional date parameter", () => {
            type Result = ExtractParams<"/events/:?date(/">;
            expectTypeOf<Result>().toEqualTypeOf<{ date: Optionable<Date> }>();
        });

        it("extracts optional boolean parameter", () => {
            type Result = ExtractParams<"/flags/:?enabled^/">;
            expectTypeOf<Result>().toEqualTypeOf<{ enabled: Optionable<boolean> }>();
        });
    });

    describe("multiple parameter routes", () => {
        it("extracts two string parameters", () => {
            type Result = ExtractParams<"/users/:userId/posts/:postId/">;
            expectTypeOf<Result>().toEqualTypeOf<{ userId: string; postId: string }>();
        });

        it("extracts mixed type parameters", () => {
            type Result = ExtractParams<"/users/:userId$/posts/:postId/">;
            expectTypeOf<Result>().toEqualTypeOf<{ userId: number; postId: string }>();
        });

        it("extracts three parameters with different types", () => {
            type Result = ExtractParams<"/api/:version$/users/:id/active/:active^/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                version: number;
                id: string;
                active: boolean
            }>();
        });

        it("extracts parameters with dates", () => {
            type Result = ExtractParams<"/events/:eventId/date/:date(/">;
            expectTypeOf<Result>().toEqualTypeOf<{ eventId: string; date: Date }>();
        });
    });

    describe("mixed static and dynamic routes", () => {
        it("extracts parameter with static prefix", () => {
            type Result = ExtractParams<"/api/users/:id/">;
            expectTypeOf<Result>().toEqualTypeOf<{ id: string }>();
        });

        it("extracts parameters with static segments in between", () => {
            type Result = ExtractParams<"/api/:version$/users/:userId/posts/:postId$/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                version: number;
                userId: string;
                postId: number
            }>();
        });

        it("extracts parameter with static suffix", () => {
            type Result = ExtractParams<"/users/:id/profile/">;
            expectTypeOf<Result>().toEqualTypeOf<{ id: string }>();
        });
    });

    describe("optional parameters in mixed routes", () => {
        it("extracts optional parameter with required parameter", () => {
            type Result = ExtractParams<"/users/:id/:?role/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                id: string;
                role: Optionable<string>
            }>();
        });

        it("extracts multiple optional parameters", () => {
            type Result = ExtractParams<"/users/:?id/:?name/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                id: Optionable<string>;
                name: Optionable<string>
            }>();
        });

        it("extracts optional and required mixed with types", () => {
            type Result = ExtractParams<"/api/:version$/users/:?id$/posts/:postId/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                version: number;
                id: Optionable<number>;
                postId: string
            }>();
        });
    });

    describe("complex routes", () => {
        it("extracts from deeply nested route", () => {
            type Result = ExtractParams<"/api/:version$/users/:userId$/posts/:postId$/comments/:commentId/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                version: number;
                userId: number;
                postId: number;
                commentId: string
            }>();
        });

        it("extracts all parameter types in one route", () => {
            type Result = ExtractParams<"/data/:str/:num$/:date(/:bool^/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                str: string;
                num: number;
                date: Date;
                bool: boolean
            }>();
        });

        it("extracts optional parameters of all types", () => {
            type Result = ExtractParams<"/data/:?str/:?num$/:?date(/:?bool^/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                str: Optionable<string>;
                num: Optionable<number>;
                date: Optionable<Date>;
                bool: Optionable<boolean>
            }>();
        });

        it("extracts mixed required and optional with all types", () => {
            type Result = ExtractParams<"/api/:version$/users/:id/:?role/settings/:?active^/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                version: number;
                id: string;
                role: Optionable<string>;
                active: Optionable<boolean>
            }>();
        });
    });

    describe("edge cases", () => {
        it("handles parameter with special characters removed", () => {
            type Result = ExtractParams<"/users/:user-id/">;
            expectTypeOf<Result>().toEqualTypeOf<{ userid: string }>();
        });

        it("handles optional parameter with special characters", () => {
            type Result = ExtractParams<"/users/:?user-id$/">;
            expectTypeOf<Result>().toEqualTypeOf<{ userid: Optionable<number> }>();
        });

        it("handles route ending with parameter", () => {
            type Result = ExtractParams<"/api/users/:id$/">;
            expectTypeOf<Result>().toEqualTypeOf<{ id: number }>();
        });

        it("handles single segment with parameter", () => {
            type Result = ExtractParams<"/:id/">;
            expectTypeOf<Result>().toEqualTypeOf<{ id: string }>();
        });

        it("handles multiple segments ending with static", () => {
            type Result = ExtractParams<"/users/:id/edit/">;
            expectTypeOf<Result>().toEqualTypeOf<{ id: string }>();
        });
    });

    describe("real-world API route examples", () => {
        it("extracts REST API route for resource by ID", () => {
            type Result = ExtractParams<"/api/v1/users/:userId$/">;
            expectTypeOf<Result>().toEqualTypeOf<{ userId: number }>();
        });

        it("extracts nested REST resource route", () => {
            type Result = ExtractParams<"/api/v1/users/:userId$/posts/:postId$/comments/:commentId$/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                userId: number;
                postId: number;
                commentId: number
            }>();
        });

        it("extracts date range API route", () => {
            type Result = ExtractParams<"/api/events/:startDate(/:endDate(/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                startDate: Date;
                endDate: Date
            }>();
        });

        it("extracts filtering route with boolean flags", () => {
            type Result = ExtractParams<"/api/users/:?active^/:?verified^/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                active: Optionable<boolean>;
                verified: Optionable<boolean>
            }>();
        });

        it("extracts search route with optional filters", () => {
            type Result = ExtractParams<"/api/search/:query/:?page$/:?limit$/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                query: string;
                page: Optionable<number>;
                limit: Optionable<number>
            }>();
        });

        it("extracts user profile route", () => {
            type Result = ExtractParams<"/users/:username/profile/:section/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                username: string;
                section: string
            }>();
        });

        it("extracts multi-tenant route", () => {
            type Result = ExtractParams<"/tenants/:tenantId$/apps/:appId$/config/:configKey/">;
            expectTypeOf<Result>().toEqualTypeOf<{
                tenantId: number;
                appId: number;
                configKey: string
            }>();
        });
    });
});
