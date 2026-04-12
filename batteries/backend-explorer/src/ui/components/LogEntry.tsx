import type { Log } from "@blazyts/blazy-edge";
import type { CSSProperties, FC } from "react";

import { useEffect, useMemo, useState } from "react";

import { MockLogsRepo } from "../../logs-repo/MockLogsRepo";

type LogEntryProps = {
  log: Log;
};

type WebSocketMessage = {
  type: "sent" | "received";
  data: unknown;
  timestamp: Date;
};

type RequestDetails = {
  method?: string;
  path?: string;
  headers?: Record<string, unknown>;
  body?: unknown;
  recievedAt?: string | number | Date;
};

type ResponseDetails = {
  statusCode?: number;
  body?: unknown;
  sentAt?: string | number | Date;
};

const monospaceFont = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";

const styles: Record<string, CSSProperties> = {
  entry: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    boxSizing: "border-box",
    marginBottom: 12,
    overflow: "hidden",
  },
  summary: {
    alignItems: "center",
    background: "#1e293b",
    cursor: "pointer",
    display: "flex",
    gap: 16,
    padding: 12,
  },
  badge: {
    borderRadius: 4,
    color: "#fff",
    display: "inline-block",
    fontWeight: 600,
    textAlign: "center",
  },
  statusBadge: {
    fontSize: 14,
    minWidth: 60,
    padding: "6px 12px",
  },
  methodBadge: {
    fontSize: 12,
    minWidth: 50,
    padding: "4px 8px",
  },
  path: {
    color: "#f1f5f9",
    flex: 1,
    fontFamily: monospaceFont,
    fontSize: 14,
    overflowWrap: "anywhere",
  },
  protocol: {
    background: "#0f172a",
    borderRadius: 4,
    color: "#94a3b8",
    fontSize: 12,
    padding: "0 8px",
  },
  time: {
    color: "#94a3b8",
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  duration: {
    color: "#38bdf8",
    fontWeight: 600,
    minWidth: 64,
    textAlign: "right",
  },
  chevron: {
    color: "#94a3b8",
  },
  details: {
    background: "#0f172a",
    borderTop: "1px solid #334155",
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailHeading: {
    color: "#38bdf8",
    fontWeight: 600,
    margin: "0 0 8px",
  },
  detailRow: {
    alignItems: "flex-start",
    display: "flex",
    gap: 16,
    marginBottom: 8,
  },
  detailLabel: {
    color: "#94a3b8",
    fontWeight: 500,
    minWidth: 150,
  },
  detailValue: {
    color: "#f1f5f9",
    flex: 1,
    overflowWrap: "anywhere",
  },
  codeBlock: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 4,
    color: "#e2e8f0",
    display: "block",
    fontSize: 14,
    marginTop: 8,
    overflowX: "auto",
    padding: 12,
    width: "100%",
  },
  wsFilterList: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
  },
  wsFilterButton: {
    background: "transparent",
    border: "1px solid #334155",
    borderRadius: 4,
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    padding: "4px 12px",
  },
  wsFilterAllActive: {
    background: "#1e293b",
    borderColor: "#475569",
  },
  wsFilterReceivedActive: {
    borderColor: "#38bdf8",
    boxShadow: "0 0 0 4px rgb(56 189 248 / 10%)",
  },
  wsFilterSentActive: {
    borderColor: "#34d399",
    boxShadow: "0 0 0 4px rgb(52 211 153 / 10%)",
  },
  wsMessageList: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 4,
    maxHeight: 384,
    overflowY: "auto",
    padding: 12,
  },
  wsMessage: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderLeftWidth: 4,
    borderRadius: 4,
    marginBottom: 12,
    padding: 12,
  },
  wsMessageSent: {
    background: "rgb(16 185 129 / 5%)",
    borderLeftColor: "#10b981",
  },
  wsMessageReceived: {
    background: "rgb(14 165 233 / 5%)",
    borderLeftColor: "#0ea5e9",
  },
  wsMessageHeader: {
    alignItems: "center",
    display: "flex",
    gap: 16,
    justifyContent: "space-between",
  },
  wsMessageType: {
    background: "#1e293b",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    padding: "2px 8px",
  },
  wsMessageTypeSent: {
    background: "rgb(16 185 129 / 10%)",
    color: "#10b981",
  },
  wsMessageTypeReceived: {
    background: "rgb(14 165 233 / 10%)",
    color: "#0ea5e9",
  },
  mutedCopy: {
    color: "#94a3b8",
  },
  emptyState: {
    color: "#94a3b8",
    padding: 8,
    textAlign: "center",
  },
};

function getStatusBackground(statusCode: number) {
  if (statusCode < 300)
    return "#10b981";
  if (statusCode < 400)
    return "#06b6d4";
  if (statusCode < 500)
    return "#f59e0b";
  return "#f43f5e";
}

function getStatusColor(statusCode: number) {
  if (statusCode < 300)
    return "#10b981";
  if (statusCode < 400)
    return "#06b6d4";
  if (statusCode < 500)
    return "#f59e0b";
  return "#f43f5e";
}

function getMethodBackground(method: string) {
  const backgrounds: Record<string, string> = {
    GET: "#10b981",
    POST: "#0ea5e9",
    PUT: "#f59e0b",
    DELETE: "#f43f5e",
    PATCH: "#8b5cf6",
  };

  return backgrounds[method] || "#6b7280";
}

const LogEntry: FC<LogEntryProps> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const [wsMessages, setWsMessages] = useState<WebSocketMessage[] | null>(null);
  const [wsFilter, setWsFilter] = useState<"all" | "received" | "sent">("all");
  useEffect(() => {
    if (log.connectionId) {
      const repo = new MockLogsRepo();
      repo.getWebSocketMessages(log.connectionId).then(setWsMessages);
    }
  }, [log.connectionId]);

  const filteredWsMessages = useMemo(() => {
    if (!wsMessages)
      return null;
    if (wsFilter === "all")
      return wsMessages;
    return wsMessages.filter(m => m.type === wsFilter);
  }, [wsMessages, wsFilter]);

  const formatDuration = (ms: number) => {
    if (ms < 1000)
      return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const requestReceived = log.requestReceived as RequestDetails;
  const responseSent = log.responseSent as ResponseDetails;
  const statusCode = responseSent.statusCode || 200;
  const method = requestReceived.method || "WS";
  const path = requestReceived.path || "";
  const protocol = requestReceived.headers?.Upgrade === "websocket" ? "WS" : "HTTP";
  const timestamp = requestReceived.recievedAt || new Date();
  const duration = responseSent.sentAt && requestReceived.recievedAt
    ? new Date(responseSent.sentAt).getTime() - new Date(requestReceived.recievedAt).getTime()
    : 0;

  return (
    <div style={styles.entry}>
      <div style={styles.summary} onClick={() => setExpanded(!expanded)}>
        <span style={{ ...styles.badge, ...styles.statusBadge, background: getStatusBackground(statusCode) }}>{statusCode}</span>
        <span style={{ ...styles.badge, ...styles.methodBadge, background: getMethodBackground(method) }}>{method}</span>
        <span style={styles.path}>{path}</span>
        <span style={styles.protocol}>{protocol}</span>
        <span style={styles.time}>{new Date(timestamp).toLocaleTimeString()}</span>
        <span style={styles.duration}>{formatDuration(duration)}</span>
        <span style={styles.chevron}>{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && (
        <div style={styles.details}>
          <div style={styles.detailSection}>
            <h4 style={styles.detailHeading}>Request</h4>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Method:</span>
              <span style={styles.detailValue}>{method}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Path:</span>
              <span style={styles.detailValue}>{path}</span>
            </div>
            {log.requestReceived?.headers && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Headers:</span>
                <code style={styles.codeBlock}>{JSON.stringify(log.requestReceived.headers, null, 2)}</code>
              </div>
            )}
            {log.requestReceived?.body && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Body:</span>
                <code style={styles.codeBlock}>{JSON.stringify(log.requestReceived.body, null, 2)}</code>
              </div>
            )}
          </div>

          <div style={styles.detailSection}>
            <h4 style={styles.detailHeading}>Response</h4>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Status Code:</span>
              <span style={{ ...styles.detailValue, color: getStatusColor(statusCode), fontWeight: 600 }}>{statusCode}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Duration:</span>
              <span style={styles.detailValue}>{formatDuration(duration)}</span>
            </div>
            {log.responseSent?.body && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Body:</span>
                <code style={styles.codeBlock}>{JSON.stringify(log.responseSent.body, null, 2)}</code>
              </div>
            )}
          </div>

          {log.connectionId && wsMessages && (
            <div style={styles.detailSection}>
              <h4 style={styles.detailHeading}>
                WebSocket Messages (
                {wsMessages.length}
                )
              </h4>

              <div style={styles.wsFilterList}>
                <button
                  style={{ ...styles.wsFilterButton, ...(wsFilter === "all" ? styles.wsFilterAllActive : {}) }}
                  onClick={() => setWsFilter("all")}
                  aria-pressed={wsFilter === "all"}
                >
                  All
                </button>
                <button
                  style={{ ...styles.wsFilterButton, ...(wsFilter === "received" ? styles.wsFilterReceivedActive : {}) }}
                  onClick={() => setWsFilter("received")}
                  aria-pressed={wsFilter === "received"}
                >
                  Received
                </button>
                <button
                  style={{ ...styles.wsFilterButton, ...(wsFilter === "sent" ? styles.wsFilterSentActive : {}) }}
                  onClick={() => setWsFilter("sent")}
                  aria-pressed={wsFilter === "sent"}
                >
                  Sent
                </button>
              </div>

              <div style={styles.wsMessageList}>
                {(filteredWsMessages || [])
                  .filter(msg => msg.type === wsFilter || wsFilter === "all")
                  .map((msg, idx) => (
                    <div key={`${msg.timestamp.toString()}-${idx}`} style={{ ...styles.wsMessage, ...(msg.type === "sent" ? styles.wsMessageSent : styles.wsMessageReceived) }}>
                      <div style={styles.wsMessageHeader}>
                        <span style={{ ...styles.wsMessageType, ...(msg.type === "sent" ? styles.wsMessageTypeSent : styles.wsMessageTypeReceived) }}>
                          {msg.type === "sent" ? " Sent " : " Received "}
                        </span>
                        <span style={styles.mutedCopy}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {msg.data && Object.keys(msg.data).length > 0 && (
                        <code style={styles.codeBlock}>{JSON.stringify(msg.data, null, 2)}</code>
                      )}
                    </div>
                  ))}
                {filteredWsMessages && filteredWsMessages.length === 0 && (
                  <div style={styles.emptyState}>No messages match the filter.</div>
                )}
              </div>
            </div>
          )}

          <div style={styles.detailSection}>
            <h4 style={styles.detailHeading}>Metadata</h4>
            <div style={styles.detailRow}>

              <span style={styles.detailLabel}>Request ID:</span>
              <span style={styles.detailValue}>{log.requestId}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Received At:</span>
              <span style={styles.detailValue}>{new Date(timestamp).toLocaleString()}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Sent At:</span>
              <span style={styles.detailValue}>{log.responseSent?.sentAt ? new Date(log.responseSent.sentAt).toLocaleString() : "N/A"}</span>
            </div>
            {log.connectionId && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Connection ID:</span>
                <span style={styles.detailValue}>{log.connectionId}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogEntry;
