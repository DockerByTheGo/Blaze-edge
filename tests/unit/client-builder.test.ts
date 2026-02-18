import { describe, it, expect } from "vitest";
import { SimpleRouteHandler } from "../mocks/RouteHandlers";
import { CleintBuilderConstructors } from "../../src/client/client-builder/clientBuilder";
import { Client } from "../../src/client/Client";

describe("ClientBuilder", () => {
    it("fromRouteTree creates builder and createClient returns Client", () => {
        const routeTree = { jiji: { "/": new SimpleRouteHandler() } } as const;
        const builder = CleintBuilderConstructors.fromRouteTree(routeTree);
        builder.createClient()
        const client = builder.createClient()("");
        expect(client).toBeInstanceOf(Client);
        expect(client.routes).toBeDefined();
        expect(typeof (client as any).routes.send).toBe("function");
    });

    it("empty creates builder and createClient returns Client", () => {
        const builder = CleintBuilderConstructors.empty();
        const client = builder.createClient()("");
        expect(client).toBeInstanceOf(Client);
    });
});
