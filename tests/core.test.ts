import type { URecord } from "@blazyts/better-standard-library";
import { Blazy } from "../src/core";
import { tap } from "../src/hooks";
import z from "zod/v4";

function processPaymentUsingStripe(v: { amount: string }) {
    //...
}


new Blazy()
    .post({
        path: "/jiji",
        handeler: v => v,
        args: z.object({ koko: z.string() })
    }) // for now we should pass as const
    
    




    



function jiji<THandler extends (arg: string) => URecord>(config: { name: string, conf: THandler }) {

}


jiji({ name: "", conf: tap(ctx => { return {} }) })