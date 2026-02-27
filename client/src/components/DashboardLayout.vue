<template>
  <!-- Header -->
  <header class="flex items-center justify-between px-4 py-2 border-b border-border bg-panel">
    <div class="flex items-center gap-2">
      <span class="text-cyan-400 font-bold text-sm">Agent Observability</span>
      <span class="text-xs text-gray-500">{{ connectedText }}</span>
    </div>
    <div class="flex items-center gap-3 text-xs text-gray-500">
      <span>{{ eventCount }} events</span>
      <span :class="connected ? 'text-green-400' : 'text-red-400'">
        {{ connected ? '● LIVE' : '○ DISCONNECTED' }}
      </span>
    </div>
  </header>

  <!-- Top row: Auditor/Critic + Lead -->
  <div class="flex h-[45vh] border-b border-border">
    <!-- Left column -->
    <div class="w-80 flex flex-col border-r border-border flex-shrink-0">
      <div data-panel="auditor" class="flex-1 border-b border-border overflow-hidden">
        <slot name="auditor" />
      </div>
      <div data-panel="critic" class="flex-1 overflow-hidden">
        <slot name="critic" />
      </div>
    </div>
    <!-- Lead panel -->
    <div data-panel="lead" class="flex-1 overflow-hidden">
      <slot name="lead" />
    </div>
  </div>

  <!-- Bottom row: Timeline + Pulse -->
  <div class="flex h-[calc(55vh-3rem)]">
    <div data-panel="timeline" class="flex-1 border-r border-border overflow-hidden">
      <slot name="timeline" />
    </div>
    <div data-panel="pulse" class="w-96 overflow-hidden flex-shrink-0">
      <slot name="pulse" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWebSocket } from '../composables/useWebSocket'
import { useEventsStore } from '../stores/events'

const { connected } = useWebSocket()
const store = useEventsStore()
const eventCount = computed(() => store.events.length)
const connectedText = computed(() => connected.value ? 'ws://localhost:4000' : 'reconnecting...')
</script>
