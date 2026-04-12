import type { URecord } from "@blazyts/better-standard-library";

import { useObjectState } from "@blazytsts/utils_react-utils";

import type { RunEntry } from "../components/types";

import { ServiceView } from "../components/ServiceView";
import { styles } from "../styles";

type ServiceMap = Record<string, URecord>;

type ServicesUiProps = {
  services: ServiceMap;
};

const serviceRunScript = `
document.addEventListener("click", async event => {
  if (event.defaultPrevented) {
    return;
  }

  const button = event.target.closest("[data-service-run-button]");
  if (!button) {
    return;
  }

  event.preventDefault();

  const methodKey = button.dataset.methodKey;
  const endpoint = button.dataset.serviceRunEndpoint;
  const argsInput = document.querySelector(\`[data-service-args="\${methodKey}"]\`);
  const status = document.querySelector(\`[data-service-status="\${methodKey}"]\`);
  const responseOutput = document.querySelector(\`[data-service-response="\${methodKey}"]\`);

  if (!methodKey || !endpoint) {
    return;
  }

  const setStatus = value => {
    if (status) {
      status.textContent = value;
    }
  };
  const setResponse = value => {
    if (responseOutput) {
      responseOutput.textContent = value;
    }
  };

  try {
    const rawArgs = argsInput?.value?.trim() ?? "";
    const parsedArgs = rawArgs.length === 0 ? {} : JSON.parse(rawArgs);

    setStatus("Running...");

    const fetchResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedArgs),
    });
    const contentType = fetchResponse.headers.get("content-type") ?? "";
    const result = contentType.includes("application/json")
      ? await fetchResponse.json()
      : await fetchResponse.text();
    const formattedResult = typeof result === "string"
      ? result
      : JSON.stringify(result, null, 2);

    if (!fetchResponse.ok) {
      throw new Error(formattedResult);
    }

    setStatus("Success");
    setResponse(formattedResult);
    window.dispatchEvent(new Event("backend-explorer:service-action"));
  }
  catch (error) {
    setStatus("Error");
    setResponse(error instanceof Error ? error.message : String(error));
  }
});
`;

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
      <script dangerouslySetInnerHTML={{ __html: serviceRunScript }} />
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
