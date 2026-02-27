<template>
  <div class="h-full flex flex-col text-xs">
    <div class="px-3 py-1.5 border-b border-border font-semibold text-gray-400">🔍 Auditor — Commits</div>
    <div class="flex-1 overflow-auto">
      <div v-if="commits.length === 0" class="p-3 text-gray-700">Waiting for commits...</div>
      <div v-for="c in commits" :key="c.id" class="px-3 py-1.5 border-b border-border/50 hover:bg-panel/60">
        <div class="flex items-center gap-2">
          <span class="font-mono text-yellow-400">{{ c.hash }}</span>
          <span class="text-gray-600">·</span>
          <span class="font-mono text-gray-500">{{ c.session.slice(0, 8) }}</span>
        </div>
        <div class="text-gray-300 mt-0.5 truncate">{{ c.message }}</div>
        <div class="text-gray-700 mt-0.5">{{ c.timeStr }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useEventsStore } from '../stores/events'
import { parseEvent } from '../types/events'
const store = useEventsStore()
const commits = computed(() =>
  store.events.filter(e => { const p = parseEvent(e).payload; return p.commit_hash || p.commit_message })
    .slice(0, 50)
    .map(e => { const p = parseEvent(e).payload; return { id: e.id, hash: String(p.commit_hash ?? '').slice(0, 7) || '???', message: String(p.commit_message ?? '(no message)'), session: e.session_id, timeStr: new Date(e.timestamp).toLocaleTimeString() } })
)
</script>
