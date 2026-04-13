import type { Log } from "@blazyts/blazy-edge";
import type { CSSProperties, FC } from "react";

import type { LogsRepo, WebSocketLogMessage } from "../../modules/logs-repo";

import LogEntry from "./LogEntry";

type LogViewerProps = {
  logs: Log[];
  logsRepo: LogsRepo;
  websocketMessagesByConnectionId: Record<string, WebSocketLogMessage[]>;
};

const styles: Record<string, CSSProperties> = {
  viewer: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    boxSizing: "border-box",
    overflow: "hidden",
  },
  empty: {
    color: "#94a3b8",
    padding: "48px 16px",
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    opacity: 0.85,
  },
  entries: {
    maxHeight: 800,
    overflowY: "auto",
    padding: 16,
  },
};

const LogViewer: FC<LogViewerProps> = ({
  logs,
  logsRepo,
  websocketMessagesByConnectionId,
}) => {
  return (
    <div style={styles.viewer}>
      {logs.length === 0
        ? (
            <div style={styles.empty}>
              <p>No logs found</p>
              <p style={styles.hint}>Try adjusting your filters or refreshing the page</p>
            </div>
          )
        : (
            <div style={styles.entries}>
              {logs.map(log => (
                <LogEntry
                  key={log.requestId}
                  initialWebSocketMessages={log.connectionId
                    ? websocketMessagesByConnectionId[log.connectionId] ?? null
                    : null}
                  log={log}
                  logsRepo={logsRepo}
                />
              ))}
            </div>
          )}
    </div>
  );
};

export default LogViewer;
