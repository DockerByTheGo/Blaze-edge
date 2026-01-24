import type { URecord } from "@blazyts/better-standard-library";

/**
 * Route tree node structure for efficient route matching
 */
export type RouteTreeNode<THandler = any> = {
    segment: string;
    children: Map<string, RouteTreeNode<THandler>>;
    handlers: THandler[];
    isParameter: boolean;
    paramName?: string;
};

/**
 * Generic context passed to route handlers - protocol agnostic
 */
export type GenericRouteContext<TProtocolData = any> = {
    path: string;
    params: URecord;
    protocol: "http" | "websocket" | "jsonrpc" | "custom";
    data: TProtocolData;
};

/**
 * Complex route finder that uses tree traversal to efficiently match routes.
 * Protocol-agnostic: works for HTTP, WebSocket, JSON-RPC, and custom protocols.
 * Builds a tree structure from route patterns and traverses it to find matching handlers.
 * When reaching a leaf node, tries all associated handlers until one succeeds.
 */
export class ComplexRouteFinder<THandler extends { handle: (ctx: GenericRouteContext) => any | undefined; canHandle?: (ctx: GenericRouteContext) => boolean }> {
    private root: RouteTreeNode<THandler>;

    constructor() {
        this.root = this.createNode("/");
    }

    private createNode(segment: string, isParameter = false, paramName?: string): RouteTreeNode<THandler> {
        return {
            segment,
            children: new Map(),
            handlers: [],
            isParameter,
            paramName,
        };
    }

    /**
     * Adds a route pattern with its handler to the tree
     * @param pattern - Route pattern like "/api/users/:id" or "/posts/:postId/comments"
     * @param handler - Handler to execute when route matches
     */
    addRoute(pattern: string, handler: THandler): void {
        const segments = this.parsePattern(pattern);
        let currentNode = this.root;

        for (const segment of segments) {
            const isParam = segment.startsWith(":");
            const key = isParam ? ":param" : segment;

            if (!currentNode.children.has(key)) {
                const paramName = isParam ? segment.slice(1) : undefined;
                currentNode.children.set(key, this.createNode(segment, isParam, paramName));
            }

            currentNode = currentNode.children.get(key)!;
        }

        currentNode.handlers.push(handler);
    }

    /**
     * Finds a matching route handler by traversing the tree
     * @param path - Request path like "/api/users/123" or "/rpc/getUserById"
     * @param protocol - Protocol type (http, websocket, jsonrpc, custom)
     * @param data - Protocol-specific data (HTTP method & body, WebSocket message, RPC params, etc.)
     * @returns Result from handler or undefined if no match
     */
    findRoute<TProtocolData = any>(path: string, protocol: "http" | "websocket" | "jsonrpc" | "custom", data: TProtocolData): any | undefined {
        const segments = this.parsePattern(path);
        const params: URecord = {};

        const result = this.traverse(this.root, segments, 0, params, protocol, data);

        return result;
    }

    /**
     * Recursively traverses the tree to find matching handlers
     * @param node - Current tree node
     * @param segments - Path segments to match
     * @param index - Current segment index
     * @param params - Extracted route parameters
     * @param protocol - Protocol type
     * @param data - Protocol-specific data
     * @returns Result if handler found, undefined otherwise
     */
    private traverse<TProtocolData>(
        node: RouteTreeNode<THandler>,
        segments: string[],
        index: number,
        params: URecord,
        protocol: "http" | "websocket" | "jsonrpc" | "custom",
        data: TProtocolData
    ): any | undefined {
        // Reached the end of path segments
        if (index === segments.length) {
            return this.tryHandlers(node, { path: segments.join("/"), params, protocol, data });
        }

        const segment = segments[index];

        // Try exact match first
        const exactMatch = node.children.get(segment);
        if (exactMatch) {
            const result = this.traverse(exactMatch, segments, index + 1, params, protocol, data);
            if (result !== undefined) return result;
        }

        // Try parameter match
        const paramMatch = node.children.get(":param");
        if (paramMatch && paramMatch.paramName) {
            const newParams = { ...params, [paramMatch.paramName]: segment };
            const result = this.traverse(paramMatch, segments, index + 1, newParams, protocol, data);
            if (result !== undefined) return result;
        }

        // Try wildcard match
        const wildcardMatch = node.children.get("*");
        if (wildcardMatch) {
            return this.traverse(wildcardMatch, segments, index + 1, params, protocol, data);
        }

        return undefined;
    }

    /**
     * Tries all handlers at a leaf node until one succeeds
     * @param node - Leaf node containing handlers
     * @param ctx - Generic route context
     * @returns Result from successful handler or undefined
     */
    private tryHandlers(node: RouteTreeNode<THandler>, ctx: GenericRouteContext): any | undefined {
        for (const handler of node.handlers) {
            try {
                // Check if handler can handle this request
                if (handler.canHandle && !handler.canHandle(ctx)) {
                    continue;
                }

                const result = handler.handle(ctx);

                // Handler returned undefined, try next one
                if (result === undefined) {
                    continue;
                }

                // Handler succeeded
                return result;
            } catch (error) {
                // Handler threw error, try next one
                console.error(`Handler error for ${ctx.path}:`, error);
                continue;
            }
        }

        return undefined;
    }

    /**
     * Parses a path pattern into segments
     * @param pattern - Path pattern like "/api/users/:id"
     * @returns Array of segments
     */
    private parsePattern(pattern: string): string[] {
        return pattern
            .split("/")
            .filter(segment => segment.length > 0);
    }

    /**
     * Gets all registered routes for debugging
     */
    getRoutes(): string[] {
        const routes: string[] = [];
        this.collectRoutes(this.root, "", routes);
        return routes;
    }

    private collectRoutes(node: RouteTreeNode<THandler>, path: string, routes: string[]): void {
        if (node.handlers.length > 0) {
            routes.push(path || "/");
        }

        for (const [key, child] of node.children) {
            const segment = child.isParameter ? `:${child.paramName}` : key;
            this.collectRoutes(child, `${path}/${segment}`, routes);
        }
    }
}

