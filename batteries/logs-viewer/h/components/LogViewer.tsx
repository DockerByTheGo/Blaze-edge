import React from 'react';
import type { Log } from '@blazyts/blazy-edge';
import { LogEntry } from './LogEntry';
import './LogViewer.css';

interface LogViewerProps {
  logs: Log[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="logs-empty">
        <p>No logs to display</p>
      </div>
    );
  }

  return (
    <div className="logs-viewer">
      <div className="logs-header">
        <div className="log-column log-time">Time</div>
        <div className="log-column log-protocol">Protocol</div>
        <div className="log-column log-method">Method</div>
        <div className="log-column log-path">Path</div>
        <div className="log-column log-status">Status</div>
        <div className="log-column log-duration">Duration</div>
      </div>

      <div className="logs-list">
        {logs.map((log, index) => (
          <LogEntry key={`${log.timestamp}-${index}`} log={log} />
        ))}
      </div>
    </div>
  );
};
