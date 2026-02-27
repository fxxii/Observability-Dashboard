<template>
  <div class="p-3 text-xs">
    <div class="text-gray-500 font-semibold mb-2">🧠 Context Window</div>
    <div v-if="Object.keys(pressureBySession).length === 0" class="text-gray-700">No active sessions</div>
    <div v-for="(pressure, sid) in pressureBySession" :key="sid" class="mb-2">
      <div class="flex items-center justify-between mb-1">
        <span class="font-mono text-gray-400">{{ String(sid).slice(0, 8) }}</span>
        <span :class="badgeClass(pressure.status)" class="px-1.5 py-0.5 rounded text-[10px]">{{ pressure.status.toUpperCase() }}{{ pressure.compactCount > 0 ? ` (${pressure.compactCount}× compact)` : '' }}</span>
      </div>
      <div class="w-full bg-surface rounded-full h-1.5 overflow-hidden">
        <div :class="barClass(pressure.status)" class="h-full rounded-full transition-all duration-500" :style="{ width: `${pressure.fillPercent}%` }" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useContextPressure } from '../composables/useContextPressure'
const { pressureBySession } = useContextPressure()
function badgeClass(s: string) { return s === 'red' ? 'bg-red-900 text-red-300' : s === 'amber' ? 'bg-amber-900 text-amber-300' : 'bg-green-900/50 text-green-400' }
function barClass(s: string) { return s === 'red' ? 'bg-red-500' : s === 'amber' ? 'bg-amber-500' : 'bg-green-500' }
</script>
