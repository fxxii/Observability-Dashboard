import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, getActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'
import EventTimeline from '../components/EventTimeline.vue'

beforeEach(() => setActivePinia(createPinia()))

describe('EventTimeline', () => {
  it('renders event rows for each filtered event', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'SessionStart', session_id: 's1', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{}', timestamp: Date.now() })
    store.addEvent({ id: 2, event_type: 'PostToolUse', session_id: 's1', trace_id: 't1', source_app: 'app', tags: '[]', payload: '{"tool_name":"Bash"}', timestamp: Date.now() })
    const wrapper = mount(EventTimeline, { global: { plugins: [getActivePinia()!] } })
    const rows = wrapper.findAll('[data-event-row]')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('shows empty state when no events', () => {
    const wrapper = mount(EventTimeline, { global: { plugins: [getActivePinia()!] } })
    expect(wrapper.text()).toContain('No events')
  })
})
