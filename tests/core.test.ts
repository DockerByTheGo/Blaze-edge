import type { URecord } from "@blazyts/better-standard-library";
import { Blazy } from "../src/core";
import { tap } from "../src/hooks";
import z from "zod/v4";
import type { ClientObject } from "../src/client/Client";
import { expectTypeOf, test } from "bun:test";

test("create client returns a correctly typed client", () => {
    const client = Blazy.create()
        .http({
            path: "/koko",
            handler: v => v,
            args: z.object({ v: z.string() })
        })
        .post({
            path: "/jiji/koko",
            handeler: v => v,
            args: z.object({ koko: z.string() })
        })
        .post({
            path: "/jiji/pllp",
            handeler: v => v,
            args: z.object({})
        })
        .post({
            path: "/jiji",
            handeler: v => v,
            args: z.object({})
        })
        .createClient().createClient();

    type ExpectedRouteTree = {
        koko: { "/": unknown };
        jiji: {
            koko: { "/": unknown };
            pllp: { "/": unknown };
            "/": unknown;
        };
    };

    type Expected = ClientObject<ExpectedRouteTree>;

    expectTypeOf<typeof client>().toMatchTypeOf<Expected>();
});


function jiji<THandler extends (arg: string) => URecord>(config: { name: string, conf: THandler }) { }

jiji({ name: "", conf: tap(ctx => { return {} }) });
