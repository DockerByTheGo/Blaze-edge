import type { ExplorerLog, LogsRepo, WebSocketLogMessage } from '../../src/modules/logs-repo'

type StoredWebSocketLogMessage = WebSocketLogMessage & {
  connectionId: string
}

export class MockLogsRepo implements LogsRepo {
  private logs: ExplorerLog[] = [
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
        beforeHandler: [
          {
            name: 'attachServices',
            startTime: new Date(Date.now() - 60020),
            endTime: new Date(Date.now() - 60012),
            got: { method: 'GET', path: '/api/users' },
            returned: { services: ['cartService'] },
          },
          {
            name: 'authGuard',
            startTime: new Date(Date.now() - 60010),
            endTime: new Date(Date.now() - 60003),
            got: { userId: 'user-1' },
            returned: { authorized: true },
          },
        ],
        afterHandler: [
          {
            name: 'responseLogger',
            startTime: new Date(Date.now() - 59958),
            endTime: new Date(Date.now() - 59955),
            got: { statusCode: 200 },
            returned: { logged: true },
          },
        ],
      },
      serviceLogs: [
        {
          name: 'cartService',
          method: 'getAll',
          startTime: new Date(Date.now() - 59990),
          endTime: new Date(Date.now() - 59976),
          got: { filter: 'active' },
          returned: ['cart 1', 'cart 2', 'cart 3'],
        },
        {
          name: 'userService',
          method: 'getAll',
          startTime: new Date(Date.now() - 59974),
          endTime: new Date(Date.now() - 59960),
          got: { includeInactive: false },
          returned: { users: ['John', 'Jane'] },
        },
      ],
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
        beforeHandler: [
          {
            name: 'attachServices',
            startTime: new Date(Date.now() - 45020),
            endTime: new Date(Date.now() - 45012),
            got: { method: 'POST', path: '/api/users' },
            returned: { services: ['cartService'] },
          },
        ],
        afterHandler: [
          {
            name: 'responseLogger',
            startTime: new Date(Date.now() - 44884),
            endTime: new Date(Date.now() - 44880),
            got: { statusCode: 201 },
            returned: { logged: true },
          },
        ],
      },
      serviceLogs: [
        {
          name: 'userService',
          method: 'create',
          startTime: new Date(Date.now() - 44980),
          endTime: new Date(Date.now() - 44910),
          got: { name: 'John Doe', email: 'john@example.com' },
          returned: { id: 'user123', name: 'John Doe', email: 'john@example.com' },
        },
      ],
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
        beforeHandler: [
          {
            name: 'websocketUpgradeGuard',
            startTime: new Date(Date.now() - 120020),
            endTime: new Date(Date.now() - 120010),
            got: { upgrade: 'websocket' },
            returned: { allowed: true },
          },
        ],
        afterHandler: [],
      },
      serviceLogs: [
        {
          name: 'notificationsService',
          method: 'subscribe',
          startTime: new Date(Date.now() - 119980),
          endTime: new Date(Date.now() - 119950),
          got: { channel: 'notifications' },
          returned: { subscriptionId: 'sub-001' },
        },
      ],
      connectionId: 'conn-001',
    },
  ]

  private wsMessages: StoredWebSocketLogMessage[] = [
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

  async getRequestLog(id: string): Promise<ExplorerLog | null> {
    return this.logs.find(log => log.requestId === id) || null
  }

  async getAllLogs(): Promise<ExplorerLog[]> {
    return this.getAllLogsSnapshot()
  }

  getAllLogsSnapshot(): ExplorerLog[] {
    return [...this.logs].sort(
      (a, b) =>
        new Date(b.requestReceived.recievedAt).getTime() -
        new Date(a.requestReceived.recievedAt).getTime()
    )
  }

  async getWebSocketMessages(connectionId: string): Promise<WebSocketLogMessage[]> {
    return this.wsMessages
      .filter(msg => msg.connectionId === connectionId)
      .map(({ connectionId: _connectionId, ...message }) => message)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  async addLog(log: ExplorerLog): Promise<void> {
    this.logs.push(log)
  }

  async clearLogs(): Promise<void> {
    this.logs = []
  }
}
