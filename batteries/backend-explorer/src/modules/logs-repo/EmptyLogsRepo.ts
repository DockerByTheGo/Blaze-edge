import type { ExplorerLog, LogsRepo, WebSocketLogMessage } from './index'

export class EmptyLogsRepo implements LogsRepo {
  async getRequestLog(_id: string): Promise<ExplorerLog | null> {
    return null
  }

  async getAllLogs(): Promise<ExplorerLog[]> {
    return []
  }

  async getWebSocketMessages(_connectionId: string): Promise<WebSocketLogMessage[]> {
    return []
  }

  async addLog(_log: ExplorerLog): Promise<void> {}

  async clearLogs(): Promise<void> {}
}
