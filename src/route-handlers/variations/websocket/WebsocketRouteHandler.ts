import type { KeyOfOnlyStringKeys, URecord } from "@blazyts/better-standard-library";
import type { IRouteHandler } from "@blazyts/backend-lib/src/core/server/router/routeHandler";
import z from "zod/v4";
import { password, type WebSocket } from "bun";

export type WebSocketMessage = {
    type: string;
    data: URecord;
    connectionId: string;
};

export type WebSocketResponse = {
    type: string;
    data: URecord;
    targetConnectionIds?: string[]; // If not specified, broadcast to all connections
};

export type WebSocketConnection = {
    id: string;
    send: (message: WebSocketResponse) => void;
    close: () => void;
    isAlive: boolean;
};

export type WebSocketContext = {
    connections: Map<string, WebSocketConnection>;
    broadcast: (message: WebSocketResponse) => void;
    sendTo: (connectionId: string, message: WebSocketResponse) => void;
};

export class Message<TSchema extends z.ZodObject> {

    constructor(
        public readonly schema: TSchema,
        public readonly handler: (ctx: { data: z.infer<TSchema>, ws: WebSocket }) => void
    ) { }
}

export type Schema = {
    messagesItCanSend: Record<string, Message<z.ZodObject>>,
    messagesItCanRecieve: Record<string, Message<z.ZodObject>>
}



export type WeboscketRouteCleintRepresentation<TServerMessagesSchema extends Schema> = {
    handle: {
        [Message in KeyOfOnlyStringKeys<TServerMessagesSchema["messagesItCanSend"]>]: (func: TServerMessagesSchema["messagesItCanSend"][Message]["handler"]) => void
    },
    send: {
        [Message in KeyOfOnlyStringKeys<TServerMessagesSchema["messagesItCanRecieve"]>]: (Parameters<TServerMessagesSchema["messagesItCanRecieve"][Message]["handler"]>[0])["data"]
    }
}

export class WebsocketRouteHandler<
    TMessagesSchema extends Schema,
> implements IRouteHandler<TMessagesSchema, any> {

    private connections = new Map<string, WebSocketConnection>();
    private heartbeatInterval?: Timer;

    constructor(
        public readonly schema: TMessagesSchema
    ) {
        this.startHeartbeat();
    }

    handleRequest(message: TMessage): TResponse {
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

        if (this.handlers.onMessage) {
            const response = this.handlers.onMessage(message, connection, context);
            if (response) {
                return response;
            }
        }

        // Default response if no handler provided
        return {
            type: "ack",
            data: { received: message.type }
        } as TResponse;
    }

    // WebSocket lifecycle methods
    handleConnection(ws: WebSocket, request: Request): WebSocketConnection {
        const connectionId = this.generateConnectionId();
        let pingTimeout: Timer;

        const connection: WebSocketConnection = {
            id: connectionId,
            send: (message: WebSocketResponse) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(message));
                }
            },
            close: () => {
                ws.close();
            },
            isAlive: true
        };

        this.connections.set(connectionId, connection);

        const context: WebSocketContext = {
            connections: this.connections,
            broadcast: (response: WebSocketResponse) => {
                for (const conn of this.connections.values()) {
                    if (conn.isAlive) {
                        conn.send(response);
                    }
                }
            },
            sendTo: (targetConnectionId: string, response: WebSocketResponse) => {
                const targetConnection = this.connections.get(targetConnectionId);
                if (targetConnection && targetConnection.isAlive) {
                    targetConnection.send(response);
                }
            }
        };

        ws.onopen = () => {
            if (this.handlers.onConnect) {
                this.handlers.onConnect(connection, context);
            }
        };

        ws.onmessage = (event) => {
            try {
                const message: TMessage = {
                    ...JSON.parse(event.data as string),
                    connectionId
                } as TMessage;

                if (this.handlers.onMessage) {
                    const response = this.handlers.onMessage(message, connection, context);
                    if (response) {
                        connection.send(response);
                    }
                }
            } catch (error) {
                if (this.handlers.onError) {
                    this.handlers.onError(error as Error, connection, context);
                }
            }
        };

        ws.onclose = () => {
            connection.isAlive = false;
            this.connections.delete(connectionId);
            clearTimeout(pingTimeout);

            if (this.handlers.onDisconnect) {
                this.handlers.onDisconnect(connection, context);
            }
        };

        ws.onerror = (error) => {
            if (this.handlers.onError) {
                this.handlers.onError(new Error('WebSocket error'), connection, context);
            }
        };

        // Heartbeat mechanism
        const heartbeat = () => {
            if (!connection.isAlive) return;

            ws.ping();
            pingTimeout = setTimeout(() => {
                connection.isAlive = false;
                ws.close();
            }, 30000); // 30 seconds timeout
        };

        ws.onpong = () => {
            clearTimeout(pingTimeout);
        };

        // Start heartbeat
        heartbeat();
        const interval = setInterval(heartbeat, 25000); // Ping every 25 seconds

        // Clean up interval on close
        ws.addEventListener('close', () => {
            clearInterval(interval);
        });

        return connection;
    }

    getClientRepresentation: (metadata) => (ctx) => WeboscketRouteCleintRepresentation<TMessagesSchema> = (metadata) => {
        return {
            type: "websocket",
            protocol: "ws",
            supports: {
                heartbeat: true,
                reconnection: true,
                messageTypes: ["connect", "message", "disconnect", "error"]
            }
        };
    }

    private generateConnectionId(): string {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private startHeartbeat() {
        // Global heartbeat cleanup for dead connections
        this.heartbeatInterval = setInterval(() => {
            for (const [id, connection] of this.connections) {
                if (!connection.isAlive) {
                    this.connections.delete(id);
                }
            }
        }, 60000); // Clean up every minute
    }

    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Close all connections
        for (const connection of this.connections.values()) {
            connection.close();
        }

        this.connections.clear();
    }
}

// for example we have a logins channel where each time a new user enters we check his creds to join the actual user into the game and then send back a re2 to all connected players that a new player has joined
const cl = new WebsocketRouteHandler({
    messagesItCanRecieve: {
        new: new Message(z.object({ name: z.string(), password: z.string() }), v => {
            function save(v: any) {

            }

            save(v.data)
        })
    },
    messagesItCanSend: {
        joined: new Message(z.object({ name: z.string() }), v => v.data)
    }
}).getClientRepresentation({})({})
cl.handle.joined(v => v.data)
cl.send.new({data: {name: ""}})