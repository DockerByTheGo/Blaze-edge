import React, { useState } from 'react'

interface FiltersState {
  method: string
  path: string
  statusCode: string
  protocol: string
  searchTerm: string
}

interface LogFiltersProps {
  filters: FiltersState
  onFiltersChange: (filters: FiltersState) => void
}

const LogFilters: React.FC<LogFiltersProps> = ({ filters, onFiltersChange }) => {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  const protocols = ['HTTP', 'HTTPS', 'WS', 'WSS']
  const statusCodes = ['200', '201', '204', '400', '401', '403', '404', '500', '502', '503']

  const handleFilterChange = (field: keyof FiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      method: '',
      path: '',
      statusCode: '',
      protocol: '',
      searchTerm: '',
    })
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🔍 Filters</h3>
        <button style={styles.clearBtn} onClick={clearFilters}>
          Clear All
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.group}>
          <label htmlFor="method">Method</label>
          <select
            id="method"
            value={filters.method}
            onChange={e => handleFilterChange('method', e.target.value)}
            style={styles.input}
          >
            <option value="">All Methods</option>
            {methods.map(method => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.group}>
          <label htmlFor="protocol">Protocol</label>
          <select
            id="protocol"
            value={filters.protocol}
            onChange={e => handleFilterChange('protocol', e.target.value)}
            style={styles.input}
          >
            <option value="">All Protocols</option>
            {protocols.map(proto => (
              <option key={proto} value={proto}>
                {proto}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.group}>
          <label htmlFor="statusCode">Status Code</label>
          <select
            id="statusCode"
            value={filters.statusCode}
            onChange={e => handleFilterChange('statusCode', e.target.value)}
            style={styles.input}
          >
            <option value="">All Status Codes</option>
            {statusCodes.map(code => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.group}>
          <label htmlFor="path">Path</label>
          <input
            id="path"
            type="text"
            placeholder="Filter by path..."
            value={filters.path}
            onChange={e => handleFilterChange('path', e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={{ ...styles.group, gridColumn: '1 / -1' }}>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search all fields..."
            value={filters.searchTerm}
            onChange={e => handleFilterChange('searchTerm', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, any> = {
  container: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 24, marginBottom: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 600, color: '#e2e8f0', margin: 0 },
  clearBtn: { padding: '8px 12px', background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: 6, cursor: 'pointer' },
  grid: { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' },
  group: { display: 'flex', flexDirection: 'column' },
  input: { padding: 10, border: '1px solid #334155', borderRadius: 6, background: '#0f172a', color: '#e2e8f0', fontSize: 14 }
}

export default LogFilters
