import { useState } from "react";

import { logsRefreshEventName } from "../../logs/page/main";
import { Collapsible } from "../components";
import type { URecord } from "@blazyts/better-standard-library";
import "../../../styles.css";

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

const panelClassName = "panel";

const sectionClassName = "service-section";



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
  } catch {
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

      const descriptor = value
      const callable =
        descriptor && isCallable(descriptor.call) ? descriptor.call : undefined;
      const schema =
        descriptor?.schema ??
        (callable && "schema" in callable
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
      setStatusByMethod((current) => ({
        ...current,
        [methodKey]: "This method is not invokable from the UI.",
      }));
      return;
    }

    setStatusByMethod((current) => ({
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

      setResponseByMethod((current) => ({
        ...current,
        [methodKey]: formatValue(result),
      }));
      setStatusByMethod((current) => ({
        ...current,
        [methodKey]: "Success",
      }));
      setLocalRunsByMethod((current) => ({
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setResponseByMethod((current) => ({
        ...current,
        [methodKey]: message,
      }));
      setStatusByMethod((current) => ({
        ...current,
        [methodKey]: "Error",
      }));
      setLocalRunsByMethod((current) => ({
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
    } finally {
      notifyLogsAction();
    }
  }

  return (
    <section className="services-root">
      <header className="services-header">
        <h2 className="services-title">Services</h2>
        <p className="services-description">
          Inspect each service, invoke methods, and review captured runs.
        </p>
      </header>

      {serviceEntries.length === 0 ? (
        <div className="panel panel-empty">
          No services are currently available.
        </div>
      ) : (
        serviceEntries.map(([serviceName, service]) => {
          const methods = getMethodEntries(service);

          return (
            <Collapsible
              key={serviceName}
              className={panelClassName}
              defaultOpen
              meta={`${methods.length} methods`}
              title={serviceName}
            >
                {methods.length === 0 ? (
                  <div className={sectionClassName}>
                    No callable methods were found for this service.
                  </div>
                ) : (
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
                        className="method-panel"
                        meta={`${runs.length} runs`}
                        title={methodName}
                      >
                          {method.schema !== undefined && (
                            <details className={sectionClassName}>
                              <summary className="section-summary">
                                Schema
                              </summary>
                              <pre className="service-pre">
                                {formatValue(method.schema)}
                              </pre>
                            </details>
                          )}

                          <div className={sectionClassName}>
                            <div className="services-inline-header">
                              <h3 className="service-subtitle">Test</h3>
                              <button
                                className="run-button"
                                disabled={!method.invokable}
                                onClick={() =>
                                  void invokeMethod(
                                    serviceName,
                                    methodName,
                                    methodKey,
                                    method,
                                  )
                                }
                                type="button"
                              >
                                Run
                              </button>
                            </div>

                            <label className="field-label">
                              Args
                            </label>
                            <div className="form-caption">
                              POST {endpoint}
                            </div>
                            <textarea
                              className="service-textarea"
                              onChange={(event) =>
                                setArgsByMethod((current) => ({
                                  ...current,
                                  [methodKey]: event.target.value,
                                }))
                              }
                              placeholder={'{\n  "example": true\n}'}
                              spellCheck={false}
                              value={argsByMethod[methodKey] ?? ""}
                            />

                            <div className="response-header">
                              <label className="field-label">
                                Response
                              </label>
                              <span className="response-status">
                                {statusByMethod[methodKey] ?? "Idle"}
                              </span>
                            </div>
                            <pre className="response-pre">
                              {responseByMethod[methodKey] ?? "Run the method to see a response."}
                            </pre>
                          </div>

                          <details className={sectionClassName}>
                            <summary className="section-summary">
                              Runs
                            </summary>

                            <div className="runs-stack">
                              {runs.length === 0 ? (
                                <div className="run-empty">
                                  No runs recorded yet.
                                </div>
                              ) : (
                                runs.map((run, index) => (
                                  <details
                                    key={`${methodKey}-run-${index}`}
                                    className="run-panel"
                                  >
                                    <summary className="run-summary">
                                      {getRunTimestamp(run, index)}
                                    </summary>
                                    <div className="run-body backend-explorer-run-body">
                                      <div>
                                        <div className="field-label">
                                          Args
                                        </div>
                                        <pre className="run-pre">
                                          {formatValue(run.args)}
                                        </pre>
                                      </div>

                                      {"error" in run && run.error !== undefined ? (
                                        <div>
                                          <div className="field-label error-label">
                                            Error
                                          </div>
                                          <pre className="run-pre error-pre">
                                            {formatValue(run.error)}
                                          </pre>
                                        </div>
                                      ) : (
                                        <div>
                                          <div className="field-label">
                                            Response
                                          </div>
                                          <pre className="run-pre">
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
