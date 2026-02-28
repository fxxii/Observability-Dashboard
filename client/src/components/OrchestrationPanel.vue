<template>
  <div class="h-full flex flex-col text-xs overflow-auto">
    <div class="px-3 py-1.5 border-b border-border font-semibold text-gray-400">⚡ Lead Agent</div>

    <!-- Phase -->
    <div class="px-3 py-2 border-b border-border flex items-center gap-2">
      <span class="text-gray-500 w-14 shrink-0">Phase</span>
      <span class="font-semibold" :class="phaseColor">{{ currentPhase }}</span>
      <span v-if="currentPhase !== 'idle'" class="animate-pulse"
        :class="currentPhase === 'active' ? 'text-green-400' : 'text-yellow-400'">●</span>
    </div>

    <!-- Subagent task counter -->
    <div class="px-3 py-2 border-b border-border flex items-center gap-2">
      <span class="text-gray-500 w-14 shrink-0">Tasks</span>
      <span v-if="totalDispatched > 0" class="text-white font-semibold">
        {{ totalCompleted }} of {{ totalDispatched }} complete
      </span>
      <span v-if="runningCount > 0" class="text-yellow-400">· {{ runningCount }} running</span>
      <span v-if="totalDispatched === 0" class="text-gray-700">—</span>
    </div>

    <!-- Subagent dispatch history (T1…TN) -->
    <div class="px-3 py-2 border-b border-border">
      <div class="text-gray-500 mb-1.5">Subagents</div>
      <div v-if="taskSlots.length === 0" class="text-gray-700">None dispatched</div>
      <div class="flex flex-wrap gap-2">
        <span v-for="t in taskSlots" :key="t.n"
          class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
          :class="t.done ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'">
          T{{ t.n }} {{ t.done ? '✓' : '⏳' }}
          <span v-if="t.elapsed" class="text-[9px] opacity-70">{{ t.elapsed }}</span>
        </span>
      </div>
    </div>

    <!-- Context pressure -->
    <div class="px-3 py-2 border-b border-border flex items-center gap-2">
      <span class="text-gray-500 w-14 shrink-0">Context</span>
      <span class="font-mono" :class="ctxColor">{{ ctxBar }}</span>
      <span class="font-semibold" :class="ctxColor">{{ ctxPct }}%</span>
      <span v-if="ctxStatus !== 'green'" class="text-[10px] px-1.5 py-0.5 rounded font-semibold"
        :class="ctxStatus === 'red' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'">
        {{ ctxStatus }}
      </span>
    </div>

    <!-- Burn rate -->
    <div class="px-3 py-2 border-b border-border flex items-center gap-2">
      <span class="text-gray-500 w-14 shrink-0">Burn</span>
      <span :class="burnRate === '0.00' ? 'text-gray-600' : 'text-orange-400'">${{ burnRate }}/min</span>
      <span class="text-gray-600">·</span>
      <span class="text-green-400">{{ totalDispatched - totalCompleted }} agent{{ (totalDispatched - totalCompleted) !== 1 ? 's' : '' }} active</span>
    </div>

    <!-- Stall -->
    <div class="px-3 py-2 flex items-center gap-2">
      <span class="text-gray-500 w-14 shrink-0">Stall</span>
      <span v-if="firstStall" class="text-amber-400">
        <span class="font-mono">{{ firstStall.shortId }}</span>
        <span class="text-gray-500"> — no activity {{ firstStall.elapsed }}</span>
      </span>
      <span v-else class="text-gray-700">None</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOrchestration }   from '../composables/useOrchestration'
import { useContextPressure } from '../composables/useContextPressure'
import { useTokenBurn }       from '../composables/useTokenBurn'
import { useStallDetection }  from '../composables/useStallDetection'
import { useEventsStore }     from '../stores/events'

const store = useEventsStore()
const { currentPhase }       = useOrchestration()
const { pressureBySession }  = useContextPressure()
const { burnRatePerMinute }  = useTokenBurn()
const { stalledSessions }    = useStallDetection()

// ── Phase color ───────────────────────────────────────────────────────────────
const phaseColor = computed(() => {
  const p = currentPhase.value
  if (p === 'idle')         return 'text-gray-600'
  if (p === 'active')       return 'text-green-400'
  if (p === 'execute-plan') return 'text-cyan-400'
  if (p === 'finish')       return 'text-emerald-400'
  return 'text-yellow-400'
})

// ── Subagent sequence tracking ────────────────────────────────────────────────
// SubagentStart/Stop all share the lead session_id.
// Match them in FIFO order by timestamp: 1st Start ↔ 1st Stop = T1, etc.
const subStarts = computed(() =>
  [...store.events]
    .filter(e => e.event_type === 'SubagentStart')
    .sort((a, b) => a.timestamp - b.timestamp)
)
const subStops = computed(() =>
  [...store.events]
    .filter(e => e.event_type === 'SubagentStop')
    .sort((a, b) => a.timestamp - b.timestamp)
)

const totalDispatched = computed(() => subStarts.value.length)
const totalCompleted  = computed(() => subStops.value.length)
const runningCount    = computed(() => totalDispatched.value - totalCompleted.value)

const taskSlots = computed(() => {
  const now = Date.now()
  return subStarts.value.map((start, i) => {
    const stop = subStops.value[i]
    const endTs = stop?.timestamp ?? now
    const ms = endTs - start.timestamp
    const secs = Math.floor(ms / 1000)
    const elapsed = secs >= 60 ? `${Math.floor(secs / 60)}m${secs % 60}s` : `${secs}s`
    return { n: i + 1, done: !!stop, elapsed: stop ? elapsed : '' }
  })
})

// ── Context pressure ──────────────────────────────────────────────────────────
const worstPressure = computed(() => {
  const entries = Object.values(pressureBySession.value)
  if (!entries.length) return { fillPercent: 0, status: 'green' as const }
  return entries.reduce((w, p) => p.fillPercent > w.fillPercent ? p : w)
})
const ctxPct    = computed(() => worstPressure.value.fillPercent)
const ctxStatus = computed(() => worstPressure.value.status)
const ctxColor  = computed(() =>
  ctxStatus.value === 'red' ? 'text-red-400' : ctxStatus.value === 'amber' ? 'text-yellow-400' : 'text-green-400'
)
const ctxBar = computed(() => {
  const n = Math.round(ctxPct.value / 10)
  return '█'.repeat(n) + '░'.repeat(10 - n)
})

// ── Burn rate ─────────────────────────────────────────────────────────────────
const burnRate = computed(() => burnRatePerMinute.value.toFixed(2))

// ── Stall ─────────────────────────────────────────────────────────────────────
const firstStall = computed(() => {
  const entries = Object.entries(stalledSessions.value)
  if (!entries.length) return null
  const [sid, info] = entries.reduce((w, c) => c[1].elapsedMs > w[1].elapsedMs ? c : w)
  const secs = Math.floor(info.elapsedMs / 1000)
  return {
    shortId: sid.slice(0, 4),
    elapsed: secs >= 120 ? `${Math.floor(secs / 60)}m` : `${secs}s`
  }
})
</script>
