import { describe, it, expect } from "vitest";
import type { IRouteHandler } from "@blazyts/backend-lib/src/core/server/router/routeHandler";
import { SimpleRouteFinder } from "../../../../src/route-finders/simple";


class ExampleRouteHandler implements IRouteHandler<{}, unknown> {
    getClientRepresentation: unknown;

    constructor(private message: string) { }

    handleRequest = (arg: {body: unknown}) => {
        return { body: { message: this.message, data: arg.body } };
    };
}

describe("SimpleRouteFinder", () => {

    const routeFinder = new SimpleRouteFinder({
        otherUsers: {
            "bobo-armanev": new ExampleRouteHandler("bobo-armanev")
        },
        users: {
            "1": new ExampleRouteHandler("found user 1"),
            ":id": new ExampleRouteHandler("found user by id")
        }
    });
    it("should find static path ", () => {
        const response = routeFinder.findRoute("/otherUsers/bobo-armanev", "GET", { test: "data" })
        console.log("r", response.body)
        expect(response.status).toBe(200)
        expect(response.body).toStrictEqual({ data: {test: "data"}, message: "bobo-armanev" })
    })

    it("should find a static path and choose it over a dynamic one when both can be matched", () => {

        const response = routeFinder.findRoute("/users/1", "GET", { test: "data" });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("found user 1");
    });

    it("should find a dynamic path", () => {
        const response = routeFinder.findRoute("/users/123", "GET", { test: "data" });

        expect(response.status).toBe(200);
        const body = JSON.parse(response.body as string);
        expect(body.message).toBe("found user by id");
    });
});