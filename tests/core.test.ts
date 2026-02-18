import type { URecord } from "@blazyts/better-standard-library";
import { Blazy } from "../src/core";
import { tap } from "../src/hooks";
import z from "zod/v4";
import type { ClientObject } from "../src/client/Client";
import { expectTypeOf } from "bun:test";

function processPaymentUsingStripe(v: { amount: string }) {
    //...
}


test create cleint returns a correctly typed cleint, add this as a comment this is to ensure it coirrecctly passes the generateSignedCookie, note that not using the blazy constructor here but instead the static constructor 

type expected = // todo

const jg = Blazy.create()
    .http({
        path: "/koko/",
        handler: v => v,
        args: z.object({ v: z.string() })
    })
    .post({
        path: "/jiji/koko/",
        handeler: v => v,
        args: z.object({ koko: z.string() })
    }) // for now we should pass as const
    .post({
        path: "/jiji/pllp/",
        handeler: v => v,
        args: z.object({})
    })
    .post({
        path: "/jiji/",
        handeler: v => v,
        args: z.object({})
    }).createClient().createClient()

    expectTypeOf<typeof jg>().toMatchTypeOf<>()

    







function jiji<THandler extends (arg: string) => URecord>(config: { name: string, conf: THandler }) {

}


jiji({ name: "", conf: tap(ctx => { return {} }) })