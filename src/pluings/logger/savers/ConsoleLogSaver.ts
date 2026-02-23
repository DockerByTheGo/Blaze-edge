import type { ILogSaver, RequestLog } from "../types";

/**
 * Console log saver - logs all requests to the console
 * Supports all protocols (HTTP, WebSocket, gRPC, etc.)
 */
export class ConsoleLogSaver implements ILogSaver {
  private logs: RequestLog[] = [];

  async save(log: RequestLog): Promise<void> {
    this.logs.push(log);
    
    // Format log based on protocol
    const status = log.statusCode ? ` -> ${log.statusCode}` : '';
    const method = log.method ? ` ${log.method}` : '';
    const error = log.error ? ` ❌ ${log.error}` : '';
    
    console.log(
      `[${new Date(log.timestamp).toISOString()}] [${log.protocol.toUpperCase()}]${method} ${log.path}${status} (${log.responseTime}ms)${error}`
    );
  }

  async getLogs(options?: {
    limit?: number;
    offset?: number;
    method?: string;
    path?: string;
    protocol?: string;
  }): Promise<RequestLog[]> {
    let filtered = this.logs;

    if (options?.method) {
      filtered = filtered.filter(log => log.method === options.method);
    }

    if (options?.path) {
      filtered = filtered.filter(log => log.path === options.path);
    }

    if (options?.protocol) {
      filtered = filtered.filter(log => log.protocol === options.protocol);
    }

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 100;

    return filtered.slice(offset, offset + limit);
  }

  async getLog(id: string): Promise<RequestLog | null> {
    return this.logs.find(log => log.id === id) ?? null;
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
    console.log("[Logger] Logs cleared");
  }

  async getLogsCount(): Promise<number> {
    return this.logs.length;
  }
}
