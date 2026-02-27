// client/src/tests/useStallDetection.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'
import { useStallDetection } from '../composables/useStallDetection'

beforeEach(() => setActivePinia(createPinia()))

describe('useStallDetection', () => {
  it('marks a session as stalled if last event > 60s ago', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'PreToolUse', session_id: 'old-sess', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{}', timestamp: Date.now() - 90_000 })
    const { stalledSessions } = useStallDetection()
    expect(stalledSessions.value['old-sess']).toBeDefined()
    expect(stalledSessions.value['old-sess'].elapsedMs).toBeGreaterThan(60_000)
  })

  it('does not mark recent sessions as stalled', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'PreToolUse', session_id: 'active-sess', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{}', timestamp: Date.now() })
    const { stalledSessions } = useStallDetection()
    expect(stalledSessions.value['active-sess']).toBeUndefined()
  })

  it('excludes stopped sessions from stall check', () => {
    const store = useEventsStore()
    const old = Date.now() - 120_000
    store.addEvent({ id: 1, event_type: 'SessionStart', session_id: 'done-sess', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{}', timestamp: old })
    store.addEvent({ id: 2, event_type: 'Stop', session_id: 'done-sess', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{}', timestamp: old + 1000 })
    const { stalledSessions } = useStallDetection()
    expect(stalledSessions.value['done-sess']).toBeUndefined()
  })
})
