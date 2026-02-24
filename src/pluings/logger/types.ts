/**
 * Represents a single request/response log entry
 */
export interface RequestLog {
  timestamp: number;
  protocol: string;
  path: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  requestData?: unknown;
  responseData?: unknown;
  error?: string;
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
   * Retrieves all logs
   */
  getLogs(): Promise<RequestLog[]>;
}
