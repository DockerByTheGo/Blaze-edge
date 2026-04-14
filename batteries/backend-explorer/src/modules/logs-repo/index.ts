import type { RequestResponseLifeCycleLog } from '@blazyts/blazy-edge'

export type ExplorerServiceLog = {
  name: string
  method: string
  startTime: string | number | Date
  endTime: string | number | Date
  got: unknown
  returned: unknown
}

export type ExplorerLog = RequestResponseLifeCycleLog & {
  serviceLogs?: ExplorerServiceLog[]
  services?: ExplorerServiceLog[]
}

export type WebSocketLogMessage = {
  type: 'sent' | 'received'
  data: unknown
  timestamp: Date
}

export interface LogsRepo {
  getRequestLog(id: string): Promise<ExplorerLog | null>
  getAllLogs(): Promise<ExplorerLog[]>
  getWebSocketMessages?(connectionId: string): Promise<WebSocketLogMessage[]>
  addLog(log: ExplorerLog): Promise<void>
  clearLogs(): Promise<void>
}
