import type { IRouteHandler, RouteTree } from "@blazyts/backend-lib"
import type { KeyOfOnlyStringKeys } from "@blazyts/better-standard-library"

// Normalize a route-tree node: if the node contains a '/' key, treat that as
// the handler for the current path. Otherwise recurse.
type NormalizeRouteTreeNode<T> =
    T extends IRouteHandler<any, any> ? T["getClientRepresentation"] :
    (
        "/" extends keyof T ? (
            T["/"] extends IRouteHandler<any, any> ? T["/"]["getClientRepresentation"] : NormalizeRouteTreeNode<T["/"]>
        ) : {
            [K in KeyOfOnlyStringKeys<T>]: NormalizeRouteTreeNode<T[K]>
        }
    )

export type Routes<R extends RouteTree> = {
    send<Route extends KeyOfOnlyStringKeys<R>>(route: Route): NormalizeRouteTreeNode<R[Route]>
}

export type ClientObject<T extends RouteTree> = {
    [CurrentRoute in KeyOfOnlyStringKeys<T>]: NormalizeRouteTreeNode<T[CurrentRoute]>
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


    public readonly routes: ClientObject<TRouteTree>

    public constructor(routes: TRouteTree) {

        const build = (node: any): any => {
            if (node && typeof node === "object") {
                // If node has a '/' key treat it as the handler for this path
                if (Object.prototype.hasOwnProperty.call(node, "/")) {
                    const candidate = node["/"];
                    if (candidate && typeof candidate.getClientRepresentation === "function") {
                        return candidate.getClientRepresentation;
                    }
                    return build(candidate);
                }

                const out: any = {};
                for (const k of Object.keys(node)) {
                    out[k] = build(node[k]);
                }
                return out;
            }
            return undefined;
        }

        // Assign normalized routes to `this.routes`
        this.routes = build(routes) as ClientObject<TRouteTree>;

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