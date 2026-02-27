// client/src/tests/useAgentTree.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'
import { useAgentTree } from '../composables/useAgentTree'

beforeEach(() => setActivePinia(createPinia()))

describe('useAgentTree', () => {
  it('builds parent-child hierarchy from SubagentStart events', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'SessionStart', session_id: 'lead', trace_id: 'trace-1', parent_session_id: null, source_app: 'app', tags: '[]', payload: '{}', timestamp: 1000 })
    store.addEvent({ id: 2, event_type: 'SubagentStart', session_id: 'child-1', trace_id: 'trace-1', parent_session_id: 'lead', source_app: 'app', tags: '[]', payload: '{}', timestamp: 2000 })
    store.addEvent({ id: 3, event_type: 'SubagentStart', session_id: 'child-2', trace_id: 'trace-1', parent_session_id: 'lead', source_app: 'app', tags: '[]', payload: '{}', timestamp: 3000 })
    const { roots } = useAgentTree()
    expect(roots.value.length).toBe(1)
    expect(roots.value[0].session_id).toBe('lead')
    expect(roots.value[0].children.length).toBe(2)
  })
})
