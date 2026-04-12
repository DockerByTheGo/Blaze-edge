import { BlazyConstructor } from "@blazyts/blazy-edge";
import { backendUi } from "../src/subapp";

const cartService = {
    config: {},
    getAll: () => ["cart 1", "cart 2", "cart 3"]
};

const res = await BlazyConstructor
.createProd()
.block(v => {
    console.log(v.routes)
    return v 
})
.addService("cartService", cartService)
.block(a => {
    console.log("ser", a.services)
    return a
})
.block(backendUi)
.get({
    path: "/hi",
    handler: ctx => ctx.services.cartService.getAll(),
    args: undefined
})
.listen(3223)

console.log(res.body)