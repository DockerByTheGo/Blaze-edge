import type { KeyOfOnlyStringKeys, URecord } from "@blazyts/better-standard-library";
import type { IRouteHandler } from "@blazyts/backend-lib";
import z from "zod/v4";
import { password, type WebSocket } from "bun";
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


export class WebsocketRouteHandler<
    TMessagesSchema extends Schema,
> implements IRouteHandler<WebSocketMessage, WebSocketResponse> {

    public metadata: unknown;
    private connections = new Map<string, WebSocketConnection>();
    private heartbeatInterval?: Timer;
    private handlers: {
        onConnect?: (conn: WebSocketConnection, ctx: WebSocketContext) => void;
        onMessage?: (msg: WebSocketMessage, conn: WebSocketConnection, ctx: WebSocketContext) => void;
        onDisconnect?: (conn: WebSocketConnection, ctx: WebSocketContext) => void;
        onError?: (error: Error, conn: WebSocketConnection, ctx: WebSocketContext) => void;
    } = {};

    constructor(
        public readonly schema: TMessagesSchema
    ) {
        this.startHeartbeat();
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
                const message: WebSocketMessage = {
                    ...JSON.parse(event.data as string),
                    connectionId
                };

                if (this.handlers.onMessage) {
                    this.handlers.onMessage(message, connection, context);
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

    getClientRepresentation = (metadata: IRouteHandlerMetadata): WeboscketRouteCleintRepresentation<TMessagesSchema> => {

        const wsUrl = metadata.serverUrl.replace(/^http/, "ws");

        let ws: WebSocket | null = null;
        let connected = false;
        const messageHandlers = new Map<string, Function>();
        const pendingMessages: WebSocketResponse[] = [];

        const ensureConnection = (): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (connected && ws) {
                    resolve();
                    return;
                }

                try {
                    ws = new WebSocket(wsUrl);

                    ws.onopen = () => {
                        connected = true;
                        // Send any pending messages
                        while (pendingMessages.length > 0) {
                            const msg = pendingMessages.shift();
                            if (msg && ws) {
                                ws.send(JSON.stringify(msg));
                            }
                        }
                        resolve();
                    };

                    ws.onerror = () => {
                        connected = false;
                        reject(new Error("WebSocket connection failed"));
                    };

                    ws.onmessage = (event) => {
                        try {
                            const message = JSON.parse(event.data as string);
                            const handler = messageHandlers.get(message.type);
                            if (handler) {
                                handler(message.data);
                            }
                        } catch (error) {
                            console.error("Failed to parse WebSocket message", error);
                        }
                    };

                    ws.onclose = () => {
                        connected = false;
                    };
                } catch (error) {
                    reject(error);
                }
            });
        };

        return {
            handle: new Proxy({}, {
                get: (target, messageType: string) => (callback: Function) => {
                    messageHandlers.set(messageType as string, callback);
                }
            }) as any,
            send: new Proxy({}, {
                get: (target, messageType: string) => async (data: any) => {
                    const handler = this.schema.messagesItCanRecieve[messageType as string];
                    if (!handler) {
                        throw new Error(`Message type "${messageType}" not found in schema`);
                    }

                    try {
                        handler.schema.parse(data);
                        await ensureConnection();

                        const message: WebSocketMessage = {
                            type: messageType as string,
                            data,
                            connectionId: ""
                        };

                        if (ws && connected) {
                            ws.send(JSON.stringify(message));
                        } else {
                            pendingMessages.push(message as any);
                        }
                        return true;
                    } catch (error) {
                        console.error(`Validation failed for message "${messageType}"`, error);
                        return false;
                    }
                }
            }) as any
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

// Example usage
const handler = new WebsocketRouteHandler({
    messagesItCanRecieve: {
        new: new Message(z.object({ name: z.string(), password: z.string() }), v => {
            console.log("User login attempt:", v.data);
        })
    },
    messagesItCanSend: {
        joined: new Message(z.object({ name: z.string() }), v => v.data)
    }
}).getClientRepresentation({ serverUrl: "" })



// Client usage
