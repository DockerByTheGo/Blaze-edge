import { HtmlPageResponse, HtmlResponse, type Blazy, type BlazyDefault } from "@blazyts/blazy-edge"
import { LogsView } from "../ui/pages/logs"
import { renderToString } from "react-dom/server";
import { ServicesUi } from "../ui/pages/services";
import type { LogsRepo } from "../logs-repo";
import { MockLogsRepo } from "../logs-repo/MockLogsRepo";

type ServiceRouteContext = {
  params?: {
    serviceName?: string;
    methodName?: string;
  };
  body?: unknown;
  services?: Record<string, Record<string, unknown>>;
};

type ServiceMethod = (args: unknown) => unknown | Promise<unknown>;

function isServiceMethod(value: unknown): value is ServiceMethod {
  return typeof value === "function";
}

function setupServerHandlers<TApp extends BlazyDefault>(app: TApp) {
  // Add a catch-all POST route pattern for services
  // Pattern: /{serviceName}/{methodName}
  return app.post({
    path: "/:serviceName/:methodName",
    handeler: async (ctx: ServiceRouteContext) => {
      try {
        const { serviceName, methodName } = ctx.params || {};
        const args = ctx.body ?? {};

        if (!serviceName || !methodName) {
          return {
            success: false,
            error: "Service name and method name are required",
          };
        }
        
        // Access services from context (they're spread into ctx.services)
        if (!ctx.services || !ctx.services[serviceName]) {
          return {
            success: false,
            error: `Service "${serviceName}" not found`,
          };
        }
        
        const service = ctx.services[serviceName];
        const method = service[methodName];
        
        // Skip if trying to access serviceManager or config
        if (serviceName === "serviceManager" || methodName === "config") {
          return {
            success: false,
            error: `Cannot access "${serviceName}.${methodName}" directly`,
          };
        }
        
        if (!isServiceMethod(method)) {
          return {
            success: false,
            error: `Method "${methodName}" not found on service "${serviceName}"`,
          };
        }
        
        // Call the service method
        const result = await method(args);
        
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });
  
}


function setupUi(app: BlazyDefault, logsRepo: LogsRepo){
    return app
    .get({
      path: "/logs",
      handler: ctx => {
        return HtmlPageResponse(renderToString(<LogsView app={ctx} logsRepo={logsRepo} />))
      },
      args: undefined 
    })
    .get({
      "path": "/services",
      handler: ctx => {
        console.log("dd",ctx.services)
        return HtmlPageResponse( renderToString(<ServicesUi services={ctx.services} />))},
      args: undefined
    })
}

export const backendUi = (
  app: BlazyDefault,
  logsRepo: LogsRepo = new MockLogsRepo(),
) => setupUi(setupServerHandlers(app), logsRepo) 
