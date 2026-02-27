<template>
  <div class="flex flex-col gap-2 p-3 border-t border-border bg-panel/50 text-xs">
    <div class="flex items-center justify-between">
      <span class="font-semibold text-gray-400">Time-Travel Debugger</span>
      <button v-if="store.rewindTime" @click="store.clearRewind()" class="text-cyan-500 hover:text-cyan-300">
        Exit rewind mode
      </button>
      <span v-else class="text-gray-600">Drag to rewind</span>
    </div>

    <div class="flex items-center gap-3">
      <span class="text-gray-600 tabular-nums w-20">{{ minTimeStr }}</span>
      <input
        type="range"
        :min="minTimestamp"
        :max="maxTimestamp"
        :value="sliderValue"
        @input="onSlider"
        class="flex-1 accent-cyan-500"
        :disabled="store.events.length === 0"
      />
      <span class="text-gray-300 tabular-nums w-20 text-right">{{ currentTimeStr }}</span>
    </div>

    <div v-if="store.rewindTime" class="flex items-center gap-2">
      <span class="text-amber-400">Viewing state at {{ currentTimeStr }}</span>
      <span class="text-gray-500">({{ store.filteredEvents.length }} events visible)</span>
      <button
        @click="forkFromHere"
        class="ml-auto px-2 py-1 bg-purple-800 hover:bg-purple-700 text-purple-100 rounded transition-colors"
      >Fork from Here</button>
    </div>

    <div v-if="forkCommand" class="bg-surface border border-border rounded p-2">
      <div class="text-gray-500 mb-1">Run this to replay from this point:</div>
      <pre class="text-green-400 text-[10px] whitespace-pre-wrap overflow-auto max-h-32">{{ forkCommand }}</pre>
      <button @click="copyFork" class="mt-1 text-gray-500 hover:text-gray-300">Copy</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEventsStore } from '../stores/events'
import { parseEvent } from '../types/events'

const store = useEventsStore()
const forkCommand = ref('')

const minTimestamp = computed(() => {
  if (store.events.length === 0) return Date.now() - 3600_000
  return Math.min(...store.events.map(e => e.timestamp))
})

const maxTimestamp = computed(() => {
  if (store.events.length === 0) return Date.now()
  return Math.max(...store.events.map(e => e.timestamp))
})

const sliderValue = computed(() => store.rewindTime ?? maxTimestamp.value)

const minTimeStr = computed(() => new Date(minTimestamp.value).toLocaleTimeString())
const currentTimeStr = computed(() => new Date(sliderValue.value).toLocaleTimeString())

function onSlider(e: Event) {
  const ts = Number((e.target as HTMLInputElement).value)
  store.setRewindTime(ts)
}

function forkFromHere() {
  const prompts = store.filteredEvents
    .filter(e => e.event_type === 'UserPromptSubmit')
    .map(e => {
      const p = parseEvent(e).payload.prompt
      return typeof p === 'string' ? p : null
    })
    .filter((p): p is string => p !== null)
  const context = prompts.map((p, i) => `[Turn ${i + 1}]: ${p.slice(0, 200)}`).join('\n')
  forkCommand.value = `claude --resume\n\n# Context up to ${currentTimeStr.value}:\n${context}`
}

function copyFork() {
  navigator.clipboard.writeText(forkCommand.value).catch(() => {})
}
</script>
