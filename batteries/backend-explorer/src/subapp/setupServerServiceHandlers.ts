import { JsonResponse, type BlazyDefault } from "@blazyts/blazy-edge";

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

export function setupServerHandlers<TApp extends BlazyDefault>(app: TApp) {
  // Add a catch-all POST route pattern for services
  // Pattern: /{serviceName}/{methodName}
  return app.post({
    path: "/:serviceName/:methodName",
    handeler: async (ctx: ServiceRouteContext) => {
      try {
        const { serviceName, methodName } = ctx.params || {};
        const args = ctx.body ?? {};

        console.log("de")

        if (!serviceName || !methodName) {
          return {
            success: false,
            error: "Service name and method name are required",
          };
        }

        console.log("ddd,",serviceName, ctx.services)
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

        console.log("res", result)

        return ({
          success: true,
          data: result,
        });
      }
      catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });
}
