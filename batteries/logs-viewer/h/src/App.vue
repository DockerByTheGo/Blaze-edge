<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { MockLogsRepo } from '../logs-repo/MockLogsRepo';
import type { LogsRepo } from '../logs-repo';
import type { Log } from '@blazyts/blazy-edge';
import LogViewer from './components/LogViewer.vue';
import LogFilters from './components/LogFilters.vue';

const logsRepo = ref<LogsRepo>(new MockLogsRepo());
const logs = ref<Log[]>([]);
const filteredLogs = ref<Log[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const refreshInterval = ref<NodeJS.Timeout | null>(null);

const filters = ref({
  method: '',
  path: '',
  statusCode: '',
  protocol: '',
  searchTerm: '',
});

const stats = computed(() => ({
  total: logs.value.length,
  filtered: filteredLogs.value.length,
  status: loading.value ? '🔄' : '✅',
}));

const fetchLogs = async () => {
  try {
    loading.value = true;
    const fetchedLogs = await logsRepo.value.getAllLogs();
    logs.value = fetchedLogs;
    applyFilters();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  let filtered = logs.value;

  if (filters.value.method) {
    filtered = filtered.filter(log => log.method === filters.value.method);
  }

  if (filters.value.path) {
    filtered = filtered.filter(log =>
      log.path.toLowerCase().includes(filters.value.path.toLowerCase())
    );
  }

  if (filters.value.statusCode) {
    filtered = filtered.filter(log => log.statusCode === parseInt(filters.value.statusCode));
  }

  if (filters.value.protocol) {
    filtered = filtered.filter(log => log.protocol === filters.value.protocol);
  }

  if (filters.value.searchTerm) {
    filtered = filtered.filter(log =>
      JSON.stringify(log).toLowerCase().includes(filters.value.searchTerm.toLowerCase())
    );
  }

  filteredLogs.value = filtered;
};

const handleFiltersChange = (newFilters: any) => {
  filters.value = newFilters;
  applyFilters();
};

onMounted(() => {
  fetchLogs();
  refreshInterval.value = setInterval(fetchLogs, 5000);
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>📊 Logs Viewer</h1>
      <p class="subtitle">Real-time log monitoring and analysis</p>
    </header>

    <main class="app-main">
      <div v-if="error" class="error-banner">{{ error }}</div>

      <LogFilters :filters="filters" @filters-change="handleFiltersChange" />

      <div class="logs-stats">
        <div class="stat">
          <span class="stat-label">Total Logs</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Filtered</span>
          <span class="stat-value">{{ stats.filtered }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Status</span>
          <span class="stat-value">{{ stats.status }}</span>
        </div>
      </div>

      <div v-if="loading && filteredLogs.length === 0" class="loading">Loading logs...</div>
      <LogViewer v-else :logs="filteredLogs" />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
}

.app-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, #60a5fa 100%);
  padding: 2rem;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.app-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.app-header .subtitle {
  font-size: 1rem;
  opacity: 0.95;
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.error-banner {
  background-color: var(--color-status-5xx);
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  border-left: 4px solid #b91c1c;
}

.logs-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-primary);
}

.loading {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-secondary);
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1.5rem 1rem;
  }

  .app-header h1 {
    font-size: 1.875rem;
  }

  .app-main {
    padding: 1rem;
  }
}
</style>
