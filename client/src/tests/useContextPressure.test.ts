// client/src/tests/useContextPressure.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'
import { useContextPressure } from '../composables/useContextPressure'

beforeEach(() => setActivePinia(createPinia()))

describe('useContextPressure', () => {
  it('returns green status with no PreCompact events', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'SessionStart', session_id: 's1', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{}', timestamp: Date.now() })
    const { pressureBySession } = useContextPressure()
    expect(pressureBySession.value['s1']?.status).toBe('green')
  })

  it('returns green with only 1 PreCompact event (40% fill, below amber)', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'PreCompact', session_id: 's1', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{}', timestamp: Date.now() - 60_000 })
    const { pressureBySession } = useContextPressure()
    expect(pressureBySession.value['s1']?.status).toBe('green')
    expect(pressureBySession.value['s1']?.fillPercent).toBe(40)
  })

  it('returns amber when 2 PreCompact events in 10 min window (80% fill)', () => {
    const store = useEventsStore()
    const now = Date.now()
    store.addEvent({ id: 1, event_type: 'PreCompact', session_id: 's1', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{}', timestamp: now - 60_000 })
    store.addEvent({ id: 2, event_type: 'PreCompact', session_id: 's1', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{}', timestamp: now - 30_000 })
    const { pressureBySession } = useContextPressure()
    expect(pressureBySession.value['s1']?.status).toBe('amber')
    expect(pressureBySession.value['s1']?.fillPercent).toBe(80)
  })

  it('returns red when 3+ PreCompact events in 10 min window', () => {
    const store = useEventsStore()
    const now = Date.now()
    for (let i = 0; i < 3; i++) store.addEvent({ id: i+1, event_type: 'PreCompact', session_id: 's1', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{}', timestamp: now - i * 90_000 })
    const { pressureBySession } = useContextPressure()
    expect(pressureBySession.value['s1']?.status).toBe('red')
  })
})
