import React, { useState } from 'react';
import type { Log } from '@blazyts/blazy-edge';
import './LogEntry.css';

interface LogEntryProps {
  log: Log;
}

export const LogEntry: React.FC<LogEntryProps> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status?: number) => {
    if (!status) return 'unknown';
    if (status < 300) return 'success';
    if (status < 400) return 'redirect';
    if (status < 500) return 'client-error';
    return 'server-error';
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol.toLowerCase()) {
      case 'http':
        return '🌐';
      case 'https':
        return '🔒';
      case 'ws':
        return '⚡';
      default:
        return '📡';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="log-entry">
      <div
        className="log-entry-main"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
      >
        <div className="log-column log-time">{formatTime(log.timestamp)}</div>
        <div className="log-column log-protocol">
          {getProtocolIcon(log.protocol)} {log.protocol}
        </div>
        <div className="log-column log-method">{log.method || '-'}</div>
        <div className="log-column log-path">{log.path}</div>
        <div className={`log-column log-status status-${getStatusColor(log.statusCode)}`}>
          {log.statusCode || '-'}
        </div>
        <div className="log-column log-duration">{log.responseTime || 0}ms</div>
      </div>

      {expanded && (
        <div className="log-entry-details">
          <div className="details-section">
            <h4>Request Data</h4>
            <pre>{JSON.stringify(log.requestData, null, 2)}</pre>
          </div>

          {log.responseData && (
            <div className="details-section">
              <h4>Response Data</h4>
              <pre>{JSON.stringify(log.responseData, null, 2)}</pre>
            </div>
          )}

          {log.error && (
            <div className="details-section error">
              <h4>Error</h4>
              <pre>{log.error}</pre>
            </div>
          )}

          <div className="details-section metadata">
            <h4>Metadata</h4>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="label">Timestamp:</span>
                <span className="value">{new Date(log.timestamp).toISOString()}</span>
              </div>
              <div className="metadata-item">
                <span className="label">Response Time:</span>
                <span className="value">{log.responseTime}ms</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
