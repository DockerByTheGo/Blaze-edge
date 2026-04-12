import type { URecord } from "@blazyts/better-standard-library";

import { useObjectState } from "@blazytsts/utils_react-utils";

import type { RunEntry } from "../components/types";

import { ServiceView } from "../components/ServiceView";
import { styles } from "../styles";

type ServiceMap = Record<string, URecord>;

type ServicesUiProps = {
  services: ServiceMap;
};

export function ServicesUi({ services }: ServicesUiProps) {
  const argsByMethod = useObjectState<Record<string, string>>({});
  const localRunsByMethod = useObjectState<Record<string, RunEntry[]>>({});
  const responseByMethod = useObjectState<Record<string, string>>({});
  const statusByMethod = useObjectState<Record<string, string>>({});

  const serviceEntries = Object.entries(services);
  const parentState = {
    argsByMethod,
    localRunsByMethod,
    responseByMethod,
    statusByMethod,
  };

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
              return (
                <ServiceView
                  key={serviceName}
                  componentProps={{ service, serviceName }}
                  parentState={parentState}
                />
              );
            })
          )}
    </section>
  );
}
