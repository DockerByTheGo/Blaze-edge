import type React from "react";

import type { MethodDescriptor, RunEntry, ServiceViewState } from "./types";

import { logsRefreshEventName } from "../../logs";
import { Collapsible } from "../../../components/Collapsible";
import { styles } from "../styles";
import { formatValue } from "./utils";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function notifyLogsAction() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(logsRefreshEventName));
}

function tryParseJson(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return {};
  }

  return JSON.parse(trimmed);
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

export const ServiceMEthodView: React.FC<{
  props: {
    methodKey: string;
    methodName: string;
    runs: RunEntry[];
    method: MethodDescriptor;
    serviceName: string;
  };
  parentState: ServiceViewState;
}> = ({
  props: { methodKey, method, methodName, runs, serviceName },
  parentState: { statusByMethod, argsByMethod, responseByMethod, localRunsByMethod },
}) => {
  const endpoint = `/${encodeURIComponent(serviceName)}/${encodeURIComponent(methodName)}`;
  async function invokeMethod(
    methodKey: string,
  ) {
    if (!method.invokable) {
      statusByMethod.set(current => ({
        ...current,
        [methodKey]: "This method is not invokable from the UI.",
      }));
      return;
    }

    statusByMethod.set(current => ({
      ...current,
      [methodKey]: "Running...",
    }));

    try {
      const parsedArgs = tryParseJson(argsByMethod.state[methodKey] ?? "");

      if (!isBrowser()) {
        throw new Error("Service calls can only run in the browser.");
      }

      const response = await fetch(endpoint, {
        body: JSON.stringify(parsedArgs),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const contentType = response.headers.get("content-type") ?? "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(formatValue(result));
      }

      responseByMethod.set(current => ({
        ...current,
        [methodKey]: formatValue(result),
      }));
      statusByMethod.set(current => ({
        ...current,
        [methodKey]: "Success",
      }));
      localRunsByMethod.set(current => ({
        ...current,
        [methodKey]: [
          {
            args: parsedArgs,
            createdAt: new Date().toISOString(),
            result,
          },
          ...(current[methodKey] ?? []),
        ],
      }));
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      responseByMethod.set(current => ({
        ...current,
        [methodKey]: message,
      }));
      statusByMethod.set(current => ({
        ...current,
        [methodKey]: "Error",
      }));
      localRunsByMethod.set(current => ({
        ...current,
        [methodKey]: [
          {
            args: argsByMethod.state[methodKey] ?? "",
            createdAt: new Date().toISOString(),
            error: message,
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
            data-method-key={methodKey}
            data-service-run-button="true"
            data-service-run-endpoint={endpoint}
            disabled={!method.invokable}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void invokeMethod(
                methodKey,
              );
            }}
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
          data-service-args={methodKey}
          onChange={event =>
            argsByMethod.set(current => ({
              ...current,
              [methodKey]: event.target.value,
            }))}
          placeholder={"{\n  \"example\": true\n}"}
          spellCheck={false}
          style={styles.textarea}
          value={argsByMethod.state[methodKey] ?? ""}
        />

        <div style={styles.responseHeader}>
          <label style={styles.fieldLabel}>
            Response
          </label>
          <span data-service-status={methodKey} style={styles.responseStatus}>
            {statusByMethod.state[methodKey] ?? "Idle"}
          </span>
        </div>
        <pre data-service-response={methodKey} style={{ ...styles.pre, ...styles.responsePre }}>
          {responseByMethod.state[methodKey] ?? "Run the method to see a response."}
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
};
