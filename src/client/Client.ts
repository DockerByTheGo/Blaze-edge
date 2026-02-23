import type { IRouteHandler, RouteTree } from "@blazyts/backend-lib"
import type { KeyOfOnlyStringKeys } from "@blazyts/better-standard-library"

export type Routes<R extends RouteTree> = {
    send<Route extends KeyOfOnlyStringKeys<R>>(route: Route): R[Route] extends IRouteHandler<any, any>
        ? R[Route]["getClientRepresentation"]
        : Routes<R[Route]>
}

export type ClientObject<T extends RouteTree> = {
    [CurrentRoute in KeyOfOnlyStringKeys<T>]: 
        // If this is the "/" key, it contains protocol handlers
        CurrentRoute extends "/" 
            ? {
                [Protocol in KeyOfOnlyStringKeys<T[CurrentRoute]>]: 
                    T[CurrentRoute][Protocol] extends IRouteHandler<any, any>
                        ? ReturnType<T[CurrentRoute][Protocol]["getClientRepresentation"]>
                        : never
              }
            // Otherwise, recurse into nested routes
            : T[CurrentRoute] extends IRouteHandler<any, any>
                ? ReturnType<T[CurrentRoute]["getClientRepresentation"]>
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

    public readonly routes: ClientObject<TRouteTree>

    public constructor(public readonly routeTree: TRouteTree, public readonly url: string) {
        const build = (tree: any, path: string = "") => {
            const out: any = {};
            for (const key of Object.keys(tree ?? {})) {
                const node = tree[key];
                
                // Check if this is the "/" key with protocol handlers
                if (key === "/") {
                    // This is a route endpoint with protocol handlers
                    const protocolHandlers: any = {};
                    for (const protocol of Object.keys(node)) {
                        const handler = node[protocol] as IRouteHandler<any, any>;
                        if (handler && typeof handler.getClientRepresentation === "function") {
                            protocolHandlers[protocol] = handler.getClientRepresentation({
                                serverUrl: this.url + handler.metadata.subRoute,
                                path: path,
                                ...handler.metadata
                            });
                        }
                    }
                    out[key] = protocolHandlers;
                } else {
                    // This is a path segment, recurse
                    const currentPath = path ? `${path}/${key}` : `/${key}`;
                    out[key] = build(node ?? {}, currentPath);
                }
            }
            return out;
        };

        this.routes = build(this.routeTree) as unknown as ClientObject<TRouteTree>;
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