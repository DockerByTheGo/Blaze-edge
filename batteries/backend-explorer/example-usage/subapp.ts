import { BlazyConstructor } from "@blazyts/blazy-edge";
import { backendUiMiddleware } from "../src/variations/subapp";

const cartService = {
    config: {},
    getAll: () => ["cart 1", "cart 2", "cart 3"]
};

const res = await BlazyConstructor
.createProd()
.block(v => {
    return v 
})
.addService("cartService", cartService)
.block(a => {
    return a
})
.block(backendUiMiddleware)
.get({
    path: "/hi",
    handler: ctx => ctx.services.cartService.getAll(),
    args: undefined
})
.listen(3223)
