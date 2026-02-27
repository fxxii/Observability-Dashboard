// client/src/tests/useTokenBurn.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'
import { useTokenBurn } from '../composables/useTokenBurn'

beforeEach(() => setActivePinia(createPinia()))

describe('useTokenBurn', () => {
  it('calculates total cost from token counts', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'PostToolUse', session_id: 's1', trace_id: 't1', source_app: 'app', tags: '[]', payload: JSON.stringify({ input_tokens: 1000, output_tokens: 500, model: 'claude-sonnet-4-6' }), timestamp: Date.now() })
    const { totalCostUsd } = useTokenBurn()
    expect(totalCostUsd.value).toBeGreaterThan(0)
  })

  it('breaks down cost by session', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'PostToolUse', session_id: 'sess-a', trace_id: 't1', source_app: 'app', tags: '[]', payload: JSON.stringify({ input_tokens: 5000, output_tokens: 2000, model: 'claude-sonnet-4-6' }), timestamp: Date.now() })
    const { costBySession } = useTokenBurn()
    expect(costBySession.value['sess-a']).toBeGreaterThan(0)
  })
})
