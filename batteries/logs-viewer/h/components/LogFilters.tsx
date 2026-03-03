import React from 'react';
import './LogFilters.css';

interface LogFiltersProps {
  filters: {
    method: string;
    path: string;
    statusCode: string;
    protocol: string;
    searchTerm: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const LogFilters: React.FC<LogFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({
      method: '',
      path: '',
      statusCode: '',
      protocol: '',
      searchTerm: '',
    });
  };

  return (
    <div className="filters">
      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="method">Method</label>
          <select
            id="method"
            value={filters.method}
            onChange={e => handleChange('method', e.target.value)}
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="protocol">Protocol</label>
          <select
            id="protocol"
            value={filters.protocol}
            onChange={e => handleChange('protocol', e.target.value)}
          >
            <option value="">All Protocols</option>
            <option value="http">HTTP</option>
            <option value="https">HTTPS</option>
            <option value="ws">WebSocket</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="statusCode">Status Code</label>
          <select
            id="statusCode"
            value={filters.statusCode}
            onChange={e => handleChange('statusCode', e.target.value)}
          >
            <option value="">All Status Codes</option>
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="path">Path</label>
          <input
            id="path"
            type="text"
            placeholder="Filter by path..."
            value={filters.path}
            onChange={e => handleChange('path', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search in logs..."
            value={filters.searchTerm}
            onChange={e => handleChange('searchTerm', e.target.value)}
          />
        </div>

        <div className="filter-group actions">
          <button className="btn-reset" onClick={handleReset}>
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};
