import type { Log, RequestLog } from '@blazyts/blazy-edge'
import type { LogsRepo } from './index'

export class MockLogsRepo implements LogsRepo {
  private logs: Log[] = [
    {
      requestId: '1',
      requestReceived: {
        method: 'GET',
        path: '/api/users',
        headers: { 'Content-Type': 'application/json' },
        recievedAt: new Date(Date.now() - 60000),
      },
      responseSent: {
        statusCode: 200,
        body: { users: ['John', 'Jane'] },
        sentAt: new Date(Date.now() - 59955),
      },
      hooks: {
        beforeHandler: [],
        afterHandler: [],
      },
    },
    {
      requestId: '2',
      requestReceived: {
        method: 'POST',
        path: '/api/users',
        body: { name: 'John Doe', email: 'john@example.com' },
        headers: { 'Content-Type': 'application/json' },
        recievedAt: new Date(Date.now() - 45000),
      },
      responseSent: {
        statusCode: 201,
        body: { id: 'user123', name: 'John Doe', email: 'john@example.com' },
        sentAt: new Date(Date.now() - 44880),
      },
      hooks: {
        beforeHandler: [],
        afterHandler: [],
      },
    },
    {
      requestId: 'ws-1',
      requestReceived: {
        method: 'GET',
        path: '/api/ws',
        headers: { Upgrade: 'websocket' },
        recievedAt: new Date(Date.now() - 120000),
      },
      responseSent: {
        statusCode: 101,
        body: { upgraded: true },
        sentAt: new Date(Date.now() - 119990),
      },
      hooks: {
        beforeHandler: [],
        afterHandler: [],
      },
      connectionId: 'conn-001',
    },
  ]

  // Example websocket messages for the connection
  private wsMessages: Array<{
    connectionId: string
    type: 'sent' | 'received'
    data: any
    timestamp: Date
  }> = [
    {
      connectionId: 'conn-001',
      type: 'received',
      data: { event: 'subscribe', channel: 'notifications' },
      timestamp: new Date(Date.now() - 119000),
    },
    {
      connectionId: 'conn-001',
      type: 'sent',
      data: { event: 'subscribed', channel: 'notifications' },
      timestamp: new Date(Date.now() - 118990),
    },
    {
      connectionId: 'conn-001',
      type: 'received',
      data: { event: 'message', content: 'Hello from server!' },
      timestamp: new Date(Date.now() - 115000),
    },
    {
      connectionId: 'conn-001',
      type: 'sent',
      data: { event: 'message', content: 'Hello from client!' },
      timestamp: new Date(Date.now() - 114990),
    },
  ]


  async getRequestLog(id: string): Promise<Log | null> {
    return this.logs.find(log => log.requestId === id) || null
  }

  async getAllLogs(): Promise<Log[]> {
    return [...this.logs].sort(
      (a, b) =>
        new Date(b.requestReceived.recievedAt).getTime() -
        new Date(a.requestReceived.recievedAt).getTime()
    )
  }

  async getWebSocketMessages(connectionId: string): Promise<Array<{ type: 'sent' | 'received'; data: any; timestamp: Date }>> {
    return this.wsMessages
      .filter(msg => msg.connectionId === connectionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  async addLog(log: Log): Promise<void> {
    this.logs.push(log)
  }

  async clearLogs(): Promise<void> {
    this.logs = []
  }
}
