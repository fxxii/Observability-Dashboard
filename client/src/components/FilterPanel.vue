<template>
  <div class="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-panel/50 flex-wrap text-xs">
    <span class="text-gray-500 font-semibold">Filter:</span>

    <select data-filter="source_app" :value="localFilters.source_app" @change="onFilterChange('source_app', $event)"
      class="bg-surface border border-border text-gray-300 rounded px-2 py-0.5 text-xs">
      <option value="">All apps</option>
      <option v-for="app in sourceApps" :key="app" :value="app">{{ app }}</option>
    </select>

    <select data-filter="event_type" :value="localFilters.event_type" @change="onFilterChange('event_type', $event)"
      class="bg-surface border border-border text-gray-300 rounded px-2 py-0.5 text-xs">
      <option value="">All event types</option>
      <option v-for="t in eventTypes" :key="t" :value="t">{{ t }}</option>
    </select>

    <select data-filter="session_id" :value="localFilters.session_id" @change="onFilterChange('session_id', $event)"
      class="bg-surface border border-border text-gray-300 rounded px-2 py-0.5 text-xs">
      <option value="">All sessions</option>
      <option v-for="s in sessionIds" :key="s" :value="s">{{ s.slice(0, 8) }}</option>
    </select>

    <select data-filter="tag" :value="localFilters.tag" @change="onFilterChange('tag', $event)"
      class="bg-surface border border-border text-gray-300 rounded px-2 py-0.5 text-xs">
      <option value="">All tags</option>
      <option v-for="t in tags" :key="t" :value="t">{{ t }}</option>
    </select>

    <button data-clear-filters @click="clearAll" class="text-gray-600 hover:text-red-400 transition-colors ml-1">✕ clear</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref, computed } from 'vue'
import { useEventsStore } from '../stores/events'

const store = useEventsStore()
const localFilters = reactive({ source_app: '', event_type: '', session_id: '', tag: '' })

interface FilterOptions { apps: string[]; sessions: string[]; event_types: string[]; tags: string[] }
const serverOptions = ref<FilterOptions>({ apps: [], sessions: [], event_types: [], tags: [] })

async function loadOptions() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/events/filter-options`)
    if (!res.ok) {
      console.warn('[FilterPanel] Failed to load options: HTTP', res.status)
      return
    }
    const data = await res.json() as FilterOptions
    serverOptions.value = {
      apps: Array.isArray(data.apps) ? data.apps : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      event_types: Array.isArray(data.event_types) ? data.event_types : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
    }
  } catch (err) {
    console.warn('[FilterPanel] Failed to load filter options:', err)
  }
}

onMounted(loadOptions)

// Derive options from both server results and current store events (for test compatibility)
const sourceApps = computed(() => {
  const fromStore = [...new Set(store.events.map(e => e.source_app))].filter(Boolean)
  const fromServer = serverOptions.value.apps ?? []
  return [...new Set([...fromStore, ...fromServer])]
})

const eventTypes = computed(() => {
  const fromStore = [...new Set(store.events.map(e => e.event_type))].filter(Boolean)
  const fromServer = serverOptions.value.event_types ?? []
  return [...new Set([...fromStore, ...fromServer])]
})

const sessionIds = computed(() => {
  const fromStore = [...new Set(store.events.map(e => e.session_id))].filter(Boolean)
  const fromServer = serverOptions.value.sessions ?? []
  return [...new Set([...fromStore, ...fromServer])]
})

const tags = computed(() => {
  const fromStore = store.events.flatMap(e => {
    try { return JSON.parse(e.tags) as string[] } catch { return [] }
  })
  const fromServer = serverOptions.value.tags ?? []
  return [...new Set([...fromStore, ...fromServer])]
})

function onFilterChange(key: 'source_app' | 'event_type' | 'session_id' | 'tag', event: Event) {
  const value = (event.target as HTMLSelectElement).value
  localFilters[key] = value
  store.setFilter(key, value || null)
}

function clearAll() {
  Object.assign(localFilters, { source_app: '', event_type: '', session_id: '', tag: '' })
  store.clearFilters()
  loadOptions()
}
</script>
