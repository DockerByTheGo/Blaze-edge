<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['filters-change']);

const localFilters = ref({
  method: props.filters.method || '',
  path: props.filters.path || '',
  statusCode: props.filters.statusCode || '',
  protocol: props.filters.protocol || '',
  searchTerm: props.filters.searchTerm || '',
});

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
const protocols = ['HTTP', 'HTTPS', 'WS', 'WSS'];
const statusCodes = ['200', '201', '204', '400', '401', '403', '404', '500', '502', '503'];

watch(localFilters, (newFilters) => {
  emit('filters-change', newFilters);
}, { deep: true });

const clearFilters = () => {
  localFilters.value = {
    method: '',
    path: '',
    statusCode: '',
    protocol: '',
    searchTerm: '',
  };
};
</script>

<template>
  <div class="filters-container">
    <div class="filters-header">
      <h3>🔍 Filters</h3>
      <button class="btn-clear" @click="clearFilters">Clear All</button>
    </div>

    <div class="filters-grid">
      <div class="filter-group">
        <label for="method">Method</label>
        <select v-model="localFilters.method" id="method">
          <option value="">All Methods</option>
          <option v-for="method in methods" :key="method" :value="method">
            {{ method }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="protocol">Protocol</label>
        <select v-model="localFilters.protocol" id="protocol">
          <option value="">All Protocols</option>
          <option v-for="proto in protocols" :key="proto" :value="proto">
            {{ proto }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="statusCode">Status Code</label>
        <select v-model="localFilters.statusCode" id="statusCode">
          <option value="">All Status Codes</option>
          <option v-for="code in statusCodes" :key="code" :value="code">
            {{ code }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="path">Path</label>
        <input
          v-model="localFilters.path"
          id="path"
          type="text"
          placeholder="Filter by path..."
        />
      </div>

      <div class="filter-group full-width">
        <label for="search">Search</label>
        <input
          v-model="localFilters.searchTerm"
          id="search"
          type="text"
          placeholder="Search all fields..."
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters-container {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.btn-clear {
  padding: 0.5rem 1rem;
  background-color: var(--color-bg);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-clear:hover {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group.full-width {
  grid-column: 1 / -1;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.filter-group select,
.filter-group input {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 0.95rem;
  transition: all 0.2s;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-group select:hover,
.filter-group input:hover {
  border-color: var(--color-primary);
}

@media (max-width: 768px) {
  .filters-container {
    padding: 1rem;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .filter-group.full-width {
    grid-column: 1;
  }
}
</style>
