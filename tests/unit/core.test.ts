import type { URecord } from "@blazyts/better-standard-library";
import { Blazy } from "../../src/core";
import { tap } from "../../src/hooks";
import z from "zod/v4";
import type { ClientObject } from "../../src/client/Client";
import { expectTypeOf, test } from "bun:test";
import { app } from "../mocks/App/SimpleApp.mock";

test("create client returns a correctly typed client", () => {

    type ExpectedRouteTree = {
        koko: { "/": unknown };
        jiji: {
            koko: { "/": unknown };
            pllp: { "/": unknown };
            "/": unknown;
        };
    };

    const client = (app.createClient().createClient())

    type Expected = ClientObject<ExpectedRouteTree>;

    expectTypeOf<typeof client>().toMatchTypeOf<Expected>();
});
