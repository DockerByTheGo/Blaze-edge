import type { BlazyDefault, Log } from "@blazyts/blazy-edge";
import { type FC, useEffect, useMemo, useState } from "react";
import type { LogsRepo } from "../../../../logs-repo";
import LogFilters from "../../../components/LogFilters";
import LogViewer from "../../../components/LogViewer";
import "../../../styles.css";

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
  } catch {
    return "";
  }
}

function filterLogs(logs: Log[], filters: FiltersState): Log[] {
  const searchTerm = filters.searchTerm.trim().toLowerCase();
  const path = filters.path.trim().toLowerCase();

  return logs.filter((log) => {
    const methodMatches =
      filters.method.length === 0 || getLogMethod(log) === filters.method;
    const protocolMatches =
      filters.protocol.length === 0 || getLogProtocol(log) === filters.protocol;
    const statusMatches =
      filters.statusCode.length === 0 ||
      getLogStatusCode(log) === filters.statusCode;
    const pathMatches =
      path.length === 0 || getLogPath(log).toLowerCase().includes(path);
    const searchMatches =
      searchTerm.length === 0 || formatLogForSearch(log).includes(searchTerm);

    return (
      methodMatches &&
      protocolMatches &&
      statusMatches &&
      pathMatches &&
      searchMatches
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
    const refreshLogs = () => setRefreshCount((current) => current + 1);

    window.addEventListener(logsRefreshEventName, refreshLogs);

    return () => {
      window.removeEventListener(logsRefreshEventName, refreshLogs);
    };
  }, []);

  return (
    <main className="backend-explorer-page">
      <section className="backend-explorer-shell backend-explorer-stack">
        <header className="backend-explorer-header">
          <p className="backend-explorer-eyebrow">
            Backend Explorer
          </p>
          <div className="backend-explorer-title-row">
            <div>
              <h1 className="backend-explorer-title">Logs</h1>
              <p className="backend-explorer-description">
                Review request, response, and websocket activity.
              </p>
            </div>
            <span className="backend-explorer-count">
              {filteredLogs.length} of {sourceLogs.length} logs
            </span>
          </div>
          <div className="backend-explorer-status">{status}</div>
        </header>

        <LogFilters filters={filters} onFiltersChange={setFilters} />
        <LogViewer logs={filteredLogs} />
      </section>
    </main>
  );
};
