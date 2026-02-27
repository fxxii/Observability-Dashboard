<template>
  <div v-if="stall" class="flex items-center gap-1 text-red-400 text-[10px] font-mono">
    <span class="animate-pulse">⚠️</span>
    <span>No activity — {{ elapsedStr }}</span>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useStallDetection } from '../composables/useStallDetection'
const props = defineProps<{ sessionId: string }>()
const { stalledSessions } = useStallDetection()
const stall = computed(() => stalledSessions.value[props.sessionId])
const elapsedStr = computed(() => {
  if (!stall.value) return ''
  const s = Math.floor(stall.value.elapsedMs / 1000)
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`
})
</script>
