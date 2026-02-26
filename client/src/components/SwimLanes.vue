<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEventsStore } from '../stores/events';
import { EVENT_EMOJIS } from '../types';

const store = useEventsStore();
const STALL_THRESHOLD_MS = 60_000; // 60 seconds

const sessionHues = new Map<string, number>();
let hueCounter = 0;
function color(id: string): string {
  if (!sessionHues.has(id)) sessionHues.set(id, (hueCounter++ * 137.5) % 360);
  return `hsl(${sessionHues.get(id)}, 70%, 50%)`;
}

interface Lane {
  session_id: string;
  source_app: string;
  isActive: boolean;
  lastSeen: number;
  stalled: boolean;
  recentEvents: typeof store.events;
}

// Tick ref to force stall status refresh every 5s
const tick = ref(0);
let tickInterval: ReturnType<typeof setInterval>;

import { onMounted, onUnmounted } from 'vue';
onMounted(() => { tickInterval = setInterval(() => tick.value++, 5000); });
onUnmounted(() => clearInterval(tickInterval));

const lanes = computed<Lane[]>(() => {
  // Depend on tick so stall status refreshes every 5s
  void tick.value;

  const bySession = new Map<string, typeof store.events>();
  for (const e of store.events) {
    if (!bySession.has(e.session_id)) bySession.set(e.session_id, []);
    bySession.get(e.session_id)!.push(e);
  }
  const now = Date.now();
  return [...bySession.entries()].map(([sid, evts]) => {
    const times = evts.map(e => e.created_at);
    const lastSeen = Math.max(...times);
    const isActive = evts.some(e => e.event_type === 'SessionStart') &&
      !evts.some(e => ['Stop', 'SessionEnd'].includes(e.event_type));
    return {
      session_id: sid,
      source_app: evts[0].source_app,
      isActive,
      lastSeen,
      stalled: isActive && (now - lastSeen) > STALL_THRESHOLD_MS,
      recentEvents: evts.slice(0, 8),
    };
  }).sort((a, b) => b.lastSeen - a.lastSeen);
});

function formatAge(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}
</script>

<template>
  <div class="flex flex-col h-full">
    <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 shrink-0">🏊 Swim Lanes</h2>
    <div class="flex-1 overflow-y-auto space-y-2">
      <div
        v-for="lane in lanes"
        :key="lane.session_id"
        class="rounded-lg border p-2 cursor-pointer transition-colors text-xs"
        :class="[
          lane.stalled ? 'border-red-700 bg-red-950/30' : 'border-gray-800 bg-gray-800/50',
          store.filters.session_id === lane.session_id ? 'ring-1 ring-blue-500' : '',
        ]"
        :style="{ borderLeftColor: color(lane.session_id), borderLeftWidth: '3px' }"
        @click="store.setFilter('session_id', store.filters.session_id === lane.session_id ? null : lane.session_id)"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-mono text-gray-300">{{ lane.session_id.slice(0, 8) }}</span>
          <div class="flex items-center gap-1">
            <span v-if="lane.stalled" class="text-red-400 animate-pulse">⚠️ {{ formatAge(lane.lastSeen) }}</span>
            <span v-else class="text-gray-600">{{ formatAge(lane.lastSeen) }} ago</span>
            <span v-if="lane.isActive && !lane.stalled" class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>
        <div class="text-gray-500 mb-1">{{ lane.source_app }}</div>
        <div class="flex flex-wrap gap-0.5">
          <span v-for="e in lane.recentEvents" :key="e.id" :title="e.event_type">
            {{ EVENT_EMOJIS[e.event_type] ?? '•' }}
          </span>
        </div>
      </div>
      <div v-if="lanes.length === 0" class="text-gray-600 text-xs p-4 text-center">No sessions</div>
    </div>
  </div>
</template>
