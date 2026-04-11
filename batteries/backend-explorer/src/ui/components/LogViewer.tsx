import type { FC } from 'react'
import type { Log } from '@blazyts/blazy-edge'
import LogEntry from './LogEntry'

interface LogViewerProps {
  logs: Log[]
}

const LogViewer: FC<LogViewerProps> = ({ logs }) => {
  return (
    <div className="log-viewer">
      {logs.length === 0 ? (
        <div className="log-viewer-empty">
          <p>No logs found</p>
          <p className="log-viewer-hint">Try adjusting your filters or refreshing the page</p>
        </div>
      ) : (
        <div className="log-viewer-entries">
          {logs.map(log => (
            <LogEntry key={log.requestId} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

export default LogViewer
