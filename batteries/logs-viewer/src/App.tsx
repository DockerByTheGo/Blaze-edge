import { useState, useEffect, useMemo } from 'react'
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
    <div style={styles.app}>
      <header style={styles.appHeader}>
        <h1 style={styles.title}>📊 Logs Viewer</h1>
        <p style={styles.subtitle}>Real-time log monitoring and analysis</p>
      </header>

      <main style={styles.appMain}>
        {error && <div style={styles.errorBanner}>{error}</div>}

        <LogFilters filters={filters} onFiltersChange={setFilters} />

        <div style={styles.logsStats}>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Total Logs</span>
            <span style={styles.statValue}>{stats.total}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Filtered</span>
            <span style={styles.statValue}>{stats.filtered}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Status</span>
            <span style={styles.statValue}>{stats.status}</span>
          </div>
        </div>

        {loading && filteredLogs.length === 0 ? (
          <div style={styles.loading}>Loading logs...</div>
        ) : (
          <LogViewer logs={filteredLogs} />
        )}
      </main>
    </div>
  )
}

const styles: Record<string, any> = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a', fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif', color: '#e2e8f0' },
  appHeader: { background: 'linear-gradient(135deg,#0ea5e9 0%, #60a5fa 100%)', padding: '2rem', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  title: { fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' },
  subtitle: { fontSize: '1rem', opacity: 0.95 },
  appMain: { flex: 1, padding: '2rem', maxWidth: 1400, width: '100%', margin: '0 auto' },
  errorBanner: { backgroundColor: '#ef4444', color: 'white', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', borderLeft: '4px solid #b91c1c' },
  logsStats: { display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: '2rem' },
  stat: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  statLabel: { fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' },
  statValue: { fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' },
  loading: { textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '1.1rem' },
}

export default App
