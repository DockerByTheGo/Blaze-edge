import type { IRouteHandler, RouteTree } from "@blazyts/backend-lib"

export type Routes<R extends RouteTree> = {
    send<Route extends keyof R>(route: Route): R[Route] extends IRouteHandler<any, any> ? R[Route]["getClientRepresentation"] : Routes<R[Route]>
}

export type ClientObject<T extends RouteTree> = {
    [CurrentRoute in keyof T]: T[CurrentRoute] extends IRouteHandler<any, any>
    ? T[CurrentRoute]["getClientRepresentation"]
    : ClientObject<T[CurrentRoute]>
}

export class ClientConstructors {

    empty() {
        return new Client({})
    }

    fromRoutes<TRouteTree extends RouteTree>(routes: TRouteTree) {
        return new Client(routes)
    }

}

export class Client<TRouteTree extends RouteTree> {

    public readonly routes: Routes<TRouteTree>

    public constructor(routes: TRouteTree) {

        this.routes = {
            send<Route extends keyof TRouteTree>(route: Route): TRouteTree[Route] extends IRouteHandler<any, any>
                ? TRouteTree[Route]["getClientRepresentation"]
                : "" {
                // In a real client, this method would construct and send an HTTP request
                // based on the `TRouteTree[Route]["getLCientRepresentation"]` definition
                // and return a Promise of the response.
                // For this example, we just return the client representation definition itself.
                // A more complete implementation would involve a network call.
                return

            }

        }

    }

    batch(v: Routes<RouteTree>) {

    } // send multiple requests as one to avoid multiple hadnshakes, you recieve all th responses from it in one connection


    /* 
    
    Sends the schema it has recieved against the server to see if they are matching, just a type quard, to inform the cleint, also note that this should be removed in prod to not ,ake enumeration attacks easier 
    
    probably needs to be inside blazy edge 
    */
    confirmSchema() {

    }


}