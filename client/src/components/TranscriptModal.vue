<template>
  <div data-backdrop class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div data-modal class="bg-panel border border-border rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">

      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <div class="text-sm font-semibold text-gray-200">
          📜 Transcript — <span class="text-cyan-400 font-mono text-xs">{{ event.session_id }}</span>
        </div>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-200 text-xl leading-none">×</button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-auto p-4 space-y-3">
        <div v-if="loading" class="text-gray-500 text-sm text-center py-8">Loading transcript...</div>
        <div v-else-if="error" class="text-red-400 text-sm text-center py-8">{{ error }}</div>

        <!-- Human-readable turns -->
        <template v-else-if="turns.length">
          <div v-for="(turn, i) in turns" :key="i" class="flex gap-3">
            <!-- Role badge -->
            <div class="shrink-0 mt-0.5">
              <span v-if="turn.role === 'user'"    class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-900 text-blue-300">Human</span>
              <span v-else-if="turn.role === 'tool_result'" class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface text-gray-500">Result</span>
              <span v-else                          class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-900 text-purple-300">Claude</span>
            </div>
            <!-- Content -->
            <div class="flex-1 min-w-0 space-y-1">
              <div v-for="(block, j) in turn.blocks" :key="j">
                <!-- Plain text -->
                <p v-if="block.type === 'text'" class="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{{ block.text }}</p>
                <!-- Tool use -->
                <div v-else-if="block.type === 'tool_use'" class="bg-surface border border-border rounded px-3 py-2 text-xs">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-yellow-400 font-semibold">⚙ {{ block.name }}</span>
                    <span class="text-gray-600 font-mono text-[10px]">{{ block.id?.slice(0, 12) }}</span>
                  </div>
                  <pre class="text-gray-400 text-[10px] overflow-auto max-h-32">{{ formatInput(block.input) }}</pre>
                </div>
                <!-- Tool result -->
                <div v-else-if="block.type === 'tool_result'" class="bg-surface border border-border rounded px-3 py-2 text-xs">
                  <div class="text-gray-500 text-[10px] mb-1">tool_use_id: {{ block.tool_use_id?.slice(0, 12) }}</div>
                  <pre class="text-gray-400 text-[10px] overflow-auto max-h-32">{{ formatResult(block.content) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else-if="content" class="text-gray-500 text-sm text-center py-8">No messages to display.</div>
        <div v-else class="text-gray-500 text-sm text-center py-8">
          No transcript path found for this event.
        </div>
      </div>

      <!-- Footer -->
      <div class="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-gray-600">
        <span class="truncate max-w-xs">{{ transcriptPath }}</span>
        <div class="flex items-center gap-3 shrink-0">
          <button
            v-if="content"
            @click="copyJson"
            class="px-2 py-1 rounded bg-surface border border-border text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >{{ copied ? '✓ Copied' : 'Copy JSON' }}</button>
          <span>{{ event.event_type }} · {{ timeStr }}</span>
        </div>
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
const error   = ref('')
const content = ref('')
const copied  = ref(false)
const timeStr = computed(() => new Date(props.event.timestamp).toLocaleTimeString())

// ── Parse JSONL into display turns ───────────────────────────────────────────
interface Block {
  type: 'text' | 'tool_use' | 'tool_result'
  text?: string
  name?: string
  id?: string
  input?: unknown
  tool_use_id?: string
  content?: unknown
}
interface Turn { role: string; blocks: Block[] }

const turns = computed<Turn[]>(() => {
  if (!content.value) return []
  const result: Turn[] = []
  for (const line of content.value.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>
      // Claude Code JSONL: each line has a `type` field
      const msgType = obj.type as string
      if (msgType === 'user' || msgType === 'assistant') {
        const msg = (obj.message ?? obj) as Record<string, unknown>
        const role = (msg.role as string) ?? msgType
        const rawContent = msg.content ?? obj.content
        const blocks = parseContent(rawContent)
        if (blocks.length) result.push({ role, blocks })
      }
      // tool_result lines sometimes appear at top level
      else if (msgType === 'tool_result') {
        result.push({ role: 'tool_result', blocks: [{ type: 'tool_result', tool_use_id: obj.tool_use_id as string, content: obj.content }] })
      }
    } catch { /* skip malformed lines */ }
  }
  return result
})

function parseContent(raw: unknown): Block[] {
  if (typeof raw === 'string') return [{ type: 'text', text: raw }]
  if (!Array.isArray(raw)) return []
  const blocks: Block[] = []
  for (const item of raw as Record<string, unknown>[]) {
    const t = item.type as string
    if (t === 'text')        blocks.push({ type: 'text',        text: item.text as string })
    else if (t === 'tool_use')    blocks.push({ type: 'tool_use',    name: item.name as string, id: item.id as string, input: item.input })
    else if (t === 'tool_result') blocks.push({ type: 'tool_result', tool_use_id: item.tool_use_id as string, content: item.content })
  }
  return blocks
}

function formatInput(input: unknown): string {
  if (input === null || input === undefined) return ''
  try { return JSON.stringify(input, null, 2) } catch { return String(input) }
}

function formatResult(content: unknown): string {
  if (typeof content === 'string') return content.slice(0, 500) + (content.length > 500 ? '…' : '')
  try { return JSON.stringify(content, null, 2).slice(0, 500) } catch { return String(content) }
}

// ── Copy raw JSON ─────────────────────────────────────────────────────────────
async function copyJson() {
  try {
    await navigator.clipboard.writeText(content.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard not available */ }
}

// ── Load transcript ───────────────────────────────────────────────────────────
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
