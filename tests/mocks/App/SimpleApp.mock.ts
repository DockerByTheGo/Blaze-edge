import z from "zod/v4";
import { Blazy } from "../../../src/core";

export const app = Blazy
    .create()
    // .http({
    //     path: "/koko",
    //     handler: v => v,
    //     args: z.object({ v: z.string() })
    // })
    .post({
        path: "/jiji/koko",
        handeler: v => {
            return "fr"
        },
        args: z.object({ koko: z.string() })
    })
    // .post({
    //     path: "/jiji/pllp",
    //     handeler: v => v,
    //     args: z.object({})
    // })
    .post({
        path: "/jiji",
        handeler: v => v,
        args: z.object({ v: z.string() })
    })