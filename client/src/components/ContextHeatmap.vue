<script setup lang="ts">
import { computed } from 'vue';
import { useMetricsStore } from '../stores/metrics';

const metricsStore = useMetricsStore();

const gauges = computed(() =>
  [...metricsStore.sessionMetrics.entries()].map(([sid, m]) => ({
    session_id: sid,
    shortId: sid.slice(0, 8),
    ...m,
  }))
);

// Estimate fill % based on compact count (rough heuristic)
// Heuristic: min 20% fill, +15% per compaction, capped at 100%
function fillPct(compactCount: number): number {
  return Math.min(20 + compactCount * 15, 100);
}

function barColor(status: string): string {
  if (status === 'critical') return 'bg-red-500';
  if (status === 'warning') return 'bg-amber-500';
  return 'bg-green-500';
}
</script>

<template>
  <div class="flex flex-col h-full">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 shrink-0">🧠 Context Pressure</h2>
    <div class="flex-1 overflow-y-auto space-y-2">
      <div v-for="g in gauges" :key="g.session_id" class="bg-gray-800 rounded p-2">
        <div class="flex justify-between text-xs mb-1">
          <span class="text-gray-300 font-mono">{{ g.shortId }}</span>
          <span :class="g.status === 'critical' ? 'text-red-400' : g.status === 'warning' ? 'text-amber-400' : 'text-gray-500'">
            {{ g.compactCount }}× compact
            <span v-if="g.status === 'critical'"> 🔴</span>
            <span v-else-if="g.status === 'warning'"> 🟡</span>
          </span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-1.5">
          <div
            class="h-1.5 rounded-full transition-all"
            :class="barColor(g.status)"
            :style="{ width: `${fillPct(g.compactCount)}%` }"
          />
        </div>
      </div>
      <div v-if="gauges.length === 0" class="text-gray-600 text-xs p-2 text-center">No context data</div>
    </div>
  </div>
</template>
