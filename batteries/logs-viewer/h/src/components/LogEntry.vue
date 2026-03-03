<script setup lang="ts">
import { ref } from 'vue';
import type { Log } from '@blazyts/blazy-edge';

defineProps({
  log: {
    type: Object as () => Log,
    required: true,
  },
});

const expanded = ref(false);

const getStatusClass = (statusCode: number) => {
  if (statusCode < 300) return 'status-2xx';
  if (statusCode < 400) return 'status-3xx';
  if (statusCode < 500) return 'status-4xx';
  return 'status-5xx';
};

const getMethodClass = (method: string) => {
  const classes: Record<string, string> = {
    GET: 'method-get',
    POST: 'method-post',
    PUT: 'method-put',
    DELETE: 'method-delete',
    PATCH: 'method-patch',
  };
  return classes[method] || 'method-default';
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};
</script>

<template>
  <div class="log-entry">
    <div class="log-header" @click="expanded = !expanded">
      <span :class="['status-badge', getStatusClass(log.statusCode)]">
        {{ log.statusCode }}
      </span>

      <span :class="['method-badge', getMethodClass(log.method)]">
        {{ log.method }}
      </span>

      <span class="log-path">{{ log.path }}</span>

      <span class="log-protocol">{{ log.protocol }}</span>

      <span class="log-timestamp">{{ new Date(log.timestamp).toLocaleTimeString() }}</span>

      <span class="log-duration">{{ formatDuration(log.duration) }}</span>

      <span class="expand-icon">{{ expanded ? '▼' : '▶' }}</span>
    </div>

    <div v-if="expanded" class="log-details">
      <div class="detail-section">
        <h4>Request</h4>
        <div class="detail-group">
          <span class="label">Method:</span>
          <span class="value">{{ log.method }}</span>
        </div>
        <div class="detail-group">
          <span class="label">Path:</span>
          <span class="value">{{ log.path }}</span>
        </div>
        <div class="detail-group">
          <span class="label">Protocol:</span>
          <span class="value">{{ log.protocol }}</span>
        </div>
        <div v-if="log.queryParams" class="detail-group">
          <span class="label">Query Params:</span>
          <code class="value">{{ JSON.stringify(log.queryParams, null, 2) }}</code>
        </div>
        <div v-if="log.headers" class="detail-group">
          <span class="label">Headers:</span>
          <code class="value">{{ JSON.stringify(log.headers, null, 2) }}</code>
        </div>
      </div>

      <div class="detail-section">
        <h4>Response</h4>
        <div class="detail-group">
          <span class="label">Status Code:</span>
          <span :class="['value', getStatusClass(log.statusCode)]">{{ log.statusCode }}</span>
        </div>
        <div class="detail-group">
          <span class="label">Duration:</span>
          <span class="value">{{ formatDuration(log.duration) }}</span>
        </div>
        <div v-if="log.responseBody" class="detail-group">
          <span class="label">Response Body:</span>
          <code class="value">{{ JSON.stringify(log.responseBody, null, 2) }}</code>
        </div>
        <div v-if="log.errorMessage" class="detail-group error">
          <span class="label">Error:</span>
          <span class="value">{{ log.errorMessage }}</span>
        </div>
      </div>

      <div class="detail-section">
        <h4>Metadata</h4>
        <div class="detail-group">
          <span class="label">Timestamp:</span>
          <span class="value">{{ new Date(log.timestamp).toLocaleString() }}</span>
        </div>
        <div class="detail-group">
          <span class="label">User Agent:</span>
          <span class="value">{{ log.userAgent || 'N/A' }}</span>
        </div>
        <div class="detail-group">
          <span class="label">IP Address:</span>
          <span class="value">{{ log.ipAddress || 'N/A' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log-entry {
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--color-bg-secondary);
  cursor: pointer;
  transition: background-color 0.2s;
}

.log-header:hover {
  background-color: var(--color-bg);
}

.status-badge {
  min-width: 60px;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-align: center;
  color: white;
}

.status-2xx {
  background-color: var(--color-status-2xx);
}

.status-3xx {
  background-color: var(--color-status-3xx);
}

.status-4xx {
  background-color: var(--color-status-4xx);
}

.status-5xx {
  background-color: var(--color-status-5xx);
}

.method-badge {
  min-width: 50px;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.75rem;
  text-align: center;
  color: white;
}

.method-get {
  background-color: #10b981;
}

.method-post {
  background-color: #3b82f6;
}

.method-put {
  background-color: #f59e0b;
}

.method-delete {
  background-color: #ef4444;
}

.method-patch {
  background-color: #8b5cf6;
}

.method-default {
  background-color: #6b7280;
}

.log-path {
  flex: 1;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  color: var(--color-text);
  word-break: break-all;
}

.log-protocol {
  padding: 0.25rem 0.5rem;
  background-color: var(--color-bg);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.log-timestamp {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.log-duration {
  font-weight: 600;
  color: var(--color-primary);
  min-width: 60px;
  text-align: right;
}

.expand-icon {
  color: var(--color-text-secondary);
  transition: transform 0.2s;
}

.log-header:hover .expand-icon {
  color: var(--color-primary);
}

.log-details {
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-border);
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-primary);
}

.detail-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  align-items: flex-start;
}

.detail-group.error {
  color: var(--color-status-5xx);
}

.detail-group .label {
  min-width: 150px;
  font-weight: 500;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.detail-group .value {
  flex: 1;
  color: var(--color-text);
  word-break: break-word;
}

.detail-group code {
  display: block;
  width: 100%;
  background-color: var(--color-bg-secondary);
  padding: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid var(--color-border);
  font-size: 0.85rem;
  overflow-x: auto;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .log-header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .log-path {
    flex: 1 0 100%;
  }

  .log-timestamp {
    flex: 1 0 50%;
  }

  .log-duration {
    flex: 1 0 50%;
  }

  .detail-group {
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-group .label {
    min-width: auto;
  }
}
</style>
