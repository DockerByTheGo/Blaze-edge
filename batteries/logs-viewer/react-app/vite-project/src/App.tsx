import { useState, useEffect, useMemo } from 'react'
import './App.css'
import { MockLogsRepo } from './logs-repo/MockLogsRepo'
import type { LogsRepo } from './logs-repo'
import type { Log } from '@blazyts/blazy-edge'
import LogViewer from './components/LogViewer'
import LogFilters from './components/LogFilters'

interface Filters {
  method: string
  path: string
  statusCode: string
  protocol: string
  searchTerm: string
}

function App() {
  const [logsRepo] = useState<LogsRepo>(new MockLogsRepo())
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    method: '',
    path: '',
    statusCode: '',
    protocol: '',
    searchTerm: '',
  })

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const fetchedLogs = await logsRepo.getAllLogs()
      setLogs(fetchedLogs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredLogs = useMemo(() => {
    let filtered = logs

    if (filters.method) {
      filtered = filtered.filter(log => log.method === filters.method)
    }

    if (filters.path) {
      filtered = filtered.filter(log =>
        log.path.toLowerCase().includes(filters.path.toLowerCase())
      )
    }

    if (filters.statusCode) {
      filtered = filtered.filter(log => log.statusCode === parseInt(filters.statusCode))
    }

    if (filters.protocol) {
      filtered = filtered.filter(log => log.protocol === filters.protocol)
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(log =>
        JSON.stringify(log).toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [logs, filters])

  const stats = {
    total: logs.length,
    filtered: filteredLogs.length,
    status: loading ? '🔄' : '✅',
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 Logs Viewer</h1>
        <p className="subtitle">Real-time log monitoring and analysis</p>
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}

        <LogFilters filters={filters} onFiltersChange={setFilters} />

        <div className="logs-stats">
          <div className="stat">
            <span className="stat-label">Total Logs</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Filtered</span>
            <span className="stat-value">{stats.filtered}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Status</span>
            <span className="stat-value">{stats.status}</span>
          </div>
        </div>

        {loading && filteredLogs.length === 0 ? (
          <div className="loading">Loading logs...</div>
        ) : (
          <LogViewer logs={filteredLogs} />
        )}
      </main>
    </div>
  )
}

export default App
