import React from 'react'
import type { Log } from '@blazyts/blazy-edge'
import LogEntry from './LogEntry'

interface LogViewerProps {
  logs: Log[]
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  return (
    <div style={styles.container}>
      {logs.length === 0 ? (
        <div style={styles.noLogs}>
          <p>📭 No logs found</p>
          <p style={styles.hint}>Try adjusting your filters or refreshing the page</p>
        </div>
      ) : (
        <div style={styles.entries}>
          {logs.map(log => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, any> = {
  container: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, overflow: 'hidden' },
  entries: { maxHeight: 800, overflowY: 'auto', padding: 16 },
  noLogs: { padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' },
  hint: { fontSize: 14, opacity: 0.85 }
}

export default LogViewer
