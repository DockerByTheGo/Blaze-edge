import type { Blazy } from "src/app/core";
import "reflect-metadata";
import type { URecord } from "@blazyts/better-standard-library";

/**
 * Adds service routes to the Blazy app.
 * For each service in the Blazy instance, creates a POST route at /{serviceName}/{methodName}
 * that maps the request body to the method arguments and returns the response.
 * 
 * Services are accessed from ctx.services which contains:
 * - Direct service access: ctx.services.serviceName
 * - Service manager access: ctx.services.serviceManager
 * 
 * @param app - The Blazy application instance
 * @returns The modified Blazy app with service routes added
 */
export function addServices<TApp extends Blazy<any, any, any>>(app: TApp): TApp {
  let modifiedApp = app;
  
  // Add a catch-all POST route pattern for services
  // Pattern: /{serviceName}/{methodName}
  modifiedApp = modifiedApp.post({
    path: "/:serviceName/:methodName",
    handeler: async (ctx: any) => {
      try {
        const { serviceName, methodName } = ctx.params || {};
        const args = ctx.body ?? {};
        
        // Access services from context (they're spread into ctx.services)
        if (!ctx.services || !ctx.services[serviceName]) {
          return {
            success: false,
            error: `Service "${serviceName}" not found`,
          };
        }
        
        const service = ctx.services[serviceName];
        
        // Skip if trying to access serviceManager or config
        if (serviceName === "serviceManager" || methodName === "config") {
          return {
            success: false,
            error: `Cannot access "${serviceName}.${methodName}" directly`,
          };
        }
        
        if (typeof service[methodName] !== "function") {
          return {
            success: false,
            error: `Method "${methodName}" not found on service "${serviceName}"`,
          };
        }
        
        // Call the service method
        const result = await service[methodName](args);
        
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
  }) as TApp;
  
  return modifiedApp;
}


