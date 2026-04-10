import { BlazyConstructor } from "src/app/constructors";
import { addServices } from "src/middlewares/addServicesUi";


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
.block(app => addServices(app))
.get({
    path: "/hi",
    handler: ctx => ctx.services.cartService.getAll(),
    args: undefined
})
.route({
    reqData: {
        "url": "http://localhost:3000/cartService/getAll",
        protocol: "POST",
        
    }
})


console.log(await res.v.body)