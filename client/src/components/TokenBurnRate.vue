<template>
  <div class="p-3 text-xs">
    <div class="text-gray-500 font-semibold mb-2">💰 Token Burn Rate</div>
    <div class="flex items-baseline gap-1 mb-1">
      <span class="text-2xl font-mono" :class="burnAlert ? 'text-red-400 animate-pulse' : 'text-green-400'">${{ totalCostUsd.toFixed(4) }}</span>
      <span class="text-gray-600">total</span>
    </div>
    <div class="text-gray-500 mb-2">
      <span :class="burnAlert ? 'text-red-400' : 'text-gray-400'">${{ burnRatePerMinute.toFixed(4) }}/min</span>
      <span v-if="burnAlert" class="text-red-400 ml-1">⚠️ High burn</span>
    </div>
    <div class="space-y-1">
      <div v-for="(cost, sid) in topSessions" :key="sid" class="flex justify-between">
        <span class="font-mono text-gray-500">{{ String(sid).slice(0, 8) }}</span>
        <span class="text-gray-400">${{ cost.toFixed(4) }}</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useTokenBurn } from '../composables/useTokenBurn'
const BURN_ALERT_THRESHOLD = 1.0
const { totalCostUsd, costBySession, burnRatePerMinute } = useTokenBurn()
const burnAlert = computed(() => burnRatePerMinute.value >= BURN_ALERT_THRESHOLD)
const topSessions = computed(() => Object.fromEntries(Object.entries(costBySession.value).sort(([, a], [, b]) => b - a).slice(0, 5)))
</script>
