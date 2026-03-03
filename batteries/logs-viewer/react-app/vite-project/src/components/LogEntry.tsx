import React, { useMemo, useState } from 'react'
import type { Log } from '@blazyts/blazy-edge'
import { useEffect,  } from 'react'
import { MockLogsRepo } from '../logs-repo/MockLogsRepo'
import './LogEntry.css'

interface LogEntryProps {
  log: Log
}

const LogEntry: React.FC<LogEntryProps> = ({ log }) => {
  const [expanded, setExpanded] = useState(false)
  const [wsMessages, setWsMessages] = useState<Array<{ type: 'sent' | 'received'; data: any; timestamp: Date }> | null>(null)
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
    if (statusCode < 300) return 'status-2xx'
    if (statusCode < 400) return 'status-3xx'
    if (statusCode < 500) return 'status-4xx'
    return 'status-5xx'
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

  // Helper for new Log type
  const statusCode = (log as any).responseSent?.statusCode || 200
  const method = (log as any).requestReceived?.method || 'WS'
  const path = (log as any).requestReceived?.path || ''
  const protocol = (log as any).requestReceived?.headers?.Upgrade === 'websocket' ? 'WS' : 'HTTP'
  const timestamp = (log as any).requestReceived?.recievedAt || new Date()
  const duration = (log as any).responseSent && (log as any).requestReceived ?
    new Date((log as any).responseSent.sentAt).getTime() - new Date((log as any).requestReceived.recievedAt).getTime() : 0

  return (
    <div className="log-entry">
      <div className="log-header" onClick={() => setExpanded(!expanded)}>
        <span className={`status-badge ${getStatusClass(statusCode)}`}>{statusCode}</span>
        <span className={`method-badge ${getMethodClass(method)}`}>{method}</span>
        <span className="log-path">{path}</span>
        <span className="log-protocol">{protocol}</span>
        <span className="log-timestamp">{new Date(timestamp).toLocaleTimeString()}</span>
        <span className="log-duration">{formatDuration(duration)}</span>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="log-details">
          <div className="detail-section">
            <h4>Request</h4>
            <div className="detail-group">
              <span className="label">Method:</span>
              <span className="value">{method}</span>
            </div>
            <div className="detail-group">
              <span className="label">Path:</span>
              <span className="value">{path}</span>
            </div>
            {log.requestReceived?.headers && (
              <div className="detail-group">
                <span className="label">Headers:</span>
                <code className="value">{JSON.stringify(log.requestReceived.headers, null, 2)}</code>
              </div>
            )}
            {log.requestReceived?.body && (
              <div className="detail-group">
                <span className="label">Body:</span>
                <code className="value">{JSON.stringify(log.requestReceived.body, null, 2)}</code>
              </div>
            )}
          </div>

          <div className="detail-section">
            <h4>Response</h4>
            <div className="detail-group">
              <span className="label">Status Code:</span>
              <span className={`value ${getStatusClass(statusCode)}`}>{statusCode}</span>
            </div>
            <div className="detail-group">
              <span className="label">Duration:</span>
              <span className="value">{formatDuration(duration)}</span>
            </div>
            {log.responseSent?.body && (
              <div className="detail-group">
                <span className="label">Body:</span>
                <code className="value">{JSON.stringify(log.responseSent.body, null, 2)}</code>
              </div>
            )}
          </div>

          {log.connectionId && wsMessages && (
            <div className="detail-section">
              <h4>WebSocket Messages ({wsMessages.length})</h4>

              <div className="ws-filter-bar">
                <button
                  className={`ws-filter-btn ${wsFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setWsFilter('all')}
                  aria-pressed={wsFilter === 'all'}
                >
                  All
                </button>
                <button
                  className={`ws-filter-btn ${wsFilter === 'received' ? 'active' : ''} received-btn`}
                  onClick={() => setWsFilter('received')}
                  aria-pressed={wsFilter === 'received'}
                >
                  Received
                </button>
                <button
                  className={`ws-filter-btn ${wsFilter === 'sent' ? 'active' : ''} sent-btn`}
                  onClick={() => setWsFilter('sent')}
                  aria-pressed={wsFilter === 'sent'}
                >
                  Sent
                </button>
              </div>

              <div className="ws-messages">
                {(filteredWsMessages || []).map((msg, idx) => (
                  <div key={`${msg.timestamp.toString()}-${idx}`} className={`ws-message ${msg.type}`}>
                    <div className="ws-header">
                      <span className={`ws-type-badge ${msg.type === 'sent' ? 'sent-badge' : 'received-badge'}`}>
                        {msg.type === 'sent' ? '📤 Sent' : '📥 Received'}
                      </span>
                      <span className="ws-timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {msg.data && Object.keys(msg.data).length > 0 && (
                      <code className="ws-data">{JSON.stringify(msg.data, null, 2)}</code>
                    )}
                  </div>
                ))}
                {filteredWsMessages && filteredWsMessages.length === 0 && (
                  <div className="no-ws-messages">No messages match the filter.</div>
                )}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h4>Metadata</h4>
            <div className="detail-group">
                    <div className="ws-filter-bar">
                      <button
                        className={`ws-filter-btn ${wsFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setWsFilter('all')}
                        aria-pressed={wsFilter === 'all'}
                      >
                        All
                      </button>
                      <button
                        className={`ws-filter-btn ${wsFilter === 'received' ? 'active' : ''} received-btn`}
                        onClick={() => setWsFilter('received')}
                        aria-pressed={wsFilter === 'received'}
                      >
                        Received
                      </button>
                      <button
                        className={`ws-filter-btn ${wsFilter === 'sent' ? 'active' : ''} sent-btn`}
                        onClick={() => setWsFilter('sent')}
                        aria-pressed={wsFilter === 'sent'}
                      >
                        Sent
                      </button>
                    </div>

              <span className="label">Request ID:</span>
              <span className="value">{log.requestId}</span>
            </div>
            <div className="detail-group">
              <span className="label">Received At:</span>
              <span className="value">{new Date(timestamp).toLocaleString()}</span>
            </div>
            <div className="detail-group">
              <span className="label">Sent At:</span>
              <span className="value">{log.responseSent?.sentAt ? new Date(log.responseSent.sentAt).toLocaleString() : 'N/A'}</span>
            </div>
            {log.connectionId && (
              <div className="detail-group">
                <span className="label">Connection ID:</span>
                <span className="value">{log.connectionId}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LogEntry
