
import { type WebSocket } from 'bun';
import { z } from 'zod/v4';

type WebSocketConnection = {
  id: string;
  ws: WebSocket;
  isAlive: boolean;
  close: () => void;
};

export class RequestResponseWebsocketHandler<
  TBody extends z.ZodType,
  TResponse extends z.ZodType
> {
  private connections = new Map<string, WebSocketConnection>();
  private timeout: number;
  private timeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    public readonly schema: {
      body: TBody;
      response: TResponse;
    },
    public readonly handler: (
      data: z.infer<TBody>
    ) => Promise<z.infer<TResponse>> | z.infer<TResponse>,
    options: {
      timeout?: number;
    } = {}
  ) {
    this.timeout = options.timeout ?? 30000; // 30 seconds default timeout
  }

  private generateConnectionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private resetTimeout(connectionId: string) {
    if (this.timeouts.has(connectionId)) {
      clearTimeout(this.timeouts.get(connectionId)!);
    }
    const timeout = setTimeout(() => {
      const connection = this.connections.get(connectionId);
      if (connection) {
        connection.close();
      }
    }, this.timeout);
    this.timeouts.set(connectionId, timeout);
  }

  handleConnection(ws: WebSocket) {
    const connectionId = this.generateConnectionId();
    const connection: WebSocketConnection = {
      id: connectionId,
      ws,
      isAlive: true,
      close: () => {
        if (this.timeouts.has(connectionId)) {
          clearTimeout(this.timeouts.get(connectionId)!);
          this.timeouts.delete(connectionId);
        }
        this.connections.delete(connectionId);
        ws.close();
      },
    };

    this.connections.set(connectionId, connection);

    // Set initial timeout
    this.resetTimeout(connectionId);
  }

  getUpgradeHandler() {
    return (req: Request, server: any) => {
      if (server.upgrade(req)) {
        return;
      }
      return new Response("Upgrade failed :(", { status: 500 });
    }
  }

  getBunWebsocketHandler() {
    return {
      open: (ws: WebSocket) => {
        this.handleConnection(ws as any);
      },
      message: async (ws: WebSocket, message: string) => {
        const connection = Array.from(this.connections.values()).find(c => c.ws === ws);
        if(!connection) return;
    
        try {
          const parsedMessage = JSON.parse(message);
          const parsedData = this.schema.body.parse(parsedMessage);
    
          // Reset the timeout
          this.resetTimeout(connection.id);
    
          const response = await this.handler(parsedData);
          ws.send(JSON.stringify(response));
    
          // Reset the timeout again after sending the response
          this.resetTimeout(connection.id);
    
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid request or handler error' }));
          connection.close();
        }
      },
      close: (ws: WebSocket, code: number, message: string) => {
        // Find the connection and remove it
        for (const [id, connection] of this.connections.entries()) {
          if (connection.ws === ws) {
            this.connections.delete(id);
            if (this.timeouts.has(id)) {
              clearTimeout(this.timeouts.get(id)!);
              this.timeouts.delete(id);
            }
            break;
          }
        }
      },
      error: (ws: WebSocket, error: Error) => {
        console.error("WebSocket error:", error);
        // Find the connection and close it
        for (const [id, connection] of this.connections.entries()) {
          if (connection.ws === ws) {
            connection.close();
            break;
          }
        }
      },
    };
  }

}
