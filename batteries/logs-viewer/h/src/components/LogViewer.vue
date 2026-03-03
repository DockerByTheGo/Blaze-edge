<script setup lang="ts">
import { defineProps } from 'vue';
import type { Log } from '@blazyts/blazy-edge';
import LogEntry from './LogEntry.vue';

defineProps({
  logs: {
    type: Array as () => Log[],
    required: true,
  },
});
</script>

<template>
  <div class="log-viewer">
    <div v-if="logs.length === 0" class="no-logs">
      <p>📭 No logs found</p>
      <p class="hint">Try adjusting your filters or refreshing the page</p>
    </div>
    <div v-else class="log-entries">
      <LogEntry v-for="log in logs" :key="log.id" :log="log" />
    </div>
  </div>
</template>

<style scoped>
.log-viewer {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.log-entries {
  max-height: 800px;
  overflow-y: auto;
  padding: 1rem;
}

.no-logs {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.no-logs p {
  margin: 0.5rem 0;
}

.no-logs p:first-child {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.hint {
  font-size: 0.875rem;
  opacity: 0.7;
}
</style>
