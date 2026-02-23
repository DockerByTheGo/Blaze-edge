/**
 * Example: Core Integration for Automatic Request Logging
 *
 * This shows how to modify the Blazy core to automatically log all requests
 * using the CoreLoggerIntegration
 */

import { LoggerService, ConsoleLogSaver, CoreLoggerIntegration } from '@blazy/edge/plugins/logger';
import { treeRouteFinder } from '@blazy/edge/route-finders';
import { Path } from '@blazyts/backend-lib/src/core/server/router/utils/path/Path';
import type { RouteTree } from '@blazyts/backend-lib/src/core/server/router/types';

/**
 * Modified core.listen() method to include logging
 * This is pseudocode showing the integration points
 */
export function setupCoreWithLogging(app: any) {
  const logger = new LoggerService(new ConsoleLogSaver());
  const logIntegration = new CoreLoggerIntegration(logger);

  // Override or wrap the listen method
  const originalListen = app.listen.bind(app);

  app.listen = function (port: number = 3000) {
    const server = Bun.serve({
      port,
      fetch: async (req: Request) => {
        try {
          const url = new URL(req.url);
          const pathname = url.pathname;

          // ========================================================================
          // HTTP REQUEST HANDLING WITH LOGGING
          // ========================================================================

          const headers: Record<string, string> = {};
          req.headers.forEach((v, k) => (headers[k] = v));

          let body: any = {};
          const contentType = req.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            try {
              body = await req.json();
            } catch {
              body = {};
            }
          }

          const startTime = Date.now();

          // Try to find the route using treeRouteFinder
          const handlerOptional = treeRouteFinder(app.routes, new Path(pathname));

          if (handlerOptional.isSome()) {
            // ROUTE FOUND - Log with response data
            const routeHandlers = handlerOptional.unpack();
            const method = req.method; // 'GET', 'POST', etc.
            const handler = routeHandlers[method];

            if (handler) {
              try {
                const response = await handler.handleRequest({
                  url: pathname,
                  body,
                  verb: method,
                  headers,
                });

                const responseTime = Date.now() - startTime;

                // Log found route with response data
                await logIntegration.logFoundRoute({
                  path: pathname,
                  protocol: 'http',
                  method: method,
                  requestData: body,
                  responseData: CoreLoggerIntegration.extractResponseData(response),
                  statusCode: CoreLoggerIntegration.extractStatusCode(response),
                  headers: headers,
                  responseTime,
                });

                if (response instanceof Response) return response;
                return new Response(JSON.stringify(response), {
                  headers: { "content-type": "application/json" },
                });
              } catch (error) {
                const responseTime = Date.now() - startTime;

                // Log error in route handling
                await logIntegration.logFoundRoute({
                  path: pathname,
                  protocol: 'http',
                  method: method,
                  requestData: body,
                  responseData: undefined,
                  statusCode: 500,
                  headers: headers,
                  responseTime,
                  error: error as Error,
                });

                return new Response(JSON.stringify({ error: String(error) }), {
                  status: 500,
                  headers: { "content-type": "application/json" },
                });
              }
            }
          } else {
            // ROUTE NOT FOUND - Log 404
            const responseTime = Date.now() - startTime;

            await logIntegration.logNotFoundRoute({
              path: pathname,
              protocol: 'http',
              method: req.method,
              requestData: body,
              headers: headers,
              responseTime,
              error: 'Route not found',
            });

            return new Response(JSON.stringify({ error: "Not found" }), {
              status: 404,
              headers: { "content-type": "application/json" },
            });
          }
        } catch (e) {
          console.error("Server error:", e);
          return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },

      // ========================================================================
      // WEBSOCKET HANDLING WITH LOGGING
      // ========================================================================

      websocket: {
        data: {} as any,
        open: (ws) => {
          const connectionId = crypto.randomUUID();
          ws.data = {
            connectionId,
            pathname: new URL(ws.url).pathname,
            startTime: Date.now(),
          };
          console.log("WebSocket connected:", connectionId);
        },

        message: async (ws, message) => {
          const startTime = Date.now();
          const pathname = ws.data.pathname;
          const parsedMessage = JSON.parse(message.toString());

          // Try to find the WebSocket handler
          const handlerOptional = treeRouteFinder(app.routes, new Path(pathname));

          if (handlerOptional.isSome()) {
            const routeHandlers = handlerOptional.unpack();
            const wsHandler = routeHandlers.ws;

            if (wsHandler) {
              try {
                const response = wsHandler.handleRequest(parsedMessage);
                const responseTime = Date.now() - startTime;

                // Log successful WebSocket message handling
                await logIntegration.logFoundRoute({
                  path: pathname,
                  protocol: 'ws',
                  requestData: parsedMessage,
                  responseData: response,
                  headers: {},
                  responseTime,
                });

                return;
              } catch (error) {
                const responseTime = Date.now() - startTime;

                // Log WebSocket error
                await logIntegration.logFoundRoute({
                  path: pathname,
                  protocol: 'ws',
                  requestData: parsedMessage,
                  responseData: undefined,
                  statusCode: 500,
                  headers: {},
                  responseTime,
                  error: error as Error,
                });
              }
            }
          } else {
            const responseTime = Date.now() - startTime;

            // Log WebSocket route not found
            await logIntegration.logNotFoundRoute({
              path: pathname,
              protocol: 'ws',
              requestData: parsedMessage,
              headers: {},
              responseTime,
              error: 'WebSocket route not found',
            });
          }
        },

        close: async (ws) => {
          // Optionally log WebSocket closure
          console.log("WebSocket closed:", ws.data.connectionId);
        },
      },
    });

    return server;
  };

  return { server: app, logger, logIntegration };
}

/**
 * Usage example:
 *
 * const app = Blazy.create();
 *
 * // Add your routes...
 * app.http({
 *   path: '/api/users',
 *   handler: (ctx) => ({ users: [] })
 * });
 *
 * // Setup logging
 * setupCoreWithLogging(app);
 *
 * // Now all requests (found and not found) will be logged automatically
 * const server = app.listen(3000);
 */
