<template>
  <div class="h-full flex flex-col text-xs">
    <div class="px-3 py-1.5 border-b border-border flex items-center justify-between">
      <span class="font-semibold text-gray-400">🌳 Agent Trace</span>
      <button @click="$emit('close')" class="text-gray-600 hover:text-gray-300">✕</button>
    </div>
    <div class="flex-1 overflow-auto p-3">
      <div v-if="roots.length === 0" class="text-gray-700">No agent hierarchy detected.</div>
      <TraceNode v-for="root in roots" :key="root.session_id" :node="root" :depth="0" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAgentTree } from '../composables/useAgentTree'
import TraceNode from './TraceNode.vue'
defineEmits<{ close: [] }>()
const { roots } = useAgentTree()
</script>
