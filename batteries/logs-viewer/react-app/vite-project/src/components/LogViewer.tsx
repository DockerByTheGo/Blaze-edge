import React from 'react'
import type { Log } from '@blazyts/blazy-edge'
import LogEntry from './LogEntry'
import './LogViewer.css'

interface LogViewerProps {
  logs: Log[]
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  return (
    <div className="log-viewer">
      {logs.length === 0 ? (
        <div className="no-logs">
          <p>📭 No logs found</p>
          <p className="hint">Try adjusting your filters or refreshing the page</p>
        </div>
      ) : (
        <div className="log-entries">
          {logs.map(log => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

export default LogViewer
