import type { URecord } from "@blazyts/better-standard-library";
import { Blazy } from "../src/core";
import { add } from "../src/hooks/helpers/add";

function processPaymentUsingStripe(v: { amount: string }) {
    //...
}

class User {
    public get name() {
        return ""
    }
}

class UserRepo {
    getUser(userId: string) {
        return new User()
    }
}


const derviveUser = (r: { haeders: string }) => add(r, { user: new User() })

const h = Blazy
.startEmpty()
    // .post({
    //     path: "/jiji",
    //     handeler: v => v,
    //     args: { koko: "" },
    //     hooks: {
    //         beforeRequest: [derviveUser]
    //     }
    // }) // for now we should pass as const
    .post({
        path:  "/koko/:koko",
        hooks: {
            beforeRequest: v => ({lplp: ""})
        },
        args: {
            body: {ko: ""}
        },
        k: {lplp: ""},
        handeler:v =>{v.body.ko} 
    })
    .onRequest({name: "koko", handler: v => ({hi: ""})})
    .onRequest({name: "koko", handler: v => {
        v.body.hi
    }})

    // .file("./kiki")
    // .fromNormalFunc("callMe", v => processPaymentUsingStripe(v.body))
    // .block(app => app
    //     .post()
    //     .post()
    // )
    // .beforeHandler({
    //     "name": "jo",
    //     handler: v => ({ ko: "" } as const)
    // })
    // .beforeHandler({
    //     "name": "lolo",
    //     handler: tap(ctx => ({ ctx: "" }))
    // })



// function jiji<THandler extends (arg: string) => URecord>(config: { name: string, conf: THandler }) {

// }


// jiji({ name: "", conf: tap(ctx => { return {} }) })