import type { RouteFinder } from "@blazyts/backend-lib/src/core/server/router/Router";
import type { IRouteHandler, Request } from "@blazyts/backend-lib/src/core/server/router/routeHandler/types";
import type { RouteTree } from "@blazyts/backend-lib/src/core/server/router/types";
import type { Path } from "@blazyts/backend-lib/src/core/server/router/utils/path/Path";
import { Optionable } from "@blazyts/better-standard-library";

/**
 * Checks if a route segment is dynamic (starts with ':')
 */
const isDynamic = (segment: string): boolean => segment.startsWith(":");

/**
 * Checks if a value is a route handler
 */
const isRouteHandler = (value: any): value is IRouteHandler<Request, any> => {
    return value && typeof value === "object" && "handleRequest" in value;
};

/**
 * Tree-based route finder that:
 * 1. Traverses the route tree structure
 * 2. Distinguishes between static and dynamic routes
 * 3. Prefers static (hardcoded) routes over dynamic routes when both exist
 * 4. Handlers are stored under "/" key instead of directly in the node
 * 
 * Example structure:
 * {
 *   users: {
 *     "/": usersListHandler,        // Handler for /users
 *     admin: adminHandler,           // Handler for /users/admin
 *     ":id": {
 *       "/": userByIdHandler,        // Handler for /users/:id
 *       posts: userPostsHandler      // Handler for /users/:id/posts
 *     }
 *   }
 * }
 */
export const treeRouteFinder: RouteFinder<RouteTree> = (routesTree, path) => {
    console.log(routesTree)
    const pathParts = path.parts.map(part => part.part);

    /**
     * Recursively traverse the route tree
     * @param currentNode - Current node in the route tree
     * @param remainingParts - Remaining path segments to match
     * @returns The route handler if found, or null
     */
    const traverse = (
        currentNode: RouteTree,
        remainingParts: string[]
    ): Optionable<IRouteHandler<Request, any>> => {
        // If no more parts to match, check if current node has a "/" handler
        if (remainingParts.length === 0) {
            const rootHandler = currentNode["/"];
            if (rootHandler && isRouteHandler(rootHandler)) {
                return Optionable.some(rootHandler);
            }
            return Optionable.none();
        }

        const [currentPart, ...restParts] = remainingParts;

        // Try static (hardcoded) route first
        if (currentPart && currentNode[currentPart]) {
            const staticResult = traverse(currentNode[currentPart] as RouteTree, restParts);
            if (staticResult.isSome()) {
                return staticResult;
            }
        }

        // If no static match found, try dynamic routes
        const dynamicSegments = Object.keys(currentNode).filter(isDynamic);

        for (const dynamicSegment of dynamicSegments) {
            const dynamicResult = traverse(currentNode[dynamicSegment] as RouteTree, restParts);
            if (dynamicResult.isSome()) {
                return dynamicResult;
            }
        }

        // No match found
        return Optionable.none();
    };

    return traverse(routesTree, pathParts);
};
