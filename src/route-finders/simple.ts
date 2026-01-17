import type { RouteTree } from "@blazyts/backend-lib/src/core/server/router/hooks";
import type { URecord } from "@blazyts/better-standard-library";

/**
 * Route context for handlers
 */
export type SimpleRouteContext = {
    path: string;
    method: string;
    body?: URecord;
    query?: URecord;
};

/**
 * Simple route finder that traverses a RouteTree structure.
 * Navigates through the tree structure to find matching handlers.
 */
export class SimpleRouteFinder {


    constructor(

        private handlers: RouteTree
    ) {

    }

    /**
     * Finds and executes a matching handler
     * @param path - Request path
     * @param method - HTTP method
     * @param body - Optional request body
     * @param query - Optional query parameters
     * @returns Response from handler or 404 error
     */
    findRoute(
        path: string,
        method: string,
        body?: URecord,
        query?: URecord
    ) {
        const segments = path.split('/').filter(Boolean);
        const handler = this.traverseTree(this.handlers, segments);

        if (!handler || !('handleRequest' in handler)) {
            return new Response(
                JSON.stringify({
                    error: "Route not found",
                    message: "We couldn't process your request",
                    path,
                    method
                }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        try {
            const result = handler.handleRequest({ body: body || {} });
            return {
                body: result.body,
                status: 200,
                headers: { "Content-Type": "application/json" }
            };
        } catch (error) {
            console.error(`Handler error for ${path}:`, error);
            return {

                error: "Internal error",
                message: "An error occurred while processing your request",
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        }
    }

    /**
     * Traverses the route tree to find a handler
     * @param tree - Current tree node
     * @param segments - Remaining path segments
     */
    private traverseTree(
        tree: RouteTree | any,
        segments: string[]
    ): any {
        if (segments.length === 0) {
            return tree;
        }

        const [current, ...remaining] = segments;

        // Check for exact match
        if (tree[current]) {
            console.log("found match for ", current)
            return this.traverseTree(tree[current], remaining);
        }


        // Check for wildcard matches
        for (const key in tree) {
            if (this.matchesPattern(key, current)) {
                return this.traverseTree(tree[key], remaining);
            }
        }

        return null;
    }

    /**
     * Checks if a pattern matches a segment
     * @param pattern - Pattern string
     * @param segment - Path segment to match
     */
    private matchesPattern(pattern: string, segment: string): boolean {
        if (pattern === segment) {
            return true;
        }

        if (pattern.includes("*")) {
            const regexPattern = pattern.replace(/\*/g, ".*");
            return new RegExp(`^${regexPattern}$`).test(segment);
        }

        return false;
    }
}

