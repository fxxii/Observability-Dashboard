<template>
  <div
    v-if="pendingIntercepts.length > 0"
    class="fixed top-4 right-4 z-50 w-96 space-y-2"
  >
    <div
      v-for="intercept in pendingIntercepts"
      :key="intercept.id"
      class="bg-panel border border-amber-500 rounded-lg shadow-2xl p-4 text-xs"
    >
      <div class="flex items-center gap-2 mb-2">
        <span class="text-amber-400 font-bold text-sm">HITL Intercept</span>
        <span class="text-gray-500 font-mono">{{ intercept.session_id.slice(0, 8) }}</span>
      </div>
      <div class="mb-2">
        <span class="text-gray-500">Tool:</span>
        <span class="text-gray-200 ml-1 font-semibold">{{ intercept.tool_name }}</span>
      </div>
      <div class="mb-3 bg-surface rounded p-2 font-mono text-gray-300 break-all">
        {{ intercept.command }}
      </div>
      <div class="flex gap-2">
        <button
          @click="sendDecision(intercept.id, 'approve')"
          class="flex-1 py-1.5 bg-green-700 hover:bg-green-600 text-green-100 rounded font-semibold transition-colors"
        >Approve</button>
        <button
          @click="sendDecision(intercept.id, 'block')"
          class="flex-1 py-1.5 bg-red-800 hover:bg-red-700 text-red-100 rounded font-semibold transition-colors"
        >Block</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHitl } from '../composables/useHitl'
const { pendingIntercepts, sendDecision } = useHitl()
</script>
