import type { URecord } from "@blazyts/better-standard-library";
import type { FC } from "react";

import type { MethodDescriptor, RunEntry, ServiceViewState } from "./types";

import { styles } from "../styles";
import { Collapsible } from "./Collapsible";
import { ServiceMEthodView } from "./ServiceMethodView";

type ServiceViewProps = {
  componentProps: {
    service: URecord;
    serviceName: string;
  };
  parentState: ServiceViewState;
};

function isCallable(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

function getMethodEntries(service: URecord): Array<[string, MethodDescriptor]> {
  return Object.entries(service)
    .filter(([name]) => name !== "config")
    .map(([name, value]) => {
      if (isCallable(value)) {
        const methodWithMetadata = value as ((args: unknown) => unknown) & {
          runs?: RunEntry[];
          schema?: unknown;
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

export const ServiceView: FC<ServiceViewProps> = ({
  componentProps: { service, serviceName },
  parentState,
}) => {
  const {
    localRunsByMethod,
  } = parentState;

  const methods = getMethodEntries(service);

  return (
    <Collapsible
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
              const runs = [
                ...(localRunsByMethod.state[methodKey] ?? []),
                ...method.runs,
              ];

              return (
                <ServiceMEthodView
                  key={methodKey}
                  parentState={parentState}
                  props={{
                    method,
                    methodKey,
                    methodName,
                    runs,
                    serviceName,
                  }}
                />
              );
            })
          )}
    </Collapsible>
  );
};
