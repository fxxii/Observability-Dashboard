<template>
  <div class="h-full flex flex-col text-xs overflow-auto">
    <div class="px-3 py-1.5 border-b border-border font-semibold text-gray-400">⚡ Lead Agent</div>

    <!-- Phase -->
    <div class="px-3 py-2 border-b border-border flex items-center gap-2">
      <span class="text-gray-500 w-14 shrink-0">Phase</span>
      <span class="font-semibold" :class="phaseColor">{{ currentPhase }}</span>
      <span v-if="currentPhase !== 'idle'" class="animate-pulse" :class="currentPhase === 'active' ? 'text-green-400' : 'text-yellow-400'">●</span>
    </div>

    <!-- Task progress -->
    <div class="px-3 py-2 border-b border-border flex items-center gap-2">
      <span class="text-gray-500 w-14 shrink-0">Task</span>
      <span v-if="totalTasks > 0" class="text-white font-semibold">{{ currentTaskNum }} of {{ totalTasks }}</span>
      <span v-if="currentTaskStatus" class="text-gray-400">— {{ currentTaskStatus }}</span>
      <span v-if="totalTasks === 0" class="text-gray-700">—</span>
    </div>

    <!-- Review gates -->
    <div class="px-3 py-2 border-b border-border">
      <div class="text-gray-500 mb-1.5">Review gates</div>
      <div v-if="labeledGates.length === 0" class="text-gray-700">No tasks tracked</div>
      <div class="flex flex-wrap gap-x-3 gap-y-1">
        <span v-for="g in labeledGates" :key="g.label" class="flex items-center gap-1">
          <span class="text-gray-500">{{ g.label }}</span>
          <span :class="gateImplCls(g.gate.implementer)">Impl</span>
          <span :class="gateCls(g.gate.spec)">Spec</span>
          <span :class="gateCls(g.gate.quality)">QA</span>
        </span>
      </div>
    </div>

    <!-- Context pressure (worst active session) -->
    <div class="px-3 py-2 border-b border-border flex items-center gap-2">
      <span class="text-gray-500 w-14 shrink-0">Context</span>
      <span class="font-mono" :class="ctxColor">{{ ctxBar }}</span>
      <span class="font-semibold" :class="ctxColor">{{ ctxPct }}%</span>
      <span v-if="ctxStatus !== 'green'" class="text-[10px] px-1.5 py-0.5 rounded font-semibold"
        :class="ctxStatus === 'red' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'">{{ ctxStatus }}</span>
    </div>

    <!-- Burn rate + active agents -->
    <div class="px-3 py-2 border-b border-border flex items-center gap-2">
      <span class="text-gray-500 w-14 shrink-0">Burn</span>
      <span class="text-orange-400">${{ burnRate }}/min</span>
      <span class="text-gray-600">·</span>
      <span class="text-green-400">{{ activeSubagents.length }} agent{{ activeSubagents.length !== 1 ? 's' : '' }} active</span>
    </div>

    <!-- Stall detection -->
    <div class="px-3 py-2">
      <span class="text-gray-500 w-14 shrink-0 inline-block">Stall</span>
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
import { useOrchestration }    from '../composables/useOrchestration'
import { useContextPressure }  from '../composables/useContextPressure'
import { useTokenBurn }        from '../composables/useTokenBurn'
import { useStallDetection }   from '../composables/useStallDetection'
import { useEventsStore }      from '../stores/events'

const store = useEventsStore()
const { currentPhase, activeSubagents, reviewGates } = useOrchestration()
const { pressureBySession } = useContextPressure()
const { burnRatePerMinute }  = useTokenBurn()
const { stalledSessions }    = useStallDetection()

// ── Phase color ──────────────────────────────────────────────────────────────
const phaseColor = computed(() => {
  if (currentPhase.value === 'idle')         return 'text-gray-600'
  if (currentPhase.value === 'active')       return 'text-green-400'
  if (currentPhase.value === 'execute-plan') return 'text-cyan-400'
  if (currentPhase.value === 'finish')       return 'text-emerald-400'
  return 'text-yellow-400'
})

// ── Task progress ────────────────────────────────────────────────────────────
// Order implementer sessions by their first SubagentStart timestamp
const orderedTaskSessions = computed(() => {
  const sessions: { sid: string; ts: number }[] = []
  const seen = new Set<string>()
  ;[...store.events].sort((a, b) => a.timestamp - b.timestamp).forEach(e => {
    if (e.event_type === 'SubagentStart' && !seen.has(e.session_id)) {
      seen.add(e.session_id)
      sessions.push({ sid: e.session_id, ts: e.timestamp })
    }
  })
  return sessions
})

const totalTasks   = computed(() => orderedTaskSessions.value.length)

const currentTaskNum = computed(() => {
  // The last task that has any gate entry, or latest subagent
  const gates = reviewGates.value
  const ordered = orderedTaskSessions.value
  // Find the highest index task that is in-progress or latest
  for (let i = ordered.length - 1; i >= 0; i--) {
    if (gates[ordered[i].sid]) return i + 1
  }
  return ordered.length || 0
})

const currentTaskStatus = computed(() => {
  const gates = reviewGates.value
  const ordered = orderedTaskSessions.value
  const idx = currentTaskNum.value - 1
  if (idx < 0 || idx >= ordered.length) return ''
  const gate = gates[ordered[idx].sid]
  if (!gate) return 'Implementer dispatched'
  if (gate.quality === 'in-progress') return 'QA review'
  if (gate.spec    === 'in-progress') return 'Spec review'
  if (gate.implementer === 'in-progress') return 'Implementer running'
  const o = gate.implementer ?? ''
  if (o.includes('pass') || o === 'complete') return 'Complete'
  return o || 'In progress'
})

// ── Labeled review gates ─────────────────────────────────────────────────────
const labeledGates = computed(() => {
  const ordered = orderedTaskSessions.value
  const gates   = reviewGates.value
  return ordered
    .map((s, i) => ({ label: `T${i + 1}`, gate: gates[s.sid] ?? {} }))
    .filter(g => Object.keys(g.gate).length > 0)
})

function gateImplCls(status?: string) {
  if (!status)                                       return 'px-1 rounded bg-surface text-gray-700'
  if (status === 'in-progress')                      return 'px-1 rounded bg-yellow-800 text-yellow-200'
  if (status.includes('pass') || status === 'complete') return 'px-1 rounded bg-green-800 text-green-200'
  return 'px-1 rounded bg-red-800 text-red-200'
}
function gateCls(status?: string) {
  if (!status)                  return 'px-1 rounded bg-surface text-gray-700'
  if (status === 'in-progress') return 'px-1 rounded bg-yellow-800 text-yellow-200'
  return 'px-1 rounded bg-green-800 text-green-200'
}

// ── Context pressure (worst active session) ───────────────────────────────────
const worstPressure = computed(() => {
  const entries = Object.entries(pressureBySession.value)
  if (!entries.length) return { fillPercent: 0, status: 'green' as const, compactCount: 0 }
  return entries.reduce((worst, [, p]) => p.fillPercent > worst.fillPercent ? p : worst, entries[0][1])
})

const ctxPct    = computed(() => worstPressure.value.fillPercent)
const ctxStatus = computed(() => worstPressure.value.status)
const ctxColor  = computed(() => ctxStatus.value === 'red' ? 'text-red-400' : ctxStatus.value === 'amber' ? 'text-yellow-400' : 'text-green-400')
const ctxBar    = computed(() => {
  const filled = Math.round(ctxPct.value / 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
})

// ── Burn rate ────────────────────────────────────────────────────────────────
const burnRate = computed(() => burnRatePerMinute.value.toFixed(2))

// ── Stall ────────────────────────────────────────────────────────────────────
const firstStall = computed(() => {
  const entries = Object.entries(stalledSessions.value)
  if (!entries.length) return null
  const [sid, info] = entries.reduce((worst, cur) => cur[1].elapsedMs > worst[1].elapsedMs ? cur : worst)
  const secs = Math.floor(info.elapsedMs / 1000)
  const elapsed = secs >= 120 ? `${Math.floor(secs / 60)}m` : `${secs}s`
  return { shortId: sid.slice(0, 4), elapsed }
})
</script>
