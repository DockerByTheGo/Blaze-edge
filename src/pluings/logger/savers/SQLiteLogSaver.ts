import type { ILogSaver, RequestLog } from "../types";

/**
 * SQLite log saver - persists logs to a SQLite database
 * Supports all protocols (HTTP, WebSocket, gRPC, etc.)
 * Note: This implementation uses Bun's built-in SQLite support
 */
export class SQLiteLogSaver implements ILogSaver {
  private db: any; // SQLite database instance from Bun
  private tableName = "request_logs";

  constructor(dbPath: string = ":memory:") {
    // Using Bun's built-in sqlite support
    // In a real implementation, you would import and initialize the DB
    // This is a placeholder showing the structure

    try {
      // Attempt to use Bun's sqlite
      const sqlite = require("bun:sqlite").Database;
      this.db = new sqlite(dbPath);
      this.initializeTable();
    } catch (e) {
      console.error("Failed to initialize SQLite database:", e);
      throw new Error("SQLite not available. Ensure you're using Bun runtime.");
    }
  }

  private initializeTable(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        protocol TEXT NOT NULL,
        method TEXT,
        path TEXT NOT NULL,
        statusCode INTEGER,
        responseTime INTEGER NOT NULL,
        requestData TEXT,
        responseData TEXT,
        headers TEXT,
        error TEXT,
        metadata TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      this.db.exec(createTableSQL);
    } catch (e) {
      console.error("Failed to create logs table:", e);
    }
  }

  async save(log: RequestLog): Promise<void> {
    const insertSQL = `
      INSERT INTO ${this.tableName} 
      (id, timestamp, protocol, method, path, statusCode, responseTime, requestData, responseData, headers, error, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = this.db.prepare(insertSQL);

    stmt.run(
      log.id,
      log.timestamp,
      log.protocol,
      log.method || null,
      log.path,
      log.statusCode || null,
      log.responseTime,
      log.requestData ? JSON.stringify(log.requestData) : null,
      log.responseData ? JSON.stringify(log.responseData) : null,
      log.headers ? JSON.stringify(log.headers) : null,
      log.error || null,
      log.metadata ? JSON.stringify(log.metadata) : null
    );
  }

  async getLogs(options?: {
    limit?: number;
    offset?: number;
    method?: string;
    path?: string;
    protocol?: string;
  }): Promise<RequestLog[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    const conditions = [];

    if (options?.method) {
      conditions.push(`method = ?`);
      params.push(options.method);
    }

    if (options?.path) {
      conditions.push(`path = ?`);
      params.push(options.path);
    }

    if (options?.protocol) {
      conditions.push(`protocol = ?`);
      params.push(options.protocol);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY timestamp DESC`;

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 100;

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);

    return rows.map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      protocol: row.protocol,
      method: row.method || undefined,
      path: row.path,
      statusCode: row.statusCode || undefined,
      responseTime: row.responseTime,
      requestData: row.requestData ? JSON.parse(row.requestData) : undefined,
      responseData: row.responseData ? JSON.parse(row.responseData) : undefined,
      headers: row.headers ? JSON.parse(row.headers) : undefined,
      error: row.error || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  async getLog(id: string): Promise<RequestLog | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const row = stmt.get(id);

    if (!row) return null;

    return {
      id: row.id,
      timestamp: row.timestamp,
      protocol: row.protocol,
      method: row.method || undefined,
      path: row.path,
      statusCode: row.statusCode || undefined,
      responseTime: row.responseTime,
      requestData: row.requestData ? JSON.parse(row.requestData) : undefined,
      responseData: row.responseData ? JSON.parse(row.responseData) : undefined,
      headers: row.headers ? JSON.parse(row.headers) : undefined,
      error: row.error || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  async clearLogs(): Promise<void> {
    const deleteSQL = `DELETE FROM ${this.tableName}`;
    const stmt = this.db.prepare(deleteSQL);
    stmt.run();
  }

  async getLogsCount(): Promise<number> {
    const countSQL = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const stmt = this.db.prepare(countSQL);
    const result = stmt.get();
    return result?.count ?? 0;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}
