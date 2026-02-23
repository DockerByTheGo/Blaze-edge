import { z } from "zod";
import type { LoggerService } from "../LoggerService";
import type { RequestLog } from "../types";

/**
 * Request schema for log filter queries
 */
const LogFilterSchema = z.object({
  limit: z.number().int().positive().max(1000).default(100).optional(),
  offset: z.number().int().nonnegative().default(0).optional(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional(),
  path: z.string().optional(),
  protocol: z.string().optional(),
});

export type LogFilter = z.infer<typeof LogFilterSchema>;

/**
 * Response schema for logs endpoint
 */
const LogResponseSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  protocol: z.string(),
  method: z.string().optional(),
  path: z.string(),
  statusCode: z.number().optional(),
  responseTime: z.number(),
  requestData: z.unknown().optional(),
  responseData: z.unknown().optional(),
  headers: z.record(z.string(),z.any()).optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(),z.any()).optional(),
});

const LogsResponseSchema = z.object({
  logs: z.array(LogResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type LogsResponse = z.infer<typeof LogsResponseSchema>;

/**
 * Logger route handlers - provides endpoints to view and manage logs
 * Protocol-agnostic - supports all request types (HTTP, WebSocket, gRPC, etc.)
 */
export class LoggerRoutes {
  constructor(private logger: LoggerService) {}

  /**
   * GET /logger/logs - Retrieve all logs with optional filtering
   * Type-safe request/response handling
   */
  async getLogs(params: Partial<LogFilter> & Record<string, unknown>) {
    const validated = LogFilterSchema.parse(params);

    const logs = await this.logger.getLogs({
      limit: validated.limit,
      offset: validated.offset,
      method: validated.method,
      path: validated.path,
      protocol: validated.protocol,
    });

    const total = await this.logger.getLogsCount();

    const response: LogsResponse = {
      logs: logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        protocol: log.protocol,
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        requestData: log.requestData,
        responseData: log.responseData,
        headers: log.headers,
        error: log.error,
        metadata: log.metadata,
      })),
      total,
      limit: validated.limit ?? 100,
      offset: validated.offset ?? 0,
    };

    return response;
  }

  /**
   * GET /logger/logs/:id - Retrieve a specific log by ID
   */
  async getLog(id: string) {
    const log = await this.logger.getLog(id);

    if (!log) {
      return {
        error: "Log not found",
        id,
      };
    }

    return log;
  }

  /**
   * GET /logger/stats - Get logging statistics
   */
  async getStats() {
    const count = await this.logger.getLogsCount();
    const config = await this.logger.getConfig();

    return {
      totalLogs: count,
      config: {
        logBodies: config.logBodies,
        logHeaders: config.logHeaders,
        excludePaths: config.excludePaths,
        maxBodySize: config.maxBodySize,
        enabledProtocols: config.enabledProtocols || [],
      },
    };
  }

  /**
   * POST /logger/clear - Clear all logs
   */
  async clearLogs() {
    await this.logger.clearLogs();

    return {
      message: "All logs cleared",
      timestamp: Date.now(),
    };
  }

  /**
   * GET /logger/ui - Return HTML dashboard for viewing logs
   */
  async getDashboardHTML() {
    return this.generateDashboardHTML();
  }

  private generateDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blazy Logger Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .controls {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr auto auto;
            gap: 15px;
            padding: 20px 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            align-items: end;
        }

        .control-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .control-group label {
            font-weight: 600;
            font-size: 0.9em;
            color: #495057;
        }

        .control-group input,
        .control-group select {
            padding: 10px 12px;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            font-size: 0.95em;
            transition: border-color 0.2s;
        }

        .control-group input:focus,
        .control-group select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .button-group {
            display: flex;
            gap: 10px;
        }

        button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.95em;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-danger {
            background: #e74c3c;
            color: white;
        }

        .btn-danger:hover {
            background: #c0392b;
            transform: translateY(-2px);
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }

        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .stat-card h3 {
            color: #667eea;
            font-size: 0.9em;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .stat-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: #2c3e50;
        }

        .logs-container {
            padding: 30px;
        }

        .logs-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .logs-table thead {
            background: #f8f9fa;
        }

        .logs-table th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
        }

        .logs-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #dee2e6;
        }

        .logs-table tbody tr {
            transition: background-color 0.2s;
        }

        .logs-table tbody tr:hover {
            background-color: #f8f9fa;
        }

        .protocol-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.85em;
        }

        .protocol-http { background: #dbeafe; color: #0369a1; }
        .protocol-ws { background: #fcd34d; color: #7c2d12; }
        .protocol-grpc { background: #d1d5db; color: #1f2937; }

        .method-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.85em;
        }

        .method-get { background: #e7f3ff; color: #0c5aa0; }
        .method-post { background: #f0f5ff; color: #7c3aed; }
        .method-put { background: #fef3c7; color: #b45309; }
        .method-delete { background: #fee2e2; color: #991b1b; }
        .method-patch { background: #dbeafe; color: #0369a1; }

        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.85em;
        }

        .status-2xx { background: #dcfce7; color: #15803d; }
        .status-3xx { background: #dbeafe; color: #0369a1; }
        .status-4xx { background: #fef3c7; color: #b45309; }
        .status-5xx { background: #fee2e2; color: #991b1b; }

        .time-badge {
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            color: #6b7280;
        }

        .error-text {
            color: #dc2626;
            font-size: 0.85em;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #6b7280;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #6b7280;
        }

        .empty-state svg {
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
            opacity: 0.5;
        }

        .pagination {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
        }

        .pagination button {
            padding: 8px 12px;
            min-width: 40px;
        }

        .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .alert {
            padding: 15px 20px;
            border-radius: 6px;
            margin-bottom: 20px;
        }

        .alert-success {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #bbf7d0;
        }

        .alert-error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔍 Blazy Logger Dashboard</h1>
            <p>Monitor all requests across all protocols (HTTP, WebSocket, gRPC, etc.)</p>
        </header>

        <div id="alert-container"></div>

        <div class="controls">
            <div class="control-group">
                <label for="protocol-filter">Protocol</label>
                <select id="protocol-filter">
                    <option value="">All Protocols</option>
                    <option value="http">HTTP</option>
                    <option value="ws">WebSocket</option>
                    <option value="grpc">gRPC</option>
                </select>
            </div>

            <div class="control-group">
                <label for="method-filter">Method</label>
                <select id="method-filter">
                    <option value="">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                </select>
            </div>

            <div class="control-group">
                <label for="path-filter">Path</label>
                <input type="text" id="path-filter" placeholder="Filter by path...">
            </div>

            <div class="control-group">
                <label for="limit">Limit</label>
                <input type="number" id="limit" value="100" min="1" max="1000">
            </div>

            <div class="button-group">
                <button class="btn-primary" onclick="loadLogs()">🔄 Refresh</button>
                <button class="btn-danger" onclick="clearAllLogs()">🗑️ Clear All</button>
            </div>
        </div>

        <div class="stats" id="stats-container">
            <div class="stat-card">
                <h3>Total Logs</h3>
                <div class="value" id="stat-total">-</div>
            </div>
            <div class="stat-card">
                <h3>Config</h3>
                <div class="value" id="stat-config">-</div>
            </div>
        </div>

        <div class="logs-container">
            <h2>Request Logs</h2>
            <div id="logs-content"></div>
        </div>
    </div>

    <script>
        let currentOffset = 0;
        let currentLimit = 100;

        async function loadLogs() {
            const protocol = document.getElementById('protocol-filter').value;
            const method = document.getElementById('method-filter').value;
            const path = document.getElementById('path-filter').value;
            const limit = parseInt(document.getElementById('limit').value);
            
            currentLimit = limit;
            currentOffset = 0;

            try {
                const params = new URLSearchParams();
                if (protocol) params.append('protocol', protocol);
                if (method) params.append('method', method);
                if (path) params.append('path', path);
                params.append('limit', limit);
                params.append('offset', currentOffset);

                const response = await fetch(\`/logger/logs?\${params}\`);
                const data = await response.json();

                renderLogs(data);
                await loadStats();
            } catch (error) {
                showAlert('Error loading logs: ' + error.message, 'error');
            }
        }

        async function loadStats() {
            try {
                const response = await fetch('/logger/stats');
                const data = await response.json();

                document.getElementById('stat-total').textContent = data.totalLogs || 0;
                document.getElementById('stat-config').textContent = 
                    \`Bodies: \${data.config.logBodies ? '✓' : '✗'} | Headers: \${data.config.logHeaders ? '✓' : '✗'} | Protocols: \${data.config.enabledProtocols.length > 0 ? data.config.enabledProtocols.join(', ') : 'All'}\`;
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        function renderLogs(data) {
            const container = document.getElementById('logs-content');

            if (!data.logs || data.logs.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <h3>No logs yet</h3>
                        <p>Make some requests to see them here</p>
                    </div>
                \`;
                return;
            }

            let html = \`
                <table class="logs-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Protocol</th>
                            <th>Method</th>
                            <th>Path</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Error</th>
                        </tr>
                    </thead>
                    <tbody>
            \`;

            data.logs.forEach(log => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                const protocolClass = \`protocol-\${log.protocol.toLowerCase()}\`;
                const methodClass = log.method ? \`method-\${log.method.toLowerCase()}\` : '';
                const statusClass = log.statusCode ? \`status-\${Math.floor(log.statusCode / 100)}xx\` : '';
                const errorClass = log.error ? 'error-text' : '';

                html += \`
                    <tr>
                        <td><small>\${time}</small></td>
                        <td><span class="protocol-badge \${protocolClass}">\${log.protocol.toUpperCase()}</span></td>
                        <td>\${log.method ? \`<span class="method-badge \${methodClass}">\${log.method}</span>\` : '-'}</td>
                        <td><code>\${escapeHtml(log.path)}</code></td>
                        <td>\${log.statusCode ? \`<span class="status-badge \${statusClass}">\${log.statusCode}</span>\` : '-'}</td>
                        <td><span class="time-badge">\${log.responseTime}ms</span></td>
                        <td class="\${errorClass}">\${log.error ? '❌ ' + escapeHtml(log.error) : '-'}</td>
                    </tr>
                \`;
            });

            html += \`
                    </tbody>
                </table>

                <div class="pagination">
                    <button \${currentOffset === 0 ? 'disabled' : ''} onclick="previousPage()">← Previous</button>
                    <span>Page \${Math.floor(currentOffset / currentLimit) + 1} of \${Math.ceil(data.total / currentLimit)}</span>
                    <button \${currentOffset + currentLimit >= data.total ? 'disabled' : ''} onclick="nextPage()">Next →</button>
                </div>
            \`;

            container.innerHTML = html;
        }

        function nextPage() {
            currentOffset += currentLimit;
            loadLogs();
        }

        function previousPage() {
            currentOffset = Math.max(0, currentOffset - currentLimit);
            loadLogs();
        }

        async function clearAllLogs() {
            if (!confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
                return;
            }

            try {
                const response = await fetch('/logger/clear', { method: 'POST' });
                const data = await response.json();
                showAlert('All logs cleared successfully', 'success');
                await loadLogs();
            } catch (error) {
                showAlert('Error clearing logs: ' + error.message, 'error');
            }
        }

        function showAlert(message, type) {
            const container = document.getElementById('alert-container');
            const alert = document.createElement('div');
            alert.className = \`alert alert-\${type}\`;
            alert.textContent = message;
            container.appendChild(alert);

            setTimeout(() => alert.remove(), 5000);
        }

        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }

        // Load logs on page load and refresh every 5 seconds
        loadLogs();
        setInterval(loadLogs, 5000);
    </script>
</body>
</html>
    `;
  }
}
