<script setup lang="ts">
import { useWebSocket } from './composables/useWebSocket';
import { useEventsStore } from './stores/events';
import FilterBar from './components/FilterBar.vue';
import EventTimeline from './components/EventTimeline.vue';
import PulseChart from './components/PulseChart.vue';

useWebSocket();
const store = useEventsStore();
</script>

<template>
  <div class="bg-gray-950 text-gray-100 flex flex-col p-4 gap-3" style="height: 100vh; overflow: hidden;">
    <header class="flex items-center justify-between shrink-0">
      <h1 class="text-xl font-bold text-green-400">⚡ Agent Observability Dashboard</h1>
      <div class="flex items-center gap-2 text-xs">
        <span :class="store.connected ? 'text-green-400' : 'text-red-400'">
          {{ store.connected ? '● Live' : '○ Disconnected' }}
        </span>
        <span class="text-gray-600">{{ store.events.length }} events</span>
      </div>
    </header>

    <FilterBar class="shrink-0" />

    <div class="flex flex-1 gap-3 min-h-0">
      <div class="flex-1 min-w-0 bg-gray-900 rounded-lg p-3 border border-gray-800 overflow-hidden">
        <EventTimeline />
      </div>
      <div class="w-64 shrink-0 bg-gray-900 rounded-lg p-3 border border-gray-800">
        <PulseChart />
      </div>
    </div>
  </div>
</template>
