import { describe, it, expect } from "vitest";
import { Client } from "../src/client/Client";

class FakeHandler {
    getClientRepresentation = () => ({ foo: "bar" });
    handleRequest() { }
}

describe("Client", () => {
    it("constructs with routes and has send function", () => {
        const routeTree = { jiji: { "/": new FakeHandler() } } as ;
        const client = new Client(routeTree);
        
        expect(client).toBeInstanceOf(Client);
        expect(client.routes).toBeDefined();
        expect(typeof (client as any).routes.send).toBe("function");
    });
});
