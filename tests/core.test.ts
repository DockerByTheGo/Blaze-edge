import type { URecord } from "@blazyts/better-standard-library";
import { Blazy } from "../src/core";
import { tap } from "../src/hooks";
import { add } from "../src/hooks/add";

function processPaymentUsingStripe(v: {amount: string}){
    //...
}

class User {
    public get name(){
        return ""
    }
}

class UserRepo {
    getUser(userId: string) {
        return new User()
    }
}


const derviveUser = (r: {haeders: string}) => add(r, {user: new User()})

new Blazy()
.post({
    path: "/jiji",
    handeler: v => v,
    args:{koko: ""},
    hooks: {
        beforeRequest: [derviveUser]
    }
}) // for now we should pass as const
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