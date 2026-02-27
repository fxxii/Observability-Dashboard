// client/src/tests/useMcpRegistry.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'
import { useMcpRegistry } from '../composables/useMcpRegistry'

beforeEach(() => setActivePinia(createPinia()))

describe('useMcpRegistry', () => {
  it('extracts MCP server from PostToolUse with is_mcp_tool=true', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'PostToolUse', session_id: 's1', trace_id: 't1', source_app: 'app', tags: '[]', payload: JSON.stringify({ tool_name: 'mcp__figma__get_file', mcp_server: 'figma', is_mcp_tool: true }), timestamp: Date.now() })
    const { servers } = useMcpRegistry()
    expect(servers.value.some(s => s.name === 'figma')).toBe(true)
  })

  it('shows failure count from PostToolUseFailure events', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'PostToolUseFailure', session_id: 's1', trace_id: 't1', source_app: 'app', tags: '[]', payload: JSON.stringify({ tool_name: 'mcp__context7__query', mcp_server: 'context7', is_mcp_tool: true }), timestamp: Date.now() })
    const { servers } = useMcpRegistry()
    const ctx7 = servers.value.find(s => s.name === 'context7')
    expect(ctx7?.failures).toBe(1)
  })
})
