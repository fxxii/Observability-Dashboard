import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'

beforeEach(() => setActivePinia(createPinia()))

const makeEvent = (id: number, timestamp: number) => ({
  id,
  event_type: 'SessionStart',
  session_id: 's1',
  trace_id: 't1',
  parent_session_id: null,
  source_app: 'app',
  tags: '[]',
  payload: '{}',
  timestamp,
})

describe('Time Travel', () => {
  it('rewindTo filters events to only show events at or before timestamp', () => {
    const store = useEventsStore()
    store.addEvent(makeEvent(1, 1000))
    store.addEvent(makeEvent(2, 2000))
    store.addEvent(makeEvent(3, 3000))

    store.setRewindTime(2000)
    expect(store.filteredEvents.every(e => e.timestamp <= 2000)).toBe(true)
    expect(store.filteredEvents.length).toBe(2)
  })

  it('clearRewind restores full event list', () => {
    const store = useEventsStore()
    store.addEvent(makeEvent(1, 1000))
    store.addEvent(makeEvent(2, 9000))

    store.setRewindTime(1000)
    expect(store.filteredEvents.length).toBe(1)
    store.clearRewind()
    expect(store.filteredEvents.length).toBe(2)
  })

  it('rewindTime is null by default', () => {
    const store = useEventsStore()
    expect(store.rewindTime).toBeNull()
  })
})
