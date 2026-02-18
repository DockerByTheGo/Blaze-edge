import { describe, it, expect } from "vitest";
import { Client } from "../src/client/Client";
import type { RouteTree } from "@blazyts/backend-lib";
import { SimpleRouteHandler } from "./mocks/RouteHandlers";

describe("Client", () => {
    it("constructs with routes and has send function", () => {
        const routeTree = { jiji: { "/": new SimpleRouteHandler() } } as const;
        const client = new Client(routeTree);
            client.routes.jiji["/"]
        expect(client).toBeInstanceOf(Client);  
        expect(client.routes).toBeDefined();
        expect(typeof (client as any).routes.send).toBe("function");
    });
});
