import type { Log } from '@blazyts/blazy-edge'

export type WebSocketLogMessage = {
  type: 'sent' | 'received'
  data: unknown
  timestamp: Date
}

export interface LogsRepo {
  getRequestLog(id: string): Promise<Log | null>
  getAllLogs(): Promise<Log[]>
  getWebSocketMessages?(connectionId: string): Promise<WebSocketLogMessage[]>
  addLog(log: Log): Promise<void>
  clearLogs(): Promise<void>
}
