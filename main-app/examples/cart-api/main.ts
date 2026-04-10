import { BlazyConstructor } from "src/app/constructors";
import { addServices } from "src/middlewares/addServicesUi";


const cartService = {
    config: {},
    getAll: () => ["cart 1", "cart 2", "cart 3"]
};

const app = BlazyConstructor
.createProd()

await app
.addService("cartService", cartService)
.beforeRequestHandler("add services", ctx => {
    return {...ctx, services: {...app.services.services, manager: app.services}}
})
.block(app => {
    return addServices(app)
})
.beforeRequestHandler("log", ctx => console.log(ctx))
.get({
    path: "/hi",
    handler: ctx => ctx.services.cartService.getAll(),
    args: undefined
});

console.log(app.route({
    reqData: {
        "url": "http://localhost:3000/cart/getAll",
        protocol: "GET"
    }
}));
