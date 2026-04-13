import type { Log } from "@blazyts/blazy-edge";
import type { CSSProperties, FC } from "react";

import { useObjectState } from "@blazytsts/utils_react-utils";
import { useEffect, useMemo } from "react";

import type { LogsRepo, WebSocketLogMessage } from "../../modules/logs-repo";
import { Collapsible } from "./Collapsible";
import { monospaceFont } from "../styles";

type LogEntryProps = {
  log: Log;
  logsRepo: LogsRepo;
  initialWebSocketMessages: WebSocketLogMessage[] | null;
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

type HookRunLog = {
  name?: string;
  startTime?: string | number | Date;
  endTime?: string | number | Date;
  got?: unknown;
  returned?: unknown;
};

type HooksLog = Record<string, HookRunLog[] | undefined>;

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
  hookCategory: {
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: 8,
    overflow: "hidden",
  },
  hookRun: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    overflow: "hidden",
  },
  hookStack: {
    display: "grid",
    gap: 8,
  },
  hookEmpty: {
    color: "#94a3b8",
    padding: 4,
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

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  }
  catch {
    return String(value);
  }
}

function formatTimestamp(value: HookRunLog["startTime"]): string {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function formatRunDuration(startTime: HookRunLog["startTime"], endTime: HookRunLog["endTime"]): string {
  if (!startTime || !endTime) {
    return "N/A";
  }

  const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
  if (Number.isNaN(duration)) {
    return "N/A";
  }

  if (duration < 1000) {
    return `${duration}ms`;
  }

  return `${(duration / 1000).toFixed(2)}s`;
}

function getHookEntries(hooks: unknown): Array<[string, HookRunLog[]]> {
  return Object.entries((hooks ?? {}) as HooksLog)
    .map(([hookType, runs]) => [
      hookType,
      Array.isArray(runs) ? runs : [],
    ]);
}

const LogEntry: FC<LogEntryProps> = ({
  initialWebSocketMessages,
  log,
  logsRepo,
}) => {
  const wsMessages = useObjectState<WebSocketLogMessage[] | null>(initialWebSocketMessages);
  const wsFilter = useObjectState<"all" | "received" | "sent">("all");
  useEffect(() => {
    if (!initialWebSocketMessages && log.connectionId && logsRepo.getWebSocketMessages) {
      logsRepo.getWebSocketMessages(log.connectionId).then(wsMessages.set);
    }
  }, [initialWebSocketMessages, log.connectionId, logsRepo]);

  const filteredWsMessages = useMemo(() => {
    if (!wsMessages.state)
      return null;
    if (wsFilter.state === "all")
      return wsMessages.state;
    return wsMessages.state.filter(m => m.type === wsFilter.state);
  }, [wsMessages.state, wsFilter.state]);

  const formatDuration = (ms: number) => {
    if (ms < 1000)
      return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const requestReceived = log.requestReceived as RequestDetails;
  const responseSent = log.responseSent as ResponseDetails;
  const hookEntries = getHookEntries(log.hooks);
  const statusCode = responseSent.statusCode || 200;
  const method = requestReceived.method || "WS";
  const path = requestReceived.path || "";
  const protocol = requestReceived.headers?.Upgrade === "websocket" ? "WS" : "HTTP";
  const timestamp = requestReceived.recievedAt || new Date();
  const duration = responseSent.sentAt && requestReceived.recievedAt
    ? new Date(responseSent.sentAt).getTime() - new Date(requestReceived.recievedAt).getTime()
    : 0;

  return (
    <details style={styles.entry}>
      <summary style={styles.summary}>
        <span style={{ ...styles.badge, ...styles.statusBadge, background: getStatusBackground(statusCode) }}>{statusCode}</span>
        <span style={{ ...styles.badge, ...styles.methodBadge, background: getMethodBackground(method) }}>{method}</span>
        <span style={styles.path}>{path}</span>
        <span style={styles.protocol}>{protocol}</span>
        <span style={styles.time}>{new Date(timestamp).toLocaleTimeString()}</span>
        <span style={styles.duration}>{formatDuration(duration)}</span>
      </summary>

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

          {hookEntries.length > 0 && (
            <div style={styles.detailSection}>
              <h4 style={styles.detailHeading}>Hooks</h4>
              <div style={styles.hookStack}>
                {hookEntries.map(([hookType, hookRuns]) => (
                  <Collapsible
                    key={hookType}
                    meta={`${hookRuns.length} ran`}
                    style={styles.hookCategory}
                    title={hookType}
                  >
                    {hookRuns.length === 0
                      ? (
                          <div style={styles.hookEmpty}>
                            No hook runs recorded for this category.
                          </div>
                        )
                      : hookRuns.map((hookRun, index) => (
                          <Collapsible
                            key={`${hookType}-${hookRun.name ?? "hook"}-${index}`}
                            meta={formatRunDuration(hookRun.startTime, hookRun.endTime)}
                            style={styles.hookRun}
                            title={hookRun.name ?? `Hook ${index + 1}`}
                          >
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Started:</span>
                              <span style={styles.detailValue}>{formatTimestamp(hookRun.startTime)}</span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Ended:</span>
                              <span style={styles.detailValue}>{formatTimestamp(hookRun.endTime)}</span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Got:</span>
                              <code style={styles.codeBlock}>{formatValue(hookRun.got ?? {})}</code>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Returned:</span>
                              <code style={styles.codeBlock}>{formatValue(hookRun.returned ?? {})}</code>
                            </div>
                          </Collapsible>
                        ))}
                  </Collapsible>
                ))}
              </div>
            </div>
          )}

          {log.connectionId && wsMessages.state && (
            <div style={styles.detailSection}>
              <h4 style={styles.detailHeading}>
                WebSocket Messages (
                {wsMessages.state.length}
                )
              </h4>

              <div style={styles.wsFilterList}>
                <button
                  style={{ ...styles.wsFilterButton, ...(wsFilter.state === "all" ? styles.wsFilterAllActive : {}) }}
                  onClick={() => wsFilter.set("all")}
                  aria-pressed={wsFilter.state === "all"}
                >
                  All
                </button>
                <button
                  style={{ ...styles.wsFilterButton, ...(wsFilter.state === "received" ? styles.wsFilterReceivedActive : {}) }}
                  onClick={() => wsFilter.set("received")}
                  aria-pressed={wsFilter.state === "received"}
                >
                  Received
                </button>
                <button
                  style={{ ...styles.wsFilterButton, ...(wsFilter.state === "sent" ? styles.wsFilterSentActive : {}) }}
                  onClick={() => wsFilter.set("sent")}
                  aria-pressed={wsFilter.state === "sent"}
                >
                  Sent
                </button>
              </div>

              <div style={styles.wsMessageList}>
                {(filteredWsMessages || [])
                  .filter(msg => msg.type === wsFilter.state || wsFilter.state === "all")
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
    </details>
  );
};

export default LogEntry;
