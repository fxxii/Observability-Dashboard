<template>
  <div
    class="flex items-start gap-2 px-2 py-1.5 text-xs"
    :style="{ borderLeft: `3px solid ${appColor}`, borderRight: `3px solid ${sessionColor}` }"
  >
    <!-- Emoji column -->
    <div class="flex flex-col items-center gap-0.5 w-8 flex-shrink-0 pt-0.5">
      <span class="text-sm leading-none">{{ eventEmoji }}</span>
      <span v-if="toolEmoji" class="text-xs leading-none">{{ toolEmoji }}</span>
    </div>

    <!-- Main content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-gray-300 font-semibold">{{ event.event_type }}</span>
        <span class="text-gray-600">·</span>
        <span class="text-gray-500 truncate max-w-[120px]" :title="event.session_id">{{ shortSessionId }}</span>
        <span class="text-gray-600">·</span>
        <span class="text-gray-600">{{ event.source_app }}</span>
        <span v-for="tag in parsedTags" :key="tag" class="px-1 py-0 bg-purple-900/40 text-purple-300 rounded text-[10px]">
          {{ tag }}
        </span>
      </div>
      <div class="text-gray-500 mt-0.5 truncate">{{ summary }}</div>
    </div>

    <!-- Timestamp + transcript link -->
    <div class="flex flex-col items-end gap-1 flex-shrink-0">
      <span class="text-gray-700 tabular-nums">{{ timeStr }}</span>
      <button
        v-if="hasTranscript"
        @click.stop="$emit('open-transcript', event)"
        class="text-[10px] text-cyan-600 hover:text-cyan-400"
      >transcript</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEventsStore } from '../stores/events'
import { EVENT_EMOJIS, TOOL_EMOJIS, parseEvent } from '../types/events'
import type { StoredEvent } from '../types/events'

const props = defineProps<{ event: StoredEvent }>()
defineEmits<{ 'open-transcript': [event: StoredEvent] }>()

const store = useEventsStore()
const parsed = computed(() => parseEvent(props.event))

const appColor = computed(() => store.appColors[props.event.source_app] ?? '#64748b')
const sessionColor = computed(() => store.sessionColors[props.event.session_id] ?? '#334155')

const eventEmoji = computed(() => EVENT_EMOJIS[props.event.event_type] ?? '❓')
const toolEmoji = computed(() => {
  const toolName = typeof parsed.value.payload.tool_name === 'string'
    ? parsed.value.payload.tool_name
    : null
  if (!toolName) return null
  if (toolName.startsWith('mcp__') || toolName.startsWith('mcp_')) return '🔌'
  return TOOL_EMOJIS[toolName] ?? null
})

const parsedTags = computed(() => parsed.value.tags)
const shortSessionId = computed(() => props.event.session_id.slice(0, 8))

const summary = computed(() => {
  const p = parsed.value.payload
  const toolName = typeof p.tool_name === 'string' ? p.tool_name : null
  const command = typeof p.command === 'string' ? p.command : null
  const model = typeof p.model === 'string' ? p.model : null
  const error = typeof p.error === 'string' ? p.error : null
  const message = typeof p.message === 'string' ? p.message : null

  if (toolName) return command ? `${toolName}: ${command.slice(0, 60)}` : toolName
  if (model) return `model: ${model}`
  if (error) return `error: ${error.slice(0, 80)}`
  if (message) return message.slice(0, 80)
  return ''
})

const hasTranscript = computed(() => Boolean(parsed.value.payload.transcript_path))

const timeStr = computed(() => {
  const d = new Date(props.event.timestamp)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
})
</script>
