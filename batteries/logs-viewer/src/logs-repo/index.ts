import type { Log } from '@blazyts/blazy-edge'

export interface LogsRepo {
  getRequestLog(id: string): Promise<Log | null>
  getAllLogs(): Promise<Log[]>
  addLog(log: Log): Promise<void>
  clearLogs(): Promise<void>
}
