import { type FC, useMemo, useState, useEffect } from 'react'
import type { Log } from '@blazyts/blazy-edge'
import { MockLogsRepo } from '../../logs-repo/MockLogsRepo'

interface LogEntryProps {
  log: Log
}

type WebSocketMessage = {
  type: 'sent' | 'received'
  data: unknown
  timestamp: Date
}

type RequestDetails = {
  method?: string
  path?: string
  headers?: Record<string, unknown>
  body?: unknown
  recievedAt?: string | number | Date
}

type ResponseDetails = {
  statusCode?: number
  body?: unknown
  sentAt?: string | number | Date
}

const LogEntry: FC<LogEntryProps> = ({ log }) => {
  const [expanded, setExpanded] = useState(false)
  const [wsMessages, setWsMessages] = useState<WebSocketMessage[] | null>(null)
  const [wsFilter, setWsFilter] = useState<'all' | 'received' | 'sent'>('all')
  useEffect(() => {
    if (log.connectionId) {
      const repo = new MockLogsRepo()
      repo.getWebSocketMessages(log.connectionId).then(setWsMessages)
    }
  }, [log.connectionId])

  const filteredWsMessages = useMemo(() => {
    if (!wsMessages) return null
    if (wsFilter === 'all') return wsMessages
    return wsMessages.filter(m => m.type === wsFilter)
  }, [wsMessages, wsFilter])

  const getStatusClass = (statusCode: number) => {
    if (statusCode < 300) return 'status-success'
    if (statusCode < 400) return 'status-redirect'
    if (statusCode < 500) return 'status-client-error'
    return 'status-server-error'
  }

  const getMethodClass = (method: string) => {
    const classes: Record<string, string> = {
      GET: 'method-get',
      POST: 'method-post',
      PUT: 'method-put',
      DELETE: 'method-delete',
      PATCH: 'method-patch',
    }
    return classes[method] || 'method-default'
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const requestReceived = log.requestReceived as RequestDetails
  const responseSent = log.responseSent as ResponseDetails
  const statusCode = responseSent.statusCode || 200
  const method = requestReceived.method || 'WS'
  const path = requestReceived.path || ''
  const protocol = requestReceived.headers?.Upgrade === 'websocket' ? 'WS' : 'HTTP'
  const timestamp = requestReceived.recievedAt || new Date()
  const duration = responseSent.sentAt && requestReceived.recievedAt ?
    new Date(responseSent.sentAt).getTime() - new Date(requestReceived.recievedAt).getTime() : 0

  return (
    <div className="log-entry">
      <div className="log-entry-summary" onClick={() => setExpanded(!expanded)}>
        <span className={`badge status-badge ${getStatusClass(statusCode)}`}>{statusCode}</span>
        <span className={`badge method-badge ${getMethodClass(method)}`}>{method}</span>
        <span className="log-entry-path">{path}</span>
        <span className="log-entry-protocol">{protocol}</span>
        <span className="log-entry-time">{new Date(timestamp).toLocaleTimeString()}</span>
        <span className="log-entry-duration">{formatDuration(duration)}</span>
        <span className="log-entry-chevron">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="log-entry-details">
          <div className="detail-section">
            <h4 className="detail-heading">Request</h4>
            <div className="detail-row">
              <span className="detail-label">Method:</span>
              <span className="detail-value">{method}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Path:</span>
              <span className="detail-value">{path}</span>
            </div>
            {log.requestReceived?.headers && (
              <div className="detail-row">
                <span className="detail-label">Headers:</span>
                <code className="code-block">{JSON.stringify(log.requestReceived.headers, null, 2)}</code>
              </div>
            )}
            {log.requestReceived?.body && (
              <div className="detail-row">
                <span className="detail-label">Body:</span>
                <code className="code-block">{JSON.stringify(log.requestReceived.body, null, 2)}</code>
              </div>
            )}
          </div>

          <div className="detail-section">
            <h4 className="detail-heading">Response</h4>
            <div className="detail-row">
              <span className="detail-label">Status Code:</span>
              <span className={`detail-value ${getStatusClass(statusCode)}`}>{statusCode}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">{formatDuration(duration)}</span>
            </div>
            {log.responseSent?.body && (
              <div className="detail-row">
                <span className="detail-label">Body:</span>
                <code className="code-block">{JSON.stringify(log.responseSent.body, null, 2)}</code>
              </div>
            )}
          </div>

          {log.connectionId && wsMessages && (
            <div className="detail-section">
              <h4 className="detail-heading">WebSocket Messages ({wsMessages.length})</h4>

              <div className="ws-filter-list">
                <button
                  className={`ws-filter-button ${wsFilter === 'all' ? 'is-active-all' : ''}`}
                  onClick={() => setWsFilter('all')}
                  aria-pressed={wsFilter === 'all'}
                >
                  All
                </button>
                <button
                  className={`ws-filter-button ${wsFilter === 'received' ? 'is-active-received' : ''}`}
                  onClick={() => setWsFilter('received')}
                  aria-pressed={wsFilter === 'received'}
                >
                  Received
                </button>
                <button
                  className={`ws-filter-button ${wsFilter === 'sent' ? 'is-active-sent' : ''}`}
                  onClick={() => setWsFilter('sent')}
                  aria-pressed={wsFilter === 'sent'}
                >
                  Sent
                </button>
              </div>

              <div className="ws-message-list">
                {(filteredWsMessages || [])
                .filter(msg => msg.type === wsFilter || wsFilter === 'all')
                .map((msg, idx) => (
                  <div key={`${msg.timestamp.toString()}-${idx}`} className={`ws-message ${msg.type === 'sent' ? 'ws-message-sent' : 'ws-message-received'}`}>
                    <div className="ws-message-header">
                      <span className={`ws-message-type ${msg.type === 'sent' ? 'ws-message-type-sent' : 'ws-message-type-received'}`}>
                        {msg.type === 'sent' ? ' Sent ' : ' Received '}
                      </span>
                      <span className="muted-copy">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {msg.data && Object.keys(msg.data).length > 0 && (
                      <code className="code-block">{JSON.stringify(msg.data, null, 2)}</code>
                    )}
                  </div>
                ))}
                {filteredWsMessages && filteredWsMessages.length === 0 && (
                  <div className="empty-state">No messages match the filter.</div>
                )}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h4 className="detail-heading">Metadata</h4>
            <div className="detail-row">

              <span className="detail-label">Request ID:</span>
              <span className="detail-value">{log.requestId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Received At:</span>
              <span className="detail-value">{new Date(timestamp).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Sent At:</span>
              <span className="detail-value">{log.responseSent?.sentAt ? new Date(log.responseSent.sentAt).toLocaleString() : 'N/A'}</span>
            </div>
            {log.connectionId && (
              <div className="detail-row">
                <span className="detail-label">Connection ID:</span>
                <span className="detail-value">{log.connectionId}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

}

export default LogEntry
