import type { z } from "zod";

/**
 * Represents a single request/response log entry
 * Protocol-agnostic - works with HTTP, WebSocket, and other protocols
 */
export interface RequestLog {
  id: string;
  timestamp: number;
  protocol: string; // 'http', 'ws', 'grpc', etc.
  method?: string; // HTTP method (GET, POST, etc.)
  path: string;
  statusCode?: number; // HTTP status code or custom status for other protocols
  responseTime: number; // in milliseconds
  requestData?: unknown; // Protocol-specific request data
  responseData?: unknown; // Protocol-specific response data
  headers?: Record<string, string>;
  error?: string;
  metadata?: Record<string, unknown>; // Protocol-specific metadata
}

/**
 * Data captured by client handlers for logging
 * Represents the raw data from a request/response cycle
 */
export interface ClientHandlerData {
  protocol: string;
  path: string;
  method?: string;
  requestData?: unknown;
  responseData?: unknown;
  statusCode?: number;
  headers?: Record<string, string>;
  startTime: number;
  endTime: number;
  error?: Error;
  metadata?: Record<string, unknown>;
}

/**
 * Interface for log storage implementations
 */
export interface ILogSaver {
  /**
   * Saves a log entry to the storage medium
   */
  save(log: RequestLog): Promise<void>;

  /**
   * Retrieves all logs, optionally filtered and paginated
   */
  getLogs(options?: {
    limit?: number;
    offset?: number;
    method?: string;
    path?: string;
    protocol?: string;
  }): Promise<RequestLog[]>;

  /**
   * Gets a single log by ID
   */
  getLog(id: string): Promise<RequestLog | null>;

  /**
   * Clears all logs
   */
  clearLogs(): Promise<void>;

  /**
   * Gets the total count of logs
   */
  getLogsCount(): Promise<number>;
}

/**
 * Configuration for the logger service
 */
export interface LoggerConfig {
  /**
   * Whether to log request/response bodies
   */
  logBodies: boolean;

  /**
   * Whether to log headers
   */
  logHeaders: boolean;

  /**
   * Paths to exclude from logging
   */
  excludePaths: string[];

  /**
   * Maximum response body size to log (in bytes)
   */
  maxBodySize: number;

  /**
   * Protocols to enable logging for
   * Empty = log all protocols
   */
  enabledProtocols?: string[];
}
