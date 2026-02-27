<template>
  <div :style="{ paddingLeft: `${depth * 16}px` }" class="py-0.5">
    <div class="flex items-center gap-2">
      <span>{{ node.stopped ? '⬛' : '🟢' }}</span>
      <span class="font-mono text-gray-300">{{ node.session_id.slice(0, 8) }}</span>
      <span class="text-gray-600">{{ node.agent_type }}</span>
      <span v-if="node.children.length" class="text-gray-700">({{ node.children.length }} children)</span>
    </div>
    <TraceNode v-for="child in node.children" :key="child.session_id" :node="child" :depth="depth + 1" />
  </div>
</template>
<script setup lang="ts">
import type { AgentNode } from '../composables/useAgentTree'
defineProps<{ node: AgentNode; depth: number }>()
</script>
