import type { IRouteHandler } from "@blazyts/backend-lib";
import type { IRouteHandlerMetadata } from "@blazyts/backend-lib/src/core/server";
import {
    type WebSocketMessage,
    type WebSocketResponse,
    type WebSocketConnection,
    type WebSocketContext,
    type Schema,
    type WeboscketRouteCleintRepresentation,
    Message
} from "./types";
import { getWebsocketConnection } from "./WebsocketConnectionSingleton";


export class WebsocketRouteHandler<
    TMessagesSchema extends Schema,
> implements IRouteHandler<WebSocketMessage, WebSocketResponse> {

    private connections = new Map<string, WebSocketConnection>();
    private handlers: {
        onConnect?: (conn: WebSocketConnection, ctx: WebSocketContext) => void;
        onMessage?: (msg: WebSocketMessage, conn: WebSocketConnection, ctx: WebSocketContext) => void;
        onDisconnect?: (conn: WebSocketConnection, ctx: WebSocketContext) => void;
        onError?: (error: Error, conn: WebSocketConnection, ctx: WebSocketContext) => void;
    } = {};

    constructor(
        public readonly schema: TMessagesSchema,
        public metadata: IRouteHandlerMetadata
    ) {
    }

    handleRequest(message: WebSocketMessage): WebSocketResponse {
        const connection = this.connections.get(message.connectionId);
        if (!connection) {
            throw new Error(`Connection ${message.connectionId} not found`);
        }

        const context: WebSocketContext = {
            connections: this.connections,
            broadcast: (response: WebSocketResponse) => {
                for (const conn of this.connections.values()) {
                    if (conn.isAlive) {
                        conn.send(response);
                    }
                }
            },
            sendTo: (connectionId: string, response: WebSocketResponse) => {
                const targetConnection = this.connections.get(connectionId);
                if (targetConnection && targetConnection.isAlive) {
                    targetConnection.send(response);
                }
            }
        };

        const messageHandler = this.schema.messagesItCanRecieve[message.type];
        if (messageHandler) {
            try {
                const parsed = messageHandler.schema.parse(message.data);
                messageHandler.handler({ data: parsed, ws: undefined as any });
            } catch (error) {
                if (this.handlers.onError) {
                    this.handlers.onError(error as Error, connection, context);
                }
            }
        }

        if (this.handlers.onMessage) {
            this.handlers.onMessage(message, connection, context);
        }

        // Default response if no handler provided
        return {
            type: "ack",
            data: { received: message.type }
        };
    }


    getClientRepresentation = (metadata: IRouteHandlerMetadata): WeboscketRouteCleintRepresentation<TMessagesSchema> => {

        const wsUrl = metadata.serverUrl.replace(/^http/, "ws");

        let ws = getWebsocketConnection(wsUrl);

        const send = {}
        Object
            .entries(this.schema.messagesItCanRecieve)
            .forEach(([messageName, message], i) => {
                send[messageName] = (data) => {
                    let res = message.schema.parse(data)
                    console.log("f", res)
                    const dataToSend: WebSocketMessage & {} = { body: res, path: this.metadata.subRoute, type: messageName }
                    const ddd = JSON.stringify(dataToSend)
                    console.log("sendig to websocket", ddd)
                    ws.send(ddd)
                    console.log("g")
                }
            })

        const handle = {}
        Object
            .entries(this.schema.messagesItCanSend)
            .forEach(
                ([messageName, message], i) => {
                    handle[messageName] = (callback: (data) => void) => {
                        const res = message.schema.parse()
                        getWebsocketConnection

                    }
                }
            )


        return {
            handle,
            send
        };
    }

}
