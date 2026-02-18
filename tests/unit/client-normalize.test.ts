import { Blazy } from "../src/core";
import { CleintBuilderConstructors } from "../src/client/client-builder/clientBuilder";
import { describe, it, expect } from "vitest";
import type { IRouteHandler, RouteTree } from "@blazyts/backend-lib";
import { Client, type ClientObject } from "../src/client/Client";

// Minimal fake handler to simulate an IRouteHandler with a getClientRepresentation
class FakeHandler implements IRouteHandler<{}, {}> {
    public getClientRepresentation =  (v: any) => v  as const;
    handleRequest: (arg: any) => any;
}

describe("Client builder normalization", () => {
    it("should expose jiji when route tree has { jiji: { '/': handler } }", () => {
        // construct a minimal route tree with a '/' entry under jiji
        const routeTree = {
            jiji: {
                "/": new FakeHandler(),
            },
        } satisfies RouteTree;

        return new Client(routeTree).routes

        const cleint: ClientObject<typeof routeTree>

        // runtime check: client.routes.jiji should be the handler representation
        // For our FakeHandler the runtime representation is the plain object stored in getClientRepresentation
        expect((client as any).routes.jiji).toBe((routeTree as any).jiji["/"].getClientRepresentation);
    });
});
