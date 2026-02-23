# Blazy Logger Plugin

A protocol-agnostic, type-safe HTTP request logging system that works with all Blazy client handlers (HTTP, WebSocket, gRPC, and custom protocols).

## Features

- ✅ **Protocol-Agnostic**: Works with HTTP, WebSocket, gRPC, and any custom protocol
- ✅ **Type-Safe**: Full TypeScript support with Zod schema validation
- 📝 **Multiple Storage Backends**: Console and SQLite implementations
- 🎯 **Flexible Filtering**: Filter logs by protocol, HTTP method, path, and more
- 📊 **Dashboard UI**: Built-in web dashboard to view and manage logs
- ⚙️ **Configurable**: Customize logging behavior with options
- 🔒 **Safe by Default**: Configurable body size limits and excluded paths
- 🔌 **Handler Integration**: Seamlessly integrates with all client handler types

## Installation

The logger is included in the `plugins/logger` folder.

## Basic Usage

### Method 1: Using Client Handler Data (Recommended)

Automatically log all requests from client handlers:

```typescript
import { LoggerService, ConsoleLogSaver } from '@blazy/edge/plugins/logger';
import { withLogging } from '@blazy/edge/plugins/logger/examples';

const logger = new LoggerService(new ConsoleLogSaver());

// Wrap any handler with logging
const handler = new NormalRouteHandler((ctx) => ({ body: { ok: true } }));
const loggingHandler = withLogging(handler, logger, {
  protocol: 'http',
  path: '/api/users',
  method: 'POST',
});

app.addRoute({
  routeMatcher: new NormalRouting('/api/users'),
  handler: loggingHandler,
  protocol: 'POST',
});

// Logs all requests automatically with protocol detection
```

### Method 2: Manual Logging (Legacy HTTP)

Log requests manually (works for backward compatibility):

```typescript
import { LoggerService, ConsoleLogSaver } from '@blazy/edge/plugins/logger';

const logger = new LoggerService(new ConsoleLogSaver());

// Log HTTP request
await logger.logRequest({
  method: 'GET',
  path: '/api/users',
  statusCode: 200,
  responseTime: 45,
});

// Or use the protocol-agnostic method
await logger.logFromClientHandler({
  protocol: 'http',
  path: '/api/users',
  method: 'GET',
  statusCode: 200,
  startTime: Date.now() - 45,
  endTime: Date.now(),
});
```

## Storage Backends

### Console Logger

Logs requests to the console and stores them in memory.

```typescript
import { ConsoleLogSaver } from '@blazy/edge/plugins/logger';

const saver = new ConsoleLogSaver();
const logger = new LoggerService(saver);

// Output: [2026-02-24T12:34:56.789Z] GET /api/users -> 200 (45ms)
```

### SQLite Logger

Persists logs to a SQLite database (requires Bun runtime).

```typescript
import { SQLiteLogSaver } from '@blazy/edge/plugins/logger';

const saver = new SQLiteLogSaver('./logs.db'); // or ':memory:' for in-memory
const logger = new LoggerService(saver);
```

## Logger Routes

Use `LoggerRoutes` to set up HTTP endpoints for accessing logs:

```typescript
import { LoggerRoutes } from '@blazy/edge/plugins/logger';

const routes = new LoggerRoutes(logger);

// In your Blazy app:
app.addRoute({
  routeMatcher: new NormalRouting('/logger/logs'),
  handler: new NormalRouteHandler(() => routes.getLogs()),
  protocol: 'GET',
});

app.addRoute({
  routeMatcher: new NormalRouting('/logger/stats'),
  handler: new NormalRouteHandler(() => routes.getStats()),
  protocol: 'GET',
});

app.addRoute({
  routeMatcher: new NormalRouting('/logger/ui'),
  handler: new NormalRouteHandler(() => routes.getDashboardHTML()),
  protocol: 'GET',
});

app.addRoute({
  routeMatcher: new NormalRouting('/logger/clear'),
  handler: new NormalRouteHandler(() => routes.clearLogs()),
  protocol: 'POST',
});
```

## API Endpoints

### GET `/logger/logs`

Retrieve logs with optional filtering and pagination.

**Query Parameters:**
- `limit` (number, default: 100, max: 1000)
- `offset` (number, default: 0)
- `method` (GET | POST | PUT | DELETE | PATCH)
- `path` (string)

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "timestamp": 1708770896789,
      "method": "GET",
      "path": "/api/users",
      "statusCode": 200,
      "responseTime": 45,
      "requestBody": {...},
      "responseBody": {...},
      "headers": {...},
      "error": null
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

### GET `/logger/logs/:id`

Retrieve a specific log by ID.

### GET `/logger/stats`

Get logging statistics and configuration.

**Response:**
```json
{
  "totalLogs": 150,
  "config": {
    "logBodies": true,
    "logHeaders": false,
    "excludePaths": ["/health", "/metrics"],
    "maxBodySize": 102400
  }
}
```

### POST `/logger/clear`

Clear all logs (be careful!).

### GET `/logger/ui`

Access the interactive web dashboard to view logs.

## Configuration

```typescript
const logger = new LoggerService(saver, {
  // Log request/response bodies
  logBodies: true,

  // Log HTTP headers
  logHeaders: false,

  // Paths to exclude from logging (supports wildcards)
  excludePaths: ['/health', '/metrics', '/admin/*'],

  // Maximum body size to log in bytes (prevents memory issues)
  maxBodySize: 1024 * 100, // 100KB

  // Enabled protocols - empty array means log all protocols
  enabledProtocols: [], // or ['http', 'ws', 'grpc']
});

// Update configuration at runtime
logger.setConfig({
  logHeaders: true,
  maxBodySize: 1024 * 50,
  enabledProtocols: ['http', 'ws'], // Only log HTTP and WebSocket
});
```

## Switching Storage Backends

```typescript
const logger = new LoggerService(new ConsoleLogSaver());

// Switch to SQLite later
logger.setSaver(new SQLiteLogSaver('./logs.db'));
```

## Type Safety

All requests and responses are validated with Zod schemas:

```typescript
// Automatically validated
await logger.logRequest({
  method: 'GET', // must be a valid HTTP method
  path: '/api/users',
  statusCode: 200, // must be a valid status code
  responseTime: 45,
  requestBody: { /* any */ },
  responseBody: { /* any */ },
});

// Get logs with validated filters
const logs = await logger.getLogs({
  limit: 100, // max 1000
  offset: 0,
  method: 'GET', // validates against allowed methods
  path: '/api/users',
});
```

## Creating Custom Storage Backends

Implement the `ILogSaver` interface:

```typescript
import type { ILogSaver, RequestLog } from '@blazy/edge/plugins/logger';

export class MongoLogSaver implements ILogSaver {
  constructor(private collection: MongoCollection) {}

  async save(log: RequestLog): Promise<void> {
    await this.collection.insertOne(log);
  }

  async getLogs(options?: {
    limit?: number;
    offset?: number;
    method?: string;
    path?: string;
  }): Promise<RequestLog[]> {
    const query: any = {};
    if (options?.method) query.method = options.method;
    if (options?.path) query.path = options.path;

    return this.collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(options?.offset ?? 0)
      .limit(options?.limit ?? 100)
      .toArray();
  }

  async getLog(id: string): Promise<RequestLog | null> {
    return this.collection.findOne({ id });
  }

  async clearLogs(): Promise<void> {
    await this.collection.deleteMany({});
  }

  async getLogsCount(): Promise<number> {
    return this.collection.countDocuments();
  }
}

// Use it
const logger = new LoggerService(new MongoLogSaver(collection));
```

## Integration with Blazy Core

The logger can be automatically integrated with Blazy's core request handling to log all requests at the framework level. This provides comprehensive logging with minimal setup.

### Two-Phase Logging Pattern

The logger uses a two-phase pattern:
1. **Found Routes**: When `treeRouteFinder` returns a matched route, log both request and response data
2. **Not Found Routes**: When no route matches (404), log the request without response data

### Protocol-Agnostic Logging

The `CoreLoggerIntegration` helper provides static methods to extract protocol information automatically:

```typescript
import { CoreLoggerIntegration } from '@blazy/edge/plugins/logger';

// Extract protocol from handler protocol key
CoreLoggerIntegration.extractProtocol('GET') // → 'http'
CoreLoggerIntegration.extractProtocol('ws') // → 'ws'

// Extract status code from response
CoreLoggerIntegration.extractStatusCode(response, isError) // → number

// Extract response body safely
CoreLoggerIntegration.extractResponseData(response) // → object
```

### Core Integration Example

In `core.ts` `listen()` method, integrate logging at request handling:

```typescript
import { CoreLoggerIntegration, LoggerService, SQLiteLogSaver } from '@blazy/edge/plugins/logger';

const saver = new SQLiteLogSaver('./logs.db');
const logger = new LoggerService(saver);
const logIntegration = new CoreLoggerIntegration(logger);

// In the fetch handler (around line 540):
const { pathname, method } = requestURL;
const startTime = Date.now();

const handlerOptional = treeRouteFinder(app.tree, pathname);

if (handlerOptional.isSome()) {
  const routeHandlers = handlerOptional.unpack();
  const handler = routeHandlers[method];
  
  if (handler) {
    try {
      const response = await handler.handleRequest({...});
      await logIntegration.logFoundRoute({
        path: pathname,
        protocol: CoreLoggerIntegration.extractProtocol(method),
        method: method,
        requestData: body,
        responseData: CoreLoggerIntegration.extractResponseData(response),
        statusCode: CoreLoggerIntegration.extractStatusCode(response, false),
        responseTime: Date.now() - startTime,
      });
    } catch (error) {
      await logIntegration.logFoundRoute({
        path: pathname,
        protocol: 'http',
        method: method,
        requestData: body,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
} else {
  // 404 - route not found
  await logIntegration.logNotFoundRoute({
    path: pathname,
    protocol: 'http',
    method: method,
    requestData: body,
    responseTime: Date.now() - startTime,
    error: 'Route not found',
  });
}
```

### WebSocket Logging

For WebSocket messages, track connection and message events:

```typescript
// In the websocket handler:
const wsStartTime = Date.now();

websocket: {
  open(ws) {
    // Log connection
    await logIntegration.logFoundRoute({
      path: ws.url?.pathname ?? '/',
      protocol: 'ws',
      requestData: { type: 'connection' },
      responseTime: 0,
    });
  },
  
  message(ws, message) {
    const msgStartTime = Date.now();
    // Process message...
    await logIntegration.logFoundRoute({
      path: ws.url?.pathname ?? '/',
      protocol: 'ws',
      requestData: { type: 'message', payload: message },
      responseData: { acknowledged: true },
      responseTime: Date.now() - msgStartTime,
    });
  },
  
  close(ws) {
    // Log disconnection
    await logIntegration.logNotFoundRoute({
      path: ws.url?.pathname ?? '/',
      protocol: 'ws',
      responseTime: Date.now() - wsStartTime,
      error: 'Connection closed',
    });
  },
}
```

### Data Structure

All logs use a unified structure with protocol-specific fields:

```typescript
{
  id: 'unique-uuid',
  timestamp: 1708770896789,
  protocol: 'http' | 'ws' | 'grpc',
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: '/api/users',
  statusCode?: 200,
  responseTime: 45,
  requestData?: { /* request payload */ },
  responseData?: { /* response payload */ },
  headers?: { /* request headers */ },
  error?: 'Error message if any',
  metadata?: { /* additional context */ },
}
```

## Dashboard Features

The built-in dashboard at `/logger/ui` provides:

- 📊 Real-time log display with auto-refresh (5s)
- 🔍 Filter by HTTP method and path
- 📄 Pagination support
- ⚡ Response time visualization
- 🔴 Error highlighting
- 📌 Status code badges
- 🗑️ Clear all logs
- 📈 Statistics display

## Performance Considerations

- **Memory Usage**: Use `maxBodySize` to limit the size of logged bodies
- **Excluded Paths**: Add frequently accessed health check endpoints to `excludePaths`
- **SQLite**: For production use, consider a dedicated database or log aggregation service
- **Console Logger**: Only recommended for development; use SQLite or custom backend for production

## Best Practices

1. **Exclude health checks**: Add `/health`, `/metrics`, etc. to `excludePaths`
2. **Limit body size**: Set reasonable `maxBodySize` to prevent memory issues
3. **Use SQLite for production**: Console logger only keeps data in memory
4. **Regular cleanup**: Implement log rotation or cleanup policies
5. **Sensitive data**: Be careful with `logBodies` if logging sensitive information
6. **Headers**: Only enable `logHeaders` if needed; it adds overhead

## License

Part of the Blazy Edge framework.
