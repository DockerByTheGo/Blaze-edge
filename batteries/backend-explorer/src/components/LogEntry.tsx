import React, { useMemo, useState, useEffect } from 'react'
import type { Log } from '@blazyts/blazy-edge'
import { MockLogsRepo } from '../logs-repo/MockLogsRepo'

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
    if (statusCode < 300) return 'bg-emerald-500 text-white'
    if (statusCode < 400) return 'bg-cyan-500 text-white'
    if (statusCode < 500) return 'bg-amber-500 text-white'
    return 'bg-rose-500 text-white'
  }

  const getMethodClass = (method: string) => {
    const classes: Record<string, string> = {
      GET: 'bg-emerald-500 text-white',
      POST: 'bg-sky-500 text-white',
      PUT: 'bg-amber-500 text-white',
      DELETE: 'bg-rose-500 text-white',
      PATCH: 'bg-violet-500 text-white',
    }
    return classes[method] || 'bg-gray-500 text-white'
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  // Helper for new Log type
  const statusCode = (log ).responseSent?.statusCode || 200
  const method = (log as any).requestReceived?.method || 'WS'
  const path = (log as any).requestReceived?.path || ''
  const protocol = (log as any).requestReceived?.headers?.Upgrade === 'websocket' ? 'WS' : 'HTTP'
  const timestamp = (log as any).requestReceived?.recievedAt || new Date()
  const duration = (log as any).responseSent && (log as any).requestReceived ?
    new Date((log as any).responseSent.sentAt).getTime() - new Date((log as any).requestReceived.recievedAt).getTime() : 0

  return (
    <div className="border border-slate-700 rounded-md mb-3 overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-slate-800 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <span className={`min-w-[60px] px-3 py-1.5 rounded text-white font-semibold text-sm text-center ${getStatusClass(statusCode)}`}>{statusCode}</span>
        <span className={`min-w-[50px] px-2 py-1 rounded text-xs font-semibold text-white ${getMethodClass(method)}`}>{method}</span>
        <span className="flex-1 font-mono text-sm text-slate-100 break-all">{path}</span>
        <span className="text-xs text-slate-400 px-2 bg-slate-900 rounded">{protocol}</span>
        <span className="text-sm text-slate-400 whitespace-nowrap">{new Date(timestamp).toLocaleTimeString()}</span>
        <span className="font-semibold text-sky-400 min-w-[64px] text-right">{formatDuration(duration)}</span>
        <span className="text-slate-400">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="bg-slate-900 border-t border-slate-700 p-4">
          <div className="mb-4">
            <h4 className="text-sky-400 font-semibold mb-2">Request</h4>
            <div className="flex gap-4 mb-2 items-start">
              <span className="min-w-[150px] font-medium text-slate-400">Method:</span>
              <span className="flex-1 text-slate-100 break-words">{method}</span>
            </div>
            <div className="flex gap-4 mb-2 items-start">
              <span className="min-w-[150px] font-medium text-slate-400">Path:</span>
              <span className="flex-1 text-slate-100 break-words">{path}</span>
            </div>
            {log.requestReceived?.headers && (
              <div className="flex gap-4 mb-2 items-start">
                <span className="min-w-[150px] font-medium text-slate-400">Headers:</span>
                <code className="block w-full bg-slate-800 p-3 rounded border border-slate-700 text-sm overflow-x-auto mt-2">{JSON.stringify(log.requestReceived.headers, null, 2)}</code>
              </div>
            )}
            {log.requestReceived?.body && (
              <div className="flex gap-4 mb-2 items-start">
                <span className="min-w-[150px] font-medium text-slate-400">Body:</span>
                <code className="block w-full bg-slate-800 p-3 rounded border border-slate-700 text-sm overflow-x-auto mt-2">{JSON.stringify(log.requestReceived.body, null, 2)}</code>
              </div>
            )}
          </div>

          <div className="mb-4">
            <h4 className="text-sky-400 font-semibold mb-2">Response</h4>
            <div className="flex gap-4 mb-2 items-start">
              <span className="min-w-[150px] font-medium text-slate-400">Status Code:</span>
              <span className={`flex-1 ${getStatusClass(statusCode)} font-semibold`}>{statusCode}</span>
            </div>
            <div className="flex gap-4 mb-2 items-start">
              <span className="min-w-[150px] font-medium text-slate-400">Duration:</span>
              <span className="flex-1 text-slate-100">{formatDuration(duration)}</span>
            </div>
            {log.responseSent?.body && (
              <div className="flex gap-4 mb-2 items-start">
                <span className="min-w-[150px] font-medium text-slate-400">Body:</span>
                <code className="block w-full bg-slate-800 p-3 rounded border border-slate-700 text-sm overflow-x-auto mt-2">{JSON.stringify(log.responseSent.body, null, 2)}</code>
              </div>
            )}
          </div>

          {log.connectionId && wsMessages && (
            <div className="mb-4">
              <h4 className="text-sky-400 font-semibold mb-2">WebSocket Messages ({wsMessages.length})</h4>

              <div className="flex gap-2 mb-3">
                <button
                  className={`px-3 py-1 rounded border border-slate-700 text-sm font-semibold bg-transparent text-slate-200 ${wsFilter === 'all' ? 'bg-slate-800 border-slate-600' : ''}`}
                  onClick={() => setWsFilter('all')}
                  aria-pressed={wsFilter === 'all'}
                >
                  All
                </button>
                <button
                  className={`px-3 py-1 rounded border border-slate-700 text-sm font-semibold bg-transparent text-slate-200 ${wsFilter === 'received' ? 'ring-4 ring-sky-400/10 border-sky-400' : ''}`}
                  onClick={() => setWsFilter('received')}
                  aria-pressed={wsFilter === 'received'}
                >
                  Received
                </button>
                <button
                  className={`px-3 py-1 rounded border border-slate-700 text-sm font-semibold bg-transparent text-slate-200 ${wsFilter === 'sent' ? 'ring-4 ring-emerald-400/10 border-emerald-400' : ''}`}
                  onClick={() => setWsFilter('sent')}
                  aria-pressed={wsFilter === 'sent'}
                >
                  Sent
                </button>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded p-3 max-h-96 overflow-y-auto">
                {(filteredWsMessages || [])
                .filter(msg => msg.type === wsFilter || wsFilter === 'all')
                .map((msg, idx) => (
                  <div key={`${msg.timestamp.toString()}-${idx}`} className={`p-3 mb-3 rounded border-l-4 bg-slate-900 border-slate-700 ${msg.type === 'sent' ? 'border-l-4 border-emerald-500 bg-emerald-500/5' : 'border-l-4 border-sky-500 bg-sky-500/5'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 ${msg.type === 'sent' ? 'text-emerald-500 bg-emerald-500/10' : 'text-sky-500 bg-sky-500/10'}`}>
                        {msg.type === 'sent' ? ' Sent ' : ' Received '}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {msg.data && Object.keys(msg.data).length > 0 && (
                      <code className="block bg-slate-800 p-2 rounded border border-slate-700 text-sm overflow-x-auto mt-2">{JSON.stringify(msg.data, null, 2)}</code>
                    )}
                  </div>
                ))}
                {filteredWsMessages && filteredWsMessages.length === 0 && (
                  <div className="p-2 text-slate-400 text-center">No messages match the filter.</div>
                )}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-sky-400 font-semibold mb-2">Metadata</h4>
            <div className="flex gap-4 mb-2 items-start">

              <span className="min-w-[150px] font-medium text-slate-400">Request ID:</span>
              <span className="flex-1 text-slate-100 break-words">{log.requestId}</span>
            </div>
            <div className="flex gap-4 mb-2 items-start">
              <span className="min-w-[150px] font-medium text-slate-400">Received At:</span>
              <span className="flex-1 text-slate-100">{new Date(timestamp).toLocaleString()}</span>
            </div>
            <div className="flex gap-4 mb-2 items-start">
              <span className="min-w-[150px] font-medium text-slate-400">Sent At:</span>
              <span className="flex-1 text-slate-100">{log.responseSent?.sentAt ? new Date(log.responseSent.sentAt).toLocaleString() : 'N/A'}</span>
            </div>
            {log.connectionId && (
              <div className="flex gap-4 mb-2 items-start">
                <span className="min-w-[150px] font-medium text-slate-400">Connection ID:</span>
                <span className="flex-1 text-slate-100">{log.connectionId}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

}

export default LogEntry
