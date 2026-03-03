import { Optionable } from "@blazyts/better-standard-library";
import type { Log } from "@blazyts/blazy-edge";
import type { LogsRepo } from "./index";

/**
 * Mock implementation of LogsRepo with hardcoded log data
 * Useful for development and testing without a real backend
 */
export class MockLogsRepo implements LogsRepo {
  private logs: Log[] = [
    {
      timestamp: Date.now() - 30000,
      protocol: "http",
      path: "/api/users",
      method: "GET",
      statusCode: 200,
      responseTime: 145,
      requestData: { page: 1, limit: 10 },
      responseData: { users: [{ id: 1, name: "John" }], total: 1 },
    },
    {
      timestamp: Date.now() - 25000,
      protocol: "http",
      path: "/api/users",
      method: "POST",
      statusCode: 201,
      responseTime: 234,
      requestData: { name: "Jane", email: "jane@example.com" },
      responseData: { id: 2, name: "Jane", email: "jane@example.com" },
    },
    {
      timestamp: Date.now() - 20000,
      protocol: "http",
      path: "/api/users/1",
      method: "GET",
      statusCode: 200,
      responseTime: 89,
      requestData: {},
      responseData: { id: 1, name: "John", email: "john@example.com" },
    },
    {
      timestamp: Date.now() - 15000,
      protocol: "http",
      path: "/api/users/1",
      method: "PUT",
      statusCode: 200,
      responseTime: 167,
      requestData: { name: "John Doe" },
      responseData: { id: 1, name: "John Doe", email: "john@example.com" },
    },
    {
      timestamp: Date.now() - 10000,
      protocol: "http",
      path: "/api/invalid",
      method: "GET",
      statusCode: 404,
      responseTime: 45,
      requestData: {},
      responseData: { error: "Not Found" },
      error: "Route not found",
    },
    {
      timestamp: Date.now() - 5000,
      protocol: "http",
      path: "/api/users/999",
      method: "DELETE",
      statusCode: 500,
      responseTime: 234,
      requestData: {},
      responseData: { error: "Internal Server Error" },
      error: "Database connection failed",
    },
    {
      timestamp: Date.now() - 2000,
      protocol: "ws",
      path: "/ws/chat",
      method: undefined,
      statusCode: 101,
      responseTime: 12,
      requestData: { action: "connect" },
      responseData: { connectionId: "ws-123" },
    },
    {
      timestamp: Date.now() - 1000,
      protocol: "http",
      path: "/api/auth/login",
      method: "POST",
      statusCode: 200,
      responseTime: 345,
      requestData: { username: "admin", password: "***" },
      responseData: { token: "jwt_token_xxx", expiresIn: 3600 },
    },
  ];

  async getRequestLog(id: string): Promise<Optionable<Log>> {
    const log = this.logs.find(
      log => JSON.stringify(log.requestData).includes(id) || 
             JSON.stringify(log.responseData).includes(id)
    );
    
    if (log) {
      return Optionable.some(log);
    }
    return Optionable.none();
  }

  async getAllLogs(): Promise<Log[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.logs;
  }

  /**
   * Add a new log entry (useful for testing)
   */
  addLog(log: Log): void {
    this.logs.unshift(log);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}
