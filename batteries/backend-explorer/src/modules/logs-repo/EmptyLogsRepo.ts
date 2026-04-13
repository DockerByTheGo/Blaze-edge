import type { Log } from '@blazyts/blazy-edge'
import type { LogsRepo, WebSocketLogMessage } from './index'

export class EmptyLogsRepo implements LogsRepo {
  async getRequestLog(_id: string): Promise<Log | null> {
    return null
  }

  async getAllLogs(): Promise<Log[]> {
    return []
  }

  async getWebSocketMessages(_connectionId: string): Promise<WebSocketLogMessage[]> {
    return []
  }

  async addLog(_log: Log): Promise<void> {}

  async clearLogs(): Promise<void> {}
}
