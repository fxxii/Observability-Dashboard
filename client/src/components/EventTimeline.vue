<template>
  <div class="h-full flex flex-col">
    <div class="px-3 py-1.5 border-b border-border flex items-center justify-between">
      <span class="text-xs text-gray-400 font-semibold">📋 Event Timeline</span>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span>{{ store.filteredEvents.length }} events</span>
        <button
          @click="toggleAutoScroll"
          :class="autoScroll ? 'text-cyan-400' : 'text-gray-600'"
          class="hover:text-cyan-300 transition-colors"
          title="Toggle auto-scroll"
        >⬇ AUTO</button>
      </div>
    </div>

    <div
      ref="listEl"
      class="flex-1 overflow-y-auto"
      @scroll="onScroll"
    >
      <div v-if="store.filteredEvents.length === 0" class="p-6 text-center text-gray-600 text-sm">
        No events yet. Waiting for agents to connect...
      </div>
      <div
        v-for="event in store.filteredEvents"
        :key="event.id"
        data-event-row
        class="event-row"
      >
        <EventItem :event="event" @open-transcript="openTranscript" />
      </div>
    </div>

    <TranscriptModal v-if="transcriptEvent" :event="transcriptEvent" @close="transcriptEvent = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useEventsStore } from '../stores/events'
import EventItem from './EventItem.vue'
import TranscriptModal from './TranscriptModal.vue'
import type { StoredEvent } from '../types/events'

const store = useEventsStore()
const listEl = ref<HTMLElement | null>(null)
const autoScroll = ref(true)
const transcriptEvent = ref<StoredEvent | null>(null)

function toggleAutoScroll() { autoScroll.value = !autoScroll.value }

function onScroll() {
  if (!listEl.value) return
  const { scrollTop } = listEl.value
  // Re-enable auto-scroll when user scrolls back to top (within 50px)
  autoScroll.value = scrollTop < 50
}

watch(() => store.filteredEvents.length, async () => {
  if (!autoScroll.value) return
  await nextTick()
  listEl.value?.scrollTo({ top: 0, behavior: 'smooth' })
})

function openTranscript(event: StoredEvent) {
  transcriptEvent.value = event
}
</script>

<style scoped>
.event-row {
  @apply border-b border-border/50 hover:bg-panel/60 transition-colors cursor-default;
}
</style>
