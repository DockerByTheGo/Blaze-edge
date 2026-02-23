import { randomUUID } from "crypto";
import type { ClientHandlerData, ILogSaver, LoggerConfig, RequestLog } from "./types";

/**
 * Logger service - manages protocol-agnostic request logging with pluggable storage backends
 * Works with data from client handlers supporting any protocol (HTTP, WebSocket, gRPC, etc.)
 */
export class LoggerService {
  private saver: ILogSaver;
  private config: LoggerConfig;

  constructor(saver: ILogSaver, config?: Partial<LoggerConfig>) {
    this.saver = saver;
    this.config = {
      logBodies: config?.logBodies ?? true,
      logHeaders: config?.logHeaders ?? false,
      excludePaths: config?.excludePaths ?? ["/health", "/metrics"],
      maxBodySize: config?.maxBodySize ?? 1024 * 100, // 100KB default
      enabledProtocols: config?.enabledProtocols ?? [], // empty = all protocols
    };
  }

  /**
   * Logs a request/response cycle from client handler data
   * Protocol-agnostic - works with any handler type
   * Type-safe wrapper that ensures all required fields are provided
   */
  async logFromClientHandler(data: ClientHandlerData): Promise<void> {
    // Check if protocol should be logged
    if (!this.shouldLogProtocol(data.protocol)) {
      return;
    }

    // Check if path should be excluded
    if (this.shouldExcludePath(data.path)) {
      return;
    }

    const log: RequestLog = {
      id: randomUUID(),
      timestamp: Date.now(),
      protocol: data.protocol,
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
      responseTime: data.endTime - data.startTime,
      requestData: this.shouldLogBody(data.requestData),
      responseData: this.shouldLogBody(data.responseData),
      headers: this.config.logHeaders ? data.headers : undefined,
      error: data.error?.message || undefined,
      metadata: data.metadata,
    };

    await this.saver.save(log);
  }

  /**
   * Legacy method - logs a direct HTTP request
   * Use logFromClientHandler() for new integrations
   */
  async logRequest(data: {
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    requestBody?: unknown;
    responseBody?: unknown;
    headers?: Record<string, string>;
    error?: string;
  }): Promise<void> {
    await this.logFromClientHandler({
      protocol: 'http',
      path: data.path,
      method: data.method,
      requestData: data.requestBody,
      responseData: data.responseBody,
      statusCode: data.statusCode,
      headers: data.headers,
      startTime: Date.now() - data.responseTime,
      endTime: Date.now(),
      error: data.error ? new Error(data.error) : undefined,
    });
  }

  /**
   * Retrieves logs with optional filtering and pagination
   */
  async getLogs(options?: {
    limit?: number;
    offset?: number;
    method?: string;
    path?: string;
    protocol?: string;
  }): Promise<RequestLog[]> {
    return this.saver.getLogs(options);
  }

  /**
   * Retrieves a single log entry by ID
   */
  async getLog(id: string): Promise<RequestLog | null> {
    return this.saver.getLog(id);
  }

  /**
   * Gets the total count of logged requests
   */
  async getLogsCount(): Promise<number> {
    return this.saver.getLogsCount();
  }

  /**
   * Clears all logs
   */
  async clearLogs(): Promise<void> {
    await this.saver.clearLogs();
  }

  /**
   * Changes the log saver implementation
   */
  setSaver(saver: ILogSaver): void {
    this.saver = saver;
  }

  /**
   * Updates the logger configuration
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets current configuration
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }

  /**
   * Check if protocol should be logged
   */
  private shouldLogProtocol(protocol: string): boolean {
    // If enabledProtocols is empty, log all protocols
    if (!this.config.enabledProtocols || this.config.enabledProtocols.length === 0) {
      return true;
    }
    return this.config.enabledProtocols.includes(protocol);
  }

  /**
   * Check if path should be excluded from logging
   */
  private shouldExcludePath(path: string): boolean {
    return this.config.excludePaths.some(excludePath => {
      // Support wildcard patterns
      const pattern = excludePath.replace(/\*/g, ".*");
      return new RegExp(`^${pattern}$`).test(path);
    });
  }

  /**
   * Check if body should be logged based on size and configuration
   */
  private shouldLogBody(body: unknown): unknown {
    if (!this.config.logBodies || body === undefined) {
      return undefined;
    }

    const bodyString = typeof body === "string" ? body : JSON.stringify(body);
    if (bodyString.length > this.config.maxBodySize) {
      return `[Body too large: ${bodyString.length} bytes]`;
    }

    return body;
  }
}
