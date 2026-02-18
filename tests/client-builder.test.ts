import { describe, it, expect } from "vitest";
import { CleintBuilderConstructors } from "../src/client/client-builder/clientBuilder";
import { Client } from "../src/client/Client";

describe("ClientBuilder", () => {
    it("fromRouteTree creates builder and createClient returns Client", () => {
        const fakeRoute = {} as any;
        const builder = CleintBuilderConstructors.fromRouteTree(fakeRoute);
        const client = builder.createClient();
        expect(client).toBeInstanceOf(Client);
        expect(client.routes).toBeDefined();
        expect(typeof (client as any).routes.send).toBe("function");
    });

    it("empty creates builder and createClient returns Client", () => {
        const builder = CleintBuilderConstructors.empty();
        const client = builder.createClient();
        expect(client).toBeInstanceOf(Client);
    });
});
