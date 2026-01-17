import type { IRouteHandler } from "@blazyts/backend-lib/src/core/server/router/routeHandler";
import { SimpleRouteFinder } from "../../../../src/route-finders/simple";


class ExampleRouteHandler implements IRouteHandler<{}, unknown>{
    getClientRepresentation: unknown;
    constructor( private message: string){

    }
    handleRequest = (arg) => console.log(this.message,arg)
}



console.log(new SimpleRouteFinder({
    "users": {
        ":id": new ExampleRouteHandler("deleting user with id ")
    }
}).findRoute("users/1"))