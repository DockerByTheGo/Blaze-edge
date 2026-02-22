
import { z } from "zod";
import { RequestResponseWebsocketHandler } from "../../../src/route-handlers";
import { sleep } from "bun";

describe("RequestResponseWebsocketHandler", () => {
    it("should handle a valid request-response cycle", async () => {
        const handler = new RequestResponseWebsocketHandler(
            {
                body: z.object({ name: z.string() }),
                response: z.object({ greeting: z.string() }),
            },
            async (data) => {
                return { greeting: `Hello, ${data.name}` };
            }
        );

        const bunWs = handler.getBunWebsocketHandler();
        const ws = {
            send: jest.fn(),
            close: jest.fn(),
        } as any;

        bunWs.open(ws);
        await bunWs.message(ws, JSON.stringify({ name: "World" }));

        expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ greeting: "Hello, World" }));
    });

    it("should close the connection after a timeout", async () => {
        const handler = new RequestResponseWebsocketHandler(
            {
                body: z.object({ name: z.string() }),
                response: z.object({ greeting: z.string() }),
            },
            async (data) => {
                return { greeting: `Hello, ${data.name}` };
            },
            { timeout: 100 }
        );

        const bunWs = handler.getBunWebsocketHandler();
        const ws = {
            send: jest.fn(),
            close: jest.fn(),
        } as any;

        bunWs.open(ws);
        await bunWs.message(ws, JSON.stringify({ name: "World" }));
        
        await sleep(200);

        expect(ws.close).toHaveBeenCalled();
    });

    it("should reset the timeout on a new request", async () => {
        const handler = new RequestResponseWebsocketHandler(
            {
                body: z.object({ name: z.string() }),
                response: z.object({ greeting: z.string() }),
            },
            async (data) => {
                return { greeting: `Hello, ${data.name}` };
            },
            { timeout: 200 }
        );

        const bunWs = handler.getBunWebsocketHandler();
        const ws = {
            send: jest.fn(),
            close: jest.fn(),
        } as any;

        bunWs.open(ws);
        await bunWs.message(ws, JSON.stringify({ name: "World" }));

        await sleep(100);

        await bunWs.message(ws, JSON.stringify({ name: "Again" }));

        await sleep(100);

        expect(ws.close).not.toHaveBeenCalled();

        await sleep(200);

        expect(ws.close).toHaveBeenCalled();

    });

    it("should handle invalid requests", async () => {
        const handler = new RequestResponseWebsocketHandler(
            {
                body: z.object({ name: z.string() }),
                response: z.object({ greeting: z.string() }),
            },
            async (data) => {
                return { greeting: `Hello, ${data.name}` };
            }
        );
        
        const bunWs = handler.getBunWebsocketHandler();
        const ws = {
            send: jest.fn(),
            close: jest.fn(),
        } as any;

        bunWs.open(ws);
        await bunWs.message(ws, JSON.stringify({ invalid: "data" }));

        expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ error: "Invalid request or handler error" }));
        expect(ws.close).toHaveBeenCalled();

    })
});
