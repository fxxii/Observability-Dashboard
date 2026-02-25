<script setup lang="ts">
import { useEventsStore } from '../stores/events';
const store = useEventsStore();
</script>

<template>
  <div class="flex flex-wrap gap-2 p-2 bg-gray-900 rounded-lg border border-gray-800">
    <select
      class="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700"
      :value="store.filters.source_app ?? ''"
      @change="store.setFilter('source_app', ($event.target as HTMLSelectElement).value || null)"
    >
      <option value="">All apps</option>
      <option v-for="app in store.allApps" :key="app" :value="app">{{ app }}</option>
    </select>

    <select
      class="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700"
      :value="store.filters.event_type ?? ''"
      @change="store.setFilter('event_type', ($event.target as HTMLSelectElement).value || null)"
    >
      <option value="">All events</option>
      <option v-for="et in store.allEventTypes" :key="et" :value="et">{{ et }}</option>
    </select>

    <select
      class="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700"
      :value="store.filters.session_id ?? ''"
      @change="store.setFilter('session_id', ($event.target as HTMLSelectElement).value || null)"
    >
      <option value="">All sessions</option>
      <option v-for="s in store.allSessions" :key="s" :value="s">{{ s.slice(0, 8) }}…</option>
    </select>

    <select
      class="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700"
      :value="store.filters.tag ?? ''"
      @change="store.setFilter('tag', ($event.target as HTMLSelectElement).value || null)"
    >
      <option value="">All tags</option>
      <option v-for="t in store.allTags" :key="t" :value="t">{{ t }}</option>
    </select>

    <span class="text-gray-500 text-xs self-center ml-auto">{{ store.filteredEvents.length }} events</span>
  </div>
</template>
