/**
 * Core Integration for Logger Plugin
 * This module provides integration points for the Blazy core to log requests
 * It handles logging at the route-finding and request-handling level
 */

import { randomUUID } from "crypto";
import type { LoggerService } from "./LoggerService";
import type { ClientHandlerData, RequestLog } from "./types";

/**
 * Logger middleware integration for Blazy core
 * Used by the core to log requests when they are handled or not found
 */
export class CoreLoggerIntegration {
  constructor(private logger: LoggerService) {}

  /**
   * Log a request when a route is found and handled
   * Called by the core after executing a handler
   */
  async logFoundRoute(data: {
    path: string;
    protocol: string;
    method?: string;
    requestData?: unknown;
    responseData?: unknown;
    statusCode?: number;
    headers?: Record<string, string>;
    responseTime: number;
    error?: Error;
  }): Promise<void> {
    await this.logger.logFromClientHandler({
      protocol: data.protocol,
      path: data.path,
      method: data.method,
      requestData: data.requestData,
      responseData: data.responseData,
      statusCode: data.statusCode,
      headers: data.headers,
      startTime: Date.now() - data.responseTime,
      endTime: Date.now(),
      error: data.error,
      metadata: {
        source: 'core',
        found: true,
      },
    });
  }

  /**
   * Log a request when no route is found (404)
   * Called by the core when treeRouteFinder returns Optionable.none()
   */
  async logNotFoundRoute(data: {
    path: string;
    protocol: string;
    method?: string;
    requestData?: unknown;
    headers?: Record<string, string>;
    responseTime: number;
    error?: string;
  }): Promise<void> {
    await this.logger.logFromClientHandler({
      protocol: data.protocol,
      path: data.path,
      method: data.method,
      requestData: data.requestData,
      responseData: undefined,
      statusCode: 404,
      headers: data.headers,
      startTime: Date.now() - data.responseTime,
      endTime: Date.now(),
      error: data.error ? new Error(data.error) : undefined,
      metadata: {
        source: 'core',
        found: false,
      },
    });
  }

  /**
   * Extract protocol from the protocol handlers object or from metadata
   */
  static extractProtocol(
    protocolKey: string | undefined,
    metadata?: { protocol?: string; subRoute?: string }
  ): string {
    // Protocol key can be 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ws', etc.
    if (protocolKey) {
      if (protocolKey === 'ws') return 'ws';
      if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(protocolKey)) return 'http';
      return protocolKey.toLowerCase();
    }

    // Fallback to metadata
    if (metadata?.protocol) {
      return metadata.protocol.toLowerCase();
    }

    return 'http'; // Default protocol
  }

  /**
   * Extract HTTP method from protocol key
   */
  static extractMethod(protocolKey: string | undefined): string | undefined {
    if (!protocolKey) return undefined;
    if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(protocolKey)) {
      return protocolKey;
    }
    return undefined;
  }

  /**
   * Extract status code from response
   */
  static extractStatusCode(response: any, isError: boolean = false): number | undefined {
    if (isError) return 500;

    // Try to get status code from response
    if (response && typeof response === 'object') {
      if ('statusCode' in response) return response.statusCode as number;
      if ('status' in response) return response.status as number;
    }

    // Default to 200 for successful responses
    return response ? 200 : undefined;
  }

  /**
   * Extract data from response
   */
  static extractResponseData(response: any): unknown {
    if (!response) return undefined;

    // If it's a Response object
    if (response instanceof Response) {
      return undefined; // Response bodies can't be read after sending
    }

    // Try to extract body
    if (typeof response === 'object' && 'body' in response) {
      return (response as any).body;
    }

    return response;
  }
}

/**
 * Create a logger integration instance
 */
export function createCoreLoggerIntegration(
  logger: LoggerService
): CoreLoggerIntegration {
  return new CoreLoggerIntegration(logger);
}
