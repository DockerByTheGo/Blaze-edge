import type { BlazyDefault, Log } from "@blazyts/blazy-edge";
import type { FC } from "react";

import { useObjectState } from "@blazytsts/utils_react-utils";
import { useEffect, useMemo } from "react";

import type { LogsRepo, WebSocketLogMessage } from "../../../../modules/logs-repo";

import LogFilters from "../../../components/LogFilters";
import LogViewer from "../../../components/LogViewer";
import { styles } from "../styles";

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
  initialLogs?: Log[];
  logsRepo: LogsRepo;
  websocketMessagesByConnectionId?: Record<string, WebSocketLogMessage[]>;
  action?: unknown;
};

const initialFilters: FiltersState = {
  method: "",
  path: "",
  statusCode: "",
  protocol: "",
  searchTerm: "",
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
  initialLogs = [],
  logsRepo,
  websocketMessagesByConnectionId = {},
  action,
}) => {
  const filters = useObjectState<FiltersState>(initialFilters);
  const logs = useObjectState<Log[]>(initialLogs);
  const refreshCount = useObjectState(0);
  const status = useObjectState(initialLogs.length > 0 ? "Loaded" : "Idle");
  const sourceLogs = logs.state;
  const filteredLogs = useMemo(
    () => filterLogs(sourceLogs, filters.state),
    [filters.state, sourceLogs],
  );

  useEffect(() => {
    let isActive = true;

    logsRepo
      .getAllLogs()
      .then((nextLogs) => {
        if (!isActive) {
          return;
        }

        logs.set(nextLogs);
        status.set("Loaded");
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        status.set(error instanceof Error ? error.message : String(error));
      });

    return () => {
      isActive = false;
    };
  }, [action, logsRepo, refreshCount.state]);

  useEffect(() => {
    const refreshLogs = () => refreshCount.set(current => current + 1);

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
          <div style={styles.status}>{status.state}</div>
        </header>

        <LogFilters filters={filters.state} onFiltersChange={filters.set} />
        <LogViewer
          logs={filteredLogs}
          logsRepo={logsRepo}
          websocketMessagesByConnectionId={websocketMessagesByConnectionId}
        />
      </section>
    </main>
  );
};
