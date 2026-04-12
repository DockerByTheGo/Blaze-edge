import type { CSSProperties, FC } from "react";

type FiltersState = {
  method: string;
  path: string;
  statusCode: string;
  protocol: string;
  searchTerm: string;
};

type LogFiltersProps = {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
};

const styles: Record<string, CSSProperties> = {
  filters: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    boxSizing: "border-box",
    marginBottom: 24,
    padding: 24,
  },
  header: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  clearButton: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#94a3b8",
    cursor: "pointer",
    padding: "8px 12px",
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  wideField: {
    gridColumn: "1 / -1",
  },
  label: {
    color: "#94a3b8",
  },
  control: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#e2e8f0",
    font: "inherit",
    padding: 10,
  },
};

const LogFilters: FC<LogFiltersProps> = ({ filters, onFiltersChange }) => {
  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
  const protocols = ["HTTP", "HTTPS", "WS", "WSS"];
  const statusCodes = ["200", "201", "204", "400", "401", "403", "404", "500", "502", "503"];

  const handleFilterChange = (field: keyof FiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      method: "",
      path: "",
      statusCode: "",
      protocol: "",
      searchTerm: "",
    });
  };

  return (
    <div style={styles.filters}>
      <div style={styles.header}>
        <h3 style={styles.title}>Filters</h3>
        <button style={styles.clearButton} onClick={clearFilters}>
          Clear All
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.field}>
          <label htmlFor="method" style={styles.label}>Method</label>
          <select
            id="method"
            style={styles.control}
            value={filters.method}
            onChange={e => handleFilterChange("method", e.target.value)}
          >
            <option value="">All Methods</option>
            {methods.map(method => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label htmlFor="protocol" style={styles.label}>Protocol</label>
          <select
            id="protocol"
            style={styles.control}
            value={filters.protocol}
            onChange={e => handleFilterChange("protocol", e.target.value)}
          >
            <option value="">All Protocols</option>
            {protocols.map(proto => (
              <option key={proto} value={proto}>
                {proto}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label htmlFor="statusCode" style={styles.label}>Status Code</label>
          <select
            id="statusCode"
            style={styles.control}
            value={filters.statusCode}
            onChange={e => handleFilterChange("statusCode", e.target.value)}
          >
            <option value="">All Status Codes</option>
            {statusCodes.map(code => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label htmlFor="path" style={styles.label}>Path</label>
          <input
            id="path"
            type="text"
            placeholder="Filter by path..."
            style={styles.control}
            value={filters.path}
            onChange={e => handleFilterChange("path", e.target.value)}
          />
        </div>

        <div style={{ ...styles.field, ...styles.wideField }}>
          <label htmlFor="search" style={styles.label}>Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search all fields..."
            style={styles.control}
            value={filters.searchTerm}
            onChange={e => handleFilterChange("searchTerm", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default LogFilters;
