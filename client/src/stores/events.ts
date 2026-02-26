import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StoredEvent } from '../types/events'

export interface ActiveFilters {
  source_app: string | null
  session_id: string | null
  event_type: string | null
  tag: string | null
}

export const useEventsStore = defineStore('events', () => {
  const events = ref<StoredEvent[]>([])
  const activeFilters = ref<ActiveFilters>({ source_app: null, session_id: null, event_type: null, tag: null })
  const maxEvents = 2000

  function addEvent(event: StoredEvent) {
    events.value.unshift(event)
    if (events.value.length > maxEvents) events.value.splice(maxEvents)
  }

  function setEvents(newEvents: StoredEvent[]) {
    events.value = newEvents
  }

  function setFilter(key: keyof ActiveFilters, value: string | null) {
    activeFilters.value[key] = value
  }

  function clearFilters() {
    activeFilters.value = { source_app: null, session_id: null, event_type: null, tag: null }
  }

  const filteredEvents = computed<StoredEvent[]>(() => {
    const f = activeFilters.value
    return events.value.filter(e => {
      if (f.source_app && e.source_app !== f.source_app) return false
      if (f.session_id && e.session_id !== f.session_id) return false
      if (f.event_type && e.event_type !== f.event_type) return false
      if (f.tag) {
        try { if (!JSON.parse(e.tags).includes(f.tag)) return false }
        catch { return false }
      }
      return true
    })
  })

  const sessionColors = computed<Record<string, string>>(() => {
    const palette = ['#06b6d4','#8b5cf6','#f59e0b','#10b981','#ef4444','#ec4899','#3b82f6','#84cc16']
    const seen = new Map<string, string>()
    events.value.forEach(e => {
      if (!seen.has(e.session_id)) seen.set(e.session_id, palette[seen.size % palette.length])
    })
    return Object.fromEntries(seen)
  })

  const appColors = computed<Record<string, string>>(() => {
    const palette = ['#f97316','#06b6d4','#a855f7','#22c55e','#eab308','#14b8a6','#f43f5e','#64748b']
    const seen = new Map<string, string>()
    events.value.forEach(e => {
      if (!seen.has(e.source_app)) seen.set(e.source_app, palette[seen.size % palette.length])
    })
    return Object.fromEntries(seen)
  })

  return { events, activeFilters, filteredEvents, sessionColors, appColors, addEvent, setEvents, setFilter, clearFilters }
})
