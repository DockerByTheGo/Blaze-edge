import type { URecord } from "@blazyts/better-standard-library";
import type { CSSProperties } from "react";

import { useState } from "react";

import { logsRefreshEventName } from "../../logs/page/main";
import { Collapsible } from "../components";

type ServiceMap = Record<string, unknown>;
type RunEntry = {
  args?: unknown;
  result?: unknown;
  response?: unknown;
  error?: unknown;
  createdAt?: string | number | Date;
  timestamp?: string | number | Date;
};

type ServicesUiProps = {
  services: ServiceMap;
};

type MethodDescriptor = {
  invokable: boolean;
  schema?: unknown;
  runs: RunEntry[];
};

const monospaceFont = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";

const styles: Record<string, CSSProperties> = {
  root: {
    boxSizing: "border-box",
    color: "#f1f5f9",
    display: "flex",
    flexDirection: "column",
    fontSize: 14,
    gap: 16,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: 600,
    margin: 0,
  },
  description: {
    color: "#94a3b8",
    margin: 0,
  },
  panel: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#f1f5f9",
  },
  panelEmpty: {
    color: "#94a3b8",
    padding: 20,
  },
  section: {
    background: "rgb(2 6 23 / 70%)",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "12px 16px",
  },
  methodPanel: {
    background: "rgb(15 23 42 / 80%)",
    border: "1px solid #334155",
    borderRadius: 8,
  },
  sectionSummary: {
    color: "#e2e8f0",
    cursor: "pointer",
    fontWeight: 500,
  },
  pre: {
    background: "#020617",
    borderRadius: 6,
    color: "#cbd5e1",
    fontSize: 12,
    overflowX: "auto",
    padding: 12,
  },
  servicePre: {
    marginTop: 12,
  },
  inlineHeader: {
    alignItems: "center",
    display: "flex",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  subtitle: {
    color: "#e2e8f0",
    fontWeight: 500,
    margin: 0,
  },
  runButton: {
    background: "#0ea5e9",
    border: 0,
    borderRadius: 6,
    color: "#020617",
    cursor: "pointer",
    fontWeight: 500,
    padding: "8px 12px",
  },
  runButtonDisabled: {
    background: "#334155",
    color: "#94a3b8",
    cursor: "not-allowed",
  },
  fieldLabel: {
    color: "#94a3b8",
    display: "block",
    fontSize: 12,
    letterSpacing: "0.08em",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  formCaption: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 8,
  },
  textarea: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#f1f5f9",
    font: "inherit",
    fontFamily: monospaceFont,
    fontSize: 12,
    marginBottom: 12,
    minHeight: 112,
    outline: 0,
    padding: 10,
    resize: "vertical",
    width: "100%",
  },
  responseHeader: {
    alignItems: "center",
    display: "flex",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  responseStatus: {
    color: "#94a3b8",
    fontSize: 12,
  },
  responsePre: {
    border: "1px solid #334155",
    minHeight: 112,
  },
  runsStack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 12,
  },
  runEmpty: {
    border: "1px dashed #334155",
    borderRadius: 6,
    color: "#94a3b8",
    padding: "16px 12px",
  },
  runPanel: {
    background: "rgb(2 6 23 / 80%)",
    border: "1px solid #334155",
    borderRadius: 8,
  },
  runSummary: {
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: 14,
    padding: "8px 12px",
  },
  runBody: {
    borderTop: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    padding: 12,
  },
  errorLabel: {
    color: "#fda4af",
  },
  errorPre: {
    background: "rgb(76 5 25 / 40%)",
    color: "#fecdd3",
  },
};

function isCallable(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function notifyLogsAction() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(logsRefreshEventName));
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined) {
    return "undefined";
  }

  try {
    return JSON.stringify(value, null, 2);
  }
  catch {
    return String(value);
  }
}

function tryParseJson(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return {};
  }

  return JSON.parse(trimmed);
}

function getMethodEntries(service: URecord): Array<[string, MethodDescriptor]> {
  return Object.entries(service)
    .filter(([name]) => name !== "config")
    .map(([name, value]) => {
      if (isCallable(value)) {
        const methodWithMetadata = value as ((args: unknown) => unknown) & {
          schema?: unknown;
          runs?: RunEntry[];
        };

        return [
          name,
          {
            invokable: true,
            schema: methodWithMetadata.schema,
            runs: Array.isArray(methodWithMetadata.runs)
              ? methodWithMetadata.runs
              : [],
          },
        ] satisfies [string, MethodDescriptor];
      }

      const descriptor = value;
      const callable
        = descriptor && isCallable(descriptor.call) ? descriptor.call : undefined;
      const schema
        = descriptor?.schema
          ?? (callable && "schema" in callable
            ? (callable as { schema?: unknown }).schema
            : undefined);
      const runsValue = descriptor?.runs;

      return [
        name,
        {
          invokable: callable !== undefined,
          schema,
          runs: Array.isArray(runsValue) ? (runsValue as RunEntry[]) : [],
        },
      ] satisfies [string, MethodDescriptor];
    });
}

function getRunTimestamp(run: RunEntry, index: number): string {
  const rawValue = run.createdAt ?? run.timestamp;
  if (!rawValue) {
    return `Run ${index + 1}`;
  }

  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) {
    return String(rawValue);
  }

  return date.toLocaleString();
}

export function ServicesUi({ services }: ServicesUiProps) {
  const [argsByMethod, setArgsByMethod] = useState<Record<string, string>>({});
  const [responseByMethod, setResponseByMethod] = useState<Record<string, string>>(
    {},
  );
  const [statusByMethod, setStatusByMethod] = useState<Record<string, string>>({});
  const [localRunsByMethod, setLocalRunsByMethod] = useState<
    Record<string, RunEntry[]>
  >({});

  const serviceEntries = Object.entries(services);

  async function invokeMethod(
    serviceName: string,
    methodName: string,
    methodKey: string,
    method: MethodDescriptor,
  ) {
    if (!method.invokable) {
      setStatusByMethod(current => ({
        ...current,
        [methodKey]: "This method is not invokable from the UI.",
      }));
      return;
    }

    setStatusByMethod(current => ({
      ...current,
      [methodKey]: "Running...",
    }));

    try {
      const parsedArgs = tryParseJson(argsByMethod[methodKey] ?? "");
      const endpoint = `/${encodeURIComponent(serviceName)}/${encodeURIComponent(methodName)}`;

      if (!isBrowser()) {
        throw new Error("Service calls can only run in the browser.");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedArgs),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(formatValue(result));
      }

      setResponseByMethod(current => ({
        ...current,
        [methodKey]: formatValue(result),
      }));
      setStatusByMethod(current => ({
        ...current,
        [methodKey]: "Success",
      }));
      setLocalRunsByMethod(current => ({
        ...current,
        [methodKey]: [
          {
            args: parsedArgs,
            result,
            createdAt: new Date().toISOString(),
          },
          ...(current[methodKey] ?? []),
        ],
      }));
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setResponseByMethod(current => ({
        ...current,
        [methodKey]: message,
      }));
      setStatusByMethod(current => ({
        ...current,
        [methodKey]: "Error",
      }));
      setLocalRunsByMethod(current => ({
        ...current,
        [methodKey]: [
          {
            args: argsByMethod[methodKey] ?? "",
            error: message,
            createdAt: new Date().toISOString(),
          },
          ...(current[methodKey] ?? []),
        ],
      }));
    }
    finally {
      notifyLogsAction();
    }
  }

  return (
    <section style={styles.root}>
      <header style={styles.header}>
        <h2 style={styles.title}>Services</h2>
        <p style={styles.description}>
          Inspect each service, invoke methods, and review captured runs.
        </p>
      </header>

      {serviceEntries.length === 0
        ? (
            <div style={{ ...styles.panel, ...styles.panelEmpty }}>
              No services are currently available.
            </div>
          )
        : (
            serviceEntries.map(([serviceName, service]) => {
              const methods = getMethodEntries(service);

              return (
                <Collapsible
                  key={serviceName}
                  defaultOpen
                  meta={`${methods.length} methods`}
                  style={styles.panel}
                  title={serviceName}
                >
                  {methods.length === 0
                    ? (
                        <div style={styles.section}>
                          No callable methods were found for this service.
                        </div>
                      )
                    : (
                        methods.map(([methodName, method]) => {
                          const methodKey = `${serviceName}.${methodName}`;
                          const endpoint = `/${serviceName}/${methodName}`;
                          const runs = [
                            ...(localRunsByMethod[methodKey] ?? []),
                            ...method.runs,
                          ];

                          return (
                            <Collapsible
                              key={methodKey}
                              meta={`${runs.length} runs`}
                              style={styles.methodPanel}
                              title={methodName}
                            >
                              {method.schema !== undefined && (
                                <details style={styles.section}>
                                  <summary style={styles.sectionSummary}>
                                    Schema
                                  </summary>
                                  <pre style={{ ...styles.pre, ...styles.servicePre }}>
                                    {formatValue(method.schema)}
                                  </pre>
                                </details>
                              )}

                              <div style={styles.section}>
                                <div style={styles.inlineHeader}>
                                  <h3 style={styles.subtitle}>Test</h3>
                                  <button
                                    disabled={!method.invokable}
                                    onClick={() =>
                                      void invokeMethod(
                                        serviceName,
                                        methodName,
                                        methodKey,
                                        method,
                                      )}
                                    style={{
                                      ...styles.runButton,
                                      ...(!method.invokable
                                        ? styles.runButtonDisabled
                                        : {}),
                                    }}
                                    type="button"
                                  >
                                    Run
                                  </button>
                                </div>

                                <label style={styles.fieldLabel}>
                                  Args
                                </label>
                                <div style={styles.formCaption}>
                                  POST
                                  {" "}
                                  {endpoint}
                                </div>
                                <textarea
                                  onChange={event =>
                                    setArgsByMethod(current => ({
                                      ...current,
                                      [methodKey]: event.target.value,
                                    }))}
                                  placeholder={"{\n  \"example\": true\n}"}
                                  spellCheck={false}
                                  style={styles.textarea}
                                  value={argsByMethod[methodKey] ?? ""}
                                />

                                <div style={styles.responseHeader}>
                                  <label style={styles.fieldLabel}>
                                    Response
                                  </label>
                                  <span style={styles.responseStatus}>
                                    {statusByMethod[methodKey] ?? "Idle"}
                                  </span>
                                </div>
                                <pre style={{ ...styles.pre, ...styles.responsePre }}>
                                  {responseByMethod[methodKey] ?? "Run the method to see a response."}
                                </pre>
                              </div>

                              <details style={styles.section}>
                                <summary style={styles.sectionSummary}>
                                  Runs
                                </summary>

                                <div style={styles.runsStack}>
                                  {runs.length === 0
                                    ? (
                                        <div style={styles.runEmpty}>
                                          No runs recorded yet.
                                        </div>
                                      )
                                    : (
                                        runs.map((run, index) => (
                                          <details
                                            key={`${methodKey}-run-${index}`}
                                            style={styles.runPanel}
                                          >
                                            <summary style={styles.runSummary}>
                                              {getRunTimestamp(run, index)}
                                            </summary>
                                            <div style={styles.runBody}>
                                              <div>
                                                <div style={styles.fieldLabel}>
                                                  Args
                                                </div>
                                                <pre style={styles.pre}>
                                                  {formatValue(run.args)}
                                                </pre>
                                              </div>

                                              {"error" in run && run.error !== undefined
                                                ? (
                                                    <div>
                                                      <div style={{ ...styles.fieldLabel, ...styles.errorLabel }}>
                                                        Error
                                                      </div>
                                                      <pre style={{ ...styles.pre, ...styles.errorPre }}>
                                                        {formatValue(run.error)}
                                                      </pre>
                                                    </div>
                                                  )
                                                : (
                                                    <div>
                                                      <div style={styles.fieldLabel}>
                                                        Response
                                                      </div>
                                                      <pre style={styles.pre}>
                                                        {formatValue(run.result ?? run.response)}
                                                      </pre>
                                                    </div>
                                                  )}
                                            </div>
                                          </details>
                                        ))
                                      )}
                                </div>
                              </details>
                            </Collapsible>
                          );
                        })
                      )}
                </Collapsible>
              );
            })
          )}
    </section>
  );
}
