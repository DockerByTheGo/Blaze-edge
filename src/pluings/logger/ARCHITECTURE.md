# Logger Plugin Architecture

## Overview

The Logger Plugin provides a type-safe HTTP request logging system for Blazy Edge with pluggable storage backends.

## Directory Structure

```
src/pluings/logger/
├── index.ts                          # Main export file
├── types.ts                          # Type definitions and interfaces
├── LoggerService.ts                  # Main logger service class
├── README.md                         # Comprehensive documentation
├── ARCHITECTURE.md                   # This file
│
├── savers/                           # Storage backend implementations
│   ├── index.ts
│   ├── ConsoleLogSaver.ts           # Logs to console (in-memory)
│   └── SQLiteLogSaver.ts            # Persists to SQLite database
│
├── routes/                           # HTTP endpoints and dashboard
│   ├── index.ts
│   └── LoggerRoutes.ts              # API routes and HTML dashboard
│
└── examples/                         # Usage examples
    ├── README.md
    ├── quick-start.example.ts       # Basic setup
    ├── integration.example.ts       # Full Blazy integration
    └── custom-savers.example.ts     # Custom storage backends
```

## Core Components

### 1. Types (`types.ts`)

**RequestLog** - Represents a single logged request
```typescript
interface RequestLog {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestBody?: unknown;
  responseBody?: unknown;
  headers?: Record<string, string>;
  error?: string;
}
```

**ILogSaver** - Interface for storage implementations
```typescript
interface ILogSaver {
  save(log: RequestLog): Promise<void>;
  getLogs(options?: FilterOptions): Promise<RequestLog[]>;
  getLog(id: string): Promise<RequestLog | null>;
  clearLogs(): Promise<void>;
  getLogsCount(): Promise<number>;
}
```

**LoggerConfig** - Configuration options
```typescript
interface LoggerConfig {
  logBodies: boolean;
  logHeaders: boolean;
  excludePaths: string[];
  maxBodySize: number;
}
```

### 2. LoggerService (`LoggerService.ts`)

Main service class that:
- Logs HTTP requests and responses
- Filters and retrieves logs
- Manages configuration
- Supports pluggable storage backends

Key methods:
- `logRequest(data)` - Log a request/response
- `getLogs(options)` - Retrieve logs with filtering
- `getLog(id)` - Get a specific log
- `getLogsCount()` - Get total count
- `clearLogs()` - Clear all logs
- `setSaver(saver)` - Switch storage backend
- `setConfig(config)` - Update configuration

### 3. Storage Backends

#### ConsoleLogSaver
- Logs to console
- Stores in-memory
- Good for development
- Data lost on restart

#### SQLiteLogSaver
- Persists to SQLite database
- Production-ready
- Supports filtering and pagination
- Data survives restarts

### 4. LoggerRoutes (`routes/LoggerRoutes.ts`)

Provides HTTP endpoints:

- `GET /logger/logs` - Retrieve logs
- `GET /logger/logs/:id` - Get specific log
- `GET /logger/stats` - Get statistics
- `GET /logger/ui` - Interactive dashboard
- `POST /logger/clear` - Clear all logs

Also includes a built-in HTML dashboard with:
- Real-time log viewing
- Filtering by method and path
- Pagination
- Statistics display
- Auto-refresh (5 seconds)

## Type Safety Features

### 1. Input Validation

All API inputs are validated with Zod schemas:

```typescript
const LogFilterSchema = z.object({
  limit: z.number().int().positive().max(1000),
  offset: z.number().int().nonnegative(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string(),
});
```

### 2. Response Types

All responses are typed:

```typescript
interface LogsResponse {
  logs: RequestLog[];
  total: number;
  limit: number;
  offset: number;
}
```

### 3. Configuration Type Safety

Config options are strongly typed:

```typescript
const config: LoggerConfig = {
  logBodies: true,
  logHeaders: false,
  excludePaths: ['/health'],
  maxBodySize: 102400,
};
```

## Integration Points

The logger can be integrated into Blazy at these points:

1. **Before Handler Hook** - Capture request metadata
2. **After Handler Hook** - Log response and timing
3. **Error Handler Hook** - Log errors with context

Example:
```typescript
app.beforeRequestHandler('loggerStart', (ctx) => ({
  ...ctx,
  startTime: Date.now(),
}));

app.afterRequestHandler((ctx) => {
  const responseTime = Date.now() - ctx.startTime;
  logger.logRequest({
    method: ctx.method,
    path: ctx.path,
    statusCode: ctx.statusCode,
    responseTime,
    // ... other fields
  });
});
```

## Extensibility

### Custom Storage Backends

Implement `ILogSaver` interface:

```typescript
export class CustomLogSaver implements ILogSaver {
  async save(log: RequestLog): Promise<void> { }
  async getLogs(options?): Promise<RequestLog[]> { }
  async getLog(id: string): Promise<RequestLog | null> { }
  async clearLogs(): Promise<void> { }
  async getLogsCount(): Promise<number> { }
}

const logger = new LoggerService(new CustomLogSaver());
```

### Composite Logger

Combine multiple backends:

```typescript
const composite = new CompositeLogSaver([
  new ConsoleLogSaver(),
  new SQLiteLogSaver('./logs.db'),
  new RemoteLogSaver(apiUrl, apiKey),
]);

const logger = new LoggerService(composite);
```

## Performance Considerations

1. **Memory Usage**
   - Configure `maxBodySize` to limit body logging
   - Use `excludePaths` for frequent endpoints
   - Implement log rotation for long-running apps

2. **Database**
   - SQLite is suitable for moderate traffic
   - Consider dedicated log aggregation for high volume
   - Index frequently filtered columns

3. **Network**
   - Remote loggers add latency
   - Consider batching for remote backends
   - Implement async/background logging

## Security Considerations

1. **Sensitive Data**
   - Disable `logBodies` if logging sensitive data
   - Consider data masking in custom savers
   - Implement access control on `/logger/*` routes

2. **Size Limits**
   - Set `maxBodySize` to prevent memory exhaustion
   - Monitor database growth
   - Implement cleanup policies

3. **Excluded Paths**
   - Exclude `/health`, `/metrics`, etc. from logging
   - Don't log password endpoints
   - Be selective with excluded paths

## Future Enhancements

Potential additions:
- Structured logging with tags/labels
- Log aggregation and correlation IDs
- Performance analytics and trending
- Alert/notification system
- Log export functionality
- Advanced filtering and search
- Rate limiting based on logs
- Integration with APM tools

## Testing

The logger is designed to be testable:

```typescript
const mockSaver: ILogSaver = {
  save: jest.fn(),
  getLogs: jest.fn().mockResolvedValue([]),
  getLog: jest.fn(),
  clearLogs: jest.fn(),
  getLogsCount: jest.fn().mockResolvedValue(0),
};

const logger = new LoggerService(mockSaver);
await logger.logRequest({ /* ... */ });
expect(mockSaver.save).toHaveBeenCalled();
```

## Dependencies

- `zod` - Schema validation (peer dependency)
- `crypto` - UUID generation (built-in)
- `bun:sqlite` - SQLite support (Bun runtime)

## API Reference

See `README.md` for comprehensive API documentation.

## Examples

See `examples/` directory for:
- Quick start guide
- Full Blazy integration
- Custom storage implementations
- Analysis patterns
