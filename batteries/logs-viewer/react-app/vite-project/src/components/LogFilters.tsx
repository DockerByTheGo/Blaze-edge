import React, { useState } from 'react'
import './LogFilters.css'

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
    <div className="filters-container">
      <div className="filters-header">
        <h3>🔍 Filters</h3>
        <button className="btn-clear" onClick={clearFilters}>
          Clear All
        </button>
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="method">Method</label>
          <select
            id="method"
            value={filters.method}
            onChange={e => handleFilterChange('method', e.target.value)}
          >
            <option value="">All Methods</option>
            {methods.map(method => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="protocol">Protocol</label>
          <select
            id="protocol"
            value={filters.protocol}
            onChange={e => handleFilterChange('protocol', e.target.value)}
          >
            <option value="">All Protocols</option>
            {protocols.map(proto => (
              <option key={proto} value={proto}>
                {proto}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="statusCode">Status Code</label>
          <select
            id="statusCode"
            value={filters.statusCode}
            onChange={e => handleFilterChange('statusCode', e.target.value)}
          >
            <option value="">All Status Codes</option>
            {statusCodes.map(code => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="path">Path</label>
          <input
            id="path"
            type="text"
            placeholder="Filter by path..."
            value={filters.path}
            onChange={e => handleFilterChange('path', e.target.value)}
          />
        </div>

        <div className="filter-group full-width">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search all fields..."
            value={filters.searchTerm}
            onChange={e => handleFilterChange('searchTerm', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

export default LogFilters
