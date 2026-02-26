<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useEventsStore } from '../stores/events';
import { EVENT_EMOJIS, TOOL_EMOJIS } from '../types';

const store = useEventsStore();
const listEl = ref<HTMLElement | null>(null);
const autoScroll = ref(true);

const sessionHues = new Map<string, number>();
let hueCounter = 0;
function sessionColor(id: string): string {
  if (!sessionHues.has(id)) { sessionHues.set(id, (hueCounter++ * 137.5) % 360); }
  return `hsl(${sessionHues.get(id)}, 70%, 50%)`;
}

function toolEmoji(event: { event_type: string; payload: Record<string, unknown> }): string {
  const tool = (event.payload?.tool ?? event.payload?.tool_name ?? '') as string;
  return TOOL_EMOJIS[tool] ?? '';
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour12: false });
}

watch(
  () => store.filteredEvents.length,
  async () => {
    if (!autoScroll.value) return;
    await nextTick();
    // Events store uses unshift(), so newest events are at index 0 (top of list); scroll to top to show them.
    if (listEl.value) listEl.value.scrollTop = 0;
  }
);

function onScroll() {
  if (listEl.value) autoScroll.value = listEl.value.scrollTop < 60;
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">📋 Event Timeline</h2>
      <button
        class="text-xs px-2 py-0.5 rounded"
        :class="autoScroll ? 'bg-green-800 text-green-300' : 'bg-gray-800 text-gray-400'"
        @click="autoScroll = !autoScroll"
      >{{ autoScroll ? '⬆ Auto' : '⏸ Paused' }}</button>
    </div>

    <div ref="listEl" class="flex-1 overflow-y-auto space-y-0.5 min-h-0" @scroll="onScroll">
      <div
        v-for="event in store.filteredEvents"
        :key="event.id"
        class="flex items-start gap-2 px-2 py-1 rounded text-xs hover:bg-gray-800 transition-colors"
        :style="{ borderLeft: `3px solid ${sessionColor(event.session_id)}` }"
      >
        <span class="text-gray-500 shrink-0 tabular-nums w-16">{{ formatTime(event.created_at) }}</span>
        <span class="text-base leading-none shrink-0">{{ EVENT_EMOJIS[event.event_type] ?? '•' }}{{ toolEmoji(event) }}</span>
        <div class="flex-1 min-w-0">
          <span class="text-gray-200 font-medium">{{ event.event_type }}</span>
          <span class="text-gray-500 ml-1">{{ event.source_app }}</span>
          <span class="text-gray-600 ml-1 font-mono">{{ event.session_id.slice(0, 8) }}</span>
          <div v-if="event.payload?.tool || event.payload?.message" class="text-gray-400 truncate mt-0.5">
            {{ event.payload?.tool ?? event.payload?.message }}
          </div>
        </div>
        <div v-if="event.tags.length" class="flex gap-1 shrink-0">
          <span v-for="tag in event.tags" :key="tag" class="text-xs bg-indigo-900 text-indigo-300 px-1 rounded">{{ tag }}</span>
        </div>
      </div>

      <div v-if="store.filteredEvents.length === 0" class="text-gray-600 text-xs p-8 text-center">
        No events yet. Start a Claude Code session with hooks installed.
      </div>
    </div>
  </div>
</template>
