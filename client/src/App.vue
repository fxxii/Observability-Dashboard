<script setup lang="ts">
import { ref } from 'vue';
import { useWebSocket } from './composables/useWebSocket';
import { useEventsStore } from './stores/events';
import FilterBar from './components/FilterBar.vue';
import EventTimeline from './components/EventTimeline.vue';
import PulseChart from './components/PulseChart.vue';
import SwimLanes from './components/SwimLanes.vue';
import ContextHeatmap from './components/ContextHeatmap.vue';
import McpRegistry from './components/McpRegistry.vue';

useWebSocket();
const store = useEventsStore();
const activeTab = ref<'timeline' | 'mcp'>('timeline');
</script>

<template>
  <div class="bg-gray-950 text-gray-100 flex flex-col p-4 gap-3" style="height: 100vh; overflow: hidden;">
    <header class="flex items-center justify-between shrink-0">
      <h1 class="text-xl font-bold text-green-400">⚡ Agent Observability Dashboard</h1>
      <div class="flex items-center gap-3 text-xs">
        <div class="flex gap-1">
          <button
            v-for="tab in ['timeline', 'mcp']" :key="tab"
            class="px-3 py-1 rounded capitalize"
            :class="activeTab === tab ? 'bg-blue-800 text-blue-200' : 'bg-gray-800 text-gray-400'"
            @click="activeTab = tab as 'timeline' | 'mcp'"
          >{{ tab }}</button>
        </div>
        <span :class="store.connected ? 'text-green-400' : 'text-red-400'">
          {{ store.connected ? '● Live' : '○ Disconnected' }}
        </span>
        <span class="text-gray-600">{{ store.events.length }} events</span>
      </div>
    </header>

    <template v-if="activeTab === 'timeline'">
      <FilterBar class="shrink-0" />
      <div class="flex flex-1 gap-3 min-h-0">
        <div class="flex-1 min-w-0 bg-gray-900 rounded-lg p-3 border border-gray-800 overflow-hidden">
          <EventTimeline />
        </div>
        <div class="w-72 shrink-0 flex flex-col gap-3">
          <div class="h-36 bg-gray-900 rounded-lg p-3 border border-gray-800">
            <PulseChart />
          </div>
          <div class="h-44 bg-gray-900 rounded-lg p-3 border border-gray-800 overflow-hidden">
            <ContextHeatmap />
          </div>
          <div class="flex-1 bg-gray-900 rounded-lg p-3 border border-gray-800 overflow-hidden">
            <SwimLanes />
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex-1 overflow-y-auto bg-gray-900 rounded-lg border border-gray-800">
        <McpRegistry />
      </div>
    </template>
  </div>
</template>
