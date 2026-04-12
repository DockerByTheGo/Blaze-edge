import type { BlazyDefault, Log } from "@blazyts/blazy-edge";
import type { CSSProperties, FC } from "react";

import { useEffect, useMemo, useState } from "react";

import type { LogsRepo } from "../../../../logs-repo";

import LogFilters from "../../../components/LogFilters";
import LogViewer from "../../../components/LogViewer";

export const logsRefreshEventName = "backend-explorer:service-action";

type FiltersState = {
  method: string;
  path: string;
  statusCode: string;
  protocol: string;
  searchTerm: string;
};

type LogsViewProps = {
  app: BlazyDefault;
  logsRepo: LogsRepo;
  action?: unknown;
};

const initialFilters: FiltersState = {
  method: "",
  path: "",
  statusCode: "",
  protocol: "",
  searchTerm: "",
};

const styles: Record<string, CSSProperties> = {
  page: {
    background: "#020617",
    boxSizing: "border-box",
    color: "#f1f5f9",
    minHeight: "100vh",
    padding: "32px 24px",
  },
  shell: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    margin: "0 auto",
    maxWidth: 1152,
    width: "100%",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  eyebrow: {
    color: "#7dd3fc",
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase",
  },
  titleRow: {
    alignItems: "flex-end",
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: 600,
    margin: 0,
  },
  description: {
    color: "#94a3b8",
    fontSize: 14,
    margin: "8px 0 0",
  },
  count: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#cbd5e1",
    fontSize: 14,
    padding: "8px 12px",
  },
  status: {
    color: "#64748b",
    fontSize: 12,
  },
};

function getLogMethod(log: Log): string {
  return String((log.requestReceived as { method?: unknown }).method ?? "");
}

function getLogPath(log: Log): string {
  return String((log.requestReceived as { path?: unknown }).path ?? "");
}

function getLogStatusCode(log: Log): string {
  return String((log.responseSent as { statusCode?: unknown }).statusCode ?? "");
}

function getLogProtocol(log: Log): string {
  const headers = (log.requestReceived as { headers?: Record<string, unknown> })
    .headers;
  const upgrade = String(headers?.Upgrade ?? headers?.upgrade ?? "");

  return upgrade.toLowerCase() === "websocket" ? "WS" : "HTTP";
}

function formatLogForSearch(log: Log): string {
  try {
    return JSON.stringify(log).toLowerCase();
  }
  catch {
    return "";
  }
}

function filterLogs(logs: Log[], filters: FiltersState): Log[] {
  const searchTerm = filters.searchTerm.trim().toLowerCase();
  const path = filters.path.trim().toLowerCase();

  return logs.filter((log) => {
    const methodMatches
      = filters.method.length === 0 || getLogMethod(log) === filters.method;
    const protocolMatches
      = filters.protocol.length === 0 || getLogProtocol(log) === filters.protocol;
    const statusMatches
      = filters.statusCode.length === 0
        || getLogStatusCode(log) === filters.statusCode;
    const pathMatches
      = path.length === 0 || getLogPath(log).toLowerCase().includes(path);
    const searchMatches
      = searchTerm.length === 0 || formatLogForSearch(log).includes(searchTerm);

    return (
      methodMatches
      && protocolMatches
      && statusMatches
      && pathMatches
      && searchMatches
    );
  });
}

export const LogsView: FC<LogsViewProps> = ({
  logsRepo,
  action,
}) => {
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [logs, setLogs] = useState<Log[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [status, setStatus] = useState("Idle");
  const sourceLogs = logs;
  const filteredLogs = useMemo(
    () => filterLogs(sourceLogs, filters),
    [filters, sourceLogs],
  );

  useEffect(() => {
    let isActive = true;

    logsRepo
      .getAllLogs()
      .then((nextLogs) => {
        if (!isActive) {
          return;
        }

        setLogs(nextLogs);
        setStatus("Loaded");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setStatus(error instanceof Error ? error.message : String(error));
      });

    return () => {
      isActive = false;
    };
  }, [action, logsRepo, refreshCount]);

  useEffect(() => {
    const refreshLogs = () => setRefreshCount(current => current + 1);

    window.addEventListener(logsRefreshEventName, refreshLogs);

    return () => {
      window.removeEventListener(logsRefreshEventName, refreshLogs);
    };
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <p style={styles.eyebrow}>
            Backend Explorer
          </p>
          <div style={styles.titleRow}>
            <div>
              <h1 style={styles.title}>Logs</h1>
              <p style={styles.description}>
                Review request, response, and websocket activity.
              </p>
            </div>
            <span style={styles.count}>
              {filteredLogs.length}
              {" "}
              of
              {sourceLogs.length}
              {" "}
              logs
            </span>
          </div>
          <div style={styles.status}>{status}</div>
        </header>

        <LogFilters filters={filters} onFiltersChange={setFilters} />
        <LogViewer logs={filteredLogs} />
      </section>
    </main>
  );
};
