<template>
  <div data-backdrop class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div data-modal class="bg-panel border border-border rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <div class="text-sm font-semibold text-gray-200">
          📜 Transcript — <span class="text-cyan-400 font-mono text-xs">{{ event.session_id }}</span>
        </div>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-200 text-xl leading-none">×</button>
      </div>
      <div class="flex-1 overflow-auto p-4">
        <div v-if="loading" class="text-gray-500 text-sm text-center py-8">Loading transcript...</div>
        <div v-else-if="error" class="text-red-400 text-sm text-center py-8">{{ error }}</div>
        <div v-else-if="content" class="text-xs font-mono whitespace-pre-wrap text-gray-300 leading-relaxed">{{ content }}</div>
        <div v-else class="text-gray-500 text-sm text-center py-8">
          Transcript path: <code class="text-cyan-400">{{ transcriptPath }}</code>
        </div>
      </div>
      <div class="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-gray-600">
        <span>{{ transcriptPath }}</span>
        <span>{{ event.event_type }} · {{ timeStr }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { parseEvent } from '../types/events'
import type { StoredEvent } from '../types/events'

const props = defineProps<{ event: StoredEvent }>()
defineEmits<{ close: [] }>()

const parsed = computed(() => parseEvent(props.event))
const transcriptPath = computed(() => {
  const p = parsed.value.payload.transcript_path
  return typeof p === 'string' ? p : ''
})
const loading = ref(false)
const error = ref('')
const content = ref('')
const timeStr = computed(() => new Date(props.event.timestamp).toLocaleTimeString())

onMounted(async () => {
  if (!transcriptPath.value) return
  loading.value = true
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/transcript?path=${encodeURIComponent(transcriptPath.value)}`
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    content.value = await res.text()
  } catch (e) {
    error.value = `Could not load transcript: ${e instanceof Error ? e.message : String(e)}`
  } finally {
    loading.value = false
  }
})
</script>
