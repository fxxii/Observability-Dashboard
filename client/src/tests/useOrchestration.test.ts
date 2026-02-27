// client/src/tests/useOrchestration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'
import { useOrchestration } from '../composables/useOrchestration'

beforeEach(() => setActivePinia(createPinia()))

describe('useOrchestration', () => {
  it('detects current phase from UserPromptSubmit payload', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'UserPromptSubmit', session_id: 'lead-1', trace_id: 't1', source_app: 'app', tags: '[]', payload: JSON.stringify({ prompt: 'I am now in execute-plan phase, task 3 of 7' }), timestamp: Date.now() })
    const { currentPhase } = useOrchestration()
    expect(currentPhase.value).toBe('execute-plan')
  })

  it('returns idle when no matching events', () => {
    const { currentPhase } = useOrchestration()
    expect(currentPhase.value).toBe('idle')
  })

  it('counts subagent types correctly', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'SubagentStart', session_id: 'child-1', trace_id: 't1', source_app: 'app', tags: '[]', payload: JSON.stringify({ parent_session_id: 'lead-1', agent_type: 'implementer' }), timestamp: Date.now() })
    store.addEvent({ id: 2, event_type: 'SubagentStart', session_id: 'child-2', trace_id: 't1', source_app: 'app', tags: '[]', payload: JSON.stringify({ parent_session_id: 'lead-1', agent_type: 'spec-reviewer' }), timestamp: Date.now() })
    const { activeSubagents } = useOrchestration()
    expect(activeSubagents.value.length).toBe(2)
  })
})
