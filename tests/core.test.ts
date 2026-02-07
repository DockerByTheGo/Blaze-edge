import type { URecord } from "@blazyts/better-standard-library";
import { Blazy } from "../src/core";
import { tap } from "../src/hooks";

function processPaymentUsingStripe(v: {amount: string}){
    //...
}


new Blazy().post({
    path: "/jiji",
    handeler: v => v,
    args:{koko: ""}}
) // for now we should pass as const
.applySubrouterInline(
    v => v
    .addRoute()
    .addRoute()
    .addRoute()
)
.file("./kiki")
.fromNormalFunc("callMe", v => processPaymentUsingStripe(v.body))
.block(app => app.addRoute())
.beforeRequest({
    "name": "jo",
    handler: v => ({ko: ""} as const )
})
.beforeRequest({
    "name": "lolo",
    handler: tap(ctx => ({ctx: ""}))
})



function jiji<THandler extends (arg: string) => URecord>(config: {name: string, conf: THandler }){

}


jiji({name: "", conf: tap(ctx => {return {}})})