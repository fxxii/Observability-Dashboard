import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEventsStore } from '../stores/events'

beforeEach(() => { setActivePinia(createPinia()) })

describe('useEventsStore', () => {
  it('starts with empty events', () => {
    const store = useEventsStore()
    expect(store.events).toHaveLength(0)
  })

  it('addEvent appends to events list', () => {
    const store = useEventsStore()
    store.addEvent({
      id: 1, event_type: 'SessionStart', session_id: 'sess-1',
      trace_id: 'trace-1', source_app: 'test', tags: '[]',
      payload: '{}', timestamp: Date.now()
    })
    expect(store.events).toHaveLength(1)
    expect(store.events[0].event_type).toBe('SessionStart')
  })

  it('filteredEvents filters by source_app', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'SessionStart', session_id: 's1', trace_id: 't1', source_app: 'app-a', tags: '[]', payload: '{}', timestamp: 1000 })
    store.addEvent({ id: 2, event_type: 'Stop', session_id: 's2', trace_id: 't2', source_app: 'app-b', tags: '[]', payload: '{}', timestamp: 2000 })
    store.setFilter('source_app', 'app-a')
    expect(store.filteredEvents).toHaveLength(1)
    expect(store.filteredEvents[0].source_app).toBe('app-a')
  })

  it('clearFilters resets all filters', () => {
    const store = useEventsStore()
    store.setFilter('source_app', 'app-a')
    store.clearFilters()
    expect(store.activeFilters.source_app).toBeNull()
  })
})
