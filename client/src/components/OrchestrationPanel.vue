<template>
  <div class="h-full flex flex-col text-xs overflow-auto">
    <div class="px-3 py-1.5 border-b border-border font-semibold text-gray-400">⚡ Lead Agent</div>
    <div class="px-3 py-2 border-b border-border">
      <div class="text-gray-500 mb-1">Current Phase</div>
      <div class="flex items-center gap-2">
        <span class="text-cyan-400 font-semibold">{{ currentPhase }}</span>
        <span v-if="currentPhase !== 'idle'" class="animate-pulse" :class="currentPhase === 'active' ? 'text-green-400' : 'text-yellow-400'">●</span>
      </div>
      <div class="flex gap-2 mt-2 flex-wrap">
        <div v-for="phase in PHASES" :key="phase" :class="phase === currentPhase ? 'bg-cyan-700 text-cyan-100' : 'bg-surface text-gray-600'" class="px-2 py-0.5 rounded text-[10px]">{{ phase }}</div>
      </div>
    </div>
    <div class="px-3 py-2 border-b border-border">
      <div class="text-gray-500 mb-1">Active Subagents ({{ activeSubagents.length }})</div>
      <div v-if="activeSubagents.length === 0" class="text-gray-700">None</div>
      <div v-for="a in activeSubagents" :key="a.session_id" class="flex items-center gap-2 py-0.5">
        <span class="text-green-400">🟢</span>
        <span class="font-mono text-gray-400">{{ a.session_id.slice(0, 8) }}</span>
        <span class="text-gray-600">{{ a.agent_type }}</span>
      </div>
    </div>
    <div class="px-3 py-2">
      <div class="text-gray-500 mb-1">Review Gates</div>
      <div v-if="Object.keys(reviewGates).length === 0" class="text-gray-700">No tasks tracked</div>
      <div v-for="(gate, sid) in reviewGates" :key="sid" class="flex items-center gap-2 py-0.5">
        <span class="font-mono text-gray-500">{{ String(sid).slice(0, 8) }}</span>
        <span :class="gateClass(gate.implementer)">Impl</span>
        <span :class="gateClass(gate.spec)">Spec</span>
        <span :class="gateClass(gate.quality)">QA</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useOrchestration } from '../composables/useOrchestration'
const PHASES = ['brainstorm', 'write-plan', 'execute-plan', 'finish', 'active']
const { currentPhase, activeSubagents, reviewGates } = useOrchestration()
function gateClass(status?: string) {
  if (!status) return 'px-1 rounded bg-surface text-gray-700'
  if (status === 'in-progress') return 'px-1 rounded bg-yellow-800 text-yellow-200'
  if (status.includes('pass') || status === 'complete') return 'px-1 rounded bg-green-800 text-green-200'
  return 'px-1 rounded bg-red-800 text-red-200'
}
</script>
