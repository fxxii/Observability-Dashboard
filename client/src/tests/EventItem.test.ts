import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'
import EventItem from '../components/EventItem.vue'

beforeEach(() => setActivePinia(createPinia()))

const mockEvent = {
  id: 1, event_type: 'PostToolUse', session_id: 'sess-1', trace_id: 't1',
  source_app: 'my-app', tags: '["feat-x"]',
  payload: JSON.stringify({ tool_name: 'Bash', command: 'ls' }),
  timestamp: Date.now()
}

describe('EventItem', () => {
  it('renders event type emoji', () => {
    const wrapper = mount(EventItem, {
      props: { event: mockEvent },
      global: { plugins: [createPinia()] }
    })
    expect(wrapper.text()).toContain('✅')  // PostToolUse emoji
  })

  it('renders tool emoji for Bash tool', () => {
    const wrapper = mount(EventItem, {
      props: { event: mockEvent },
      global: { plugins: [createPinia()] }
    })
    expect(wrapper.text()).toContain('💻')  // Bash tool emoji
  })

  it('shows session_id truncated', () => {
    const wrapper = mount(EventItem, {
      props: { event: mockEvent },
      global: { plugins: [createPinia()] }
    })
    expect(wrapper.text()).toContain('sess-1')
  })
})
