import type { ILogSaver, RequestLog } from "../types";

/**
 * Console log saver - logs all requests to the console
 * Supports all protocols (HTTP, WebSocket, gRPC, etc.)
 */
export class ConsoleLogSaver implements ILogSaver {
  private logs: RequestLog[] = [];

  async save(log: RequestLog): Promise<void> {
    this.logs.push(log);
    console.log(
      `[${new Date(log.timestamp).toISOString()}] [${log.protocol?.toUpperCase?.() ?? ''}] ${log.method ?? ''} ${log.path ?? ''} -> ${log.statusCode ?? ''} () ${log.error ? ' ❌ ' + log.error : ''}`
    );
  }

  async getLogs(): Promise<RequestLog[]> {
    return this.logs;
  }
}
