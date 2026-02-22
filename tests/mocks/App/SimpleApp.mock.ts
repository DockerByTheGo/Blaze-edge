import z, { string } from "zod/v4";
import { Blazy } from "../../../src/core";
import { Message } from "../../../src/route-handlers/variations/websocket/types";

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
    .websocket({
        path: "/rooms",
        messages: {
            messagesItCanRecieve: {
                join: new Message(z.object({ name: z.string() }), v => console.log("recieved message", v))
            },
            messagesItCanSend: {
                joined: new Message(z.object({ name: z.string() }), v => v.data.name)
            }

        }
    })