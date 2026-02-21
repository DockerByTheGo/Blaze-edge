import { WebsocketRouteHandler } from "../../../src/route-handlers/variations/websocket/WebsocketRouteHandler";
import z from "zod/v4";
import { describe, it, expect, expectTypeOf } from "bun:test";
import { Message } from "../../../src/route-handlers/variations/websocket/types";

describe("WebsocketRouteHandler (bun)", () => {
    const newMEssageSchema = z.object({ name: z.string(), password: z.string() })
    const joinedSchema = z.object({ name: z.string() })
    const handler = new WebsocketRouteHandler({
        messagesItCanRecieve: {
            new: new Message(
                newMEssageSchema,
                v => ({ new: "" })
            )
        },
        messagesItCanSend: {
            joined: new Message(
                joinedSchema,
                v => v.data
            )
        }
    });

    const client = handler.getClientRepresentation({ serverUrl: "http://localhost:3000" });

    it("exposes getClientRepresentation and send/handle proxies", async () => {


        const expectedHndle = {
            joined: (arg) => { }
        }

        const expectedSend = {
            new: (arg) => { }
        }

        expect(client.handle).toBe(expectedHndle);
        expect(client.send).toBe(expectedSend);
    });

    it("exposes a correctly typed cleint", () => {
        type expectedType = {
                handle: {
                    joined: Message<typeof joinedSchema>
                },
                send: {
                    new: Message<typeof newMEssageSchema>
                }
            }
        expectTypeOf(client).toMatchObjectType<expectedType>()
    })
});
