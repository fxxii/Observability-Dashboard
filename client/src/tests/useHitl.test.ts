import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHitl } from '../composables/useHitl'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('fetch', vi.fn())
})

describe('useHitl', () => {
  it('starts with no pending intercepts', () => {
    const { pendingIntercepts } = useHitl()
    expect(pendingIntercepts.value).toHaveLength(0)
  })

  it('addIntercept makes it appear in pending list', () => {
    const { pendingIntercepts, addIntercept } = useHitl()
    addIntercept({ id: 'ic-1', session_id: 's1', tool_name: 'Bash', command: 'git push', rule_id: 'r1', status: 'pending', created_at: Date.now() })
    expect(pendingIntercepts.value).toHaveLength(1)
  })

  it('resolveIntercept removes intercept from pending list', () => {
    const { pendingIntercepts, addIntercept, resolveIntercept } = useHitl()
    addIntercept({ id: 'ic-resolve', session_id: 's1', tool_name: 'Bash', command: 'rm -rf', rule_id: 'r1', status: 'pending', created_at: Date.now() })
    expect(pendingIntercepts.value.some(i => i.id === 'ic-resolve')).toBe(true)
    resolveIntercept('ic-resolve', 'approved')
    expect(pendingIntercepts.value.some(i => i.id === 'ic-resolve')).toBe(false)
  })
})
