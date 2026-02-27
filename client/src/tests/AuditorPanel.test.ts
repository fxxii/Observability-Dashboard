// client/src/tests/AuditorPanel.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, getActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'
import AuditorPanelContent from '../components/AuditorPanelContent.vue'

beforeEach(() => setActivePinia(createPinia()))

describe('AuditorPanelContent', () => {
  it('renders commit hash from Stop events with commit_hash payload', () => {
    const store = useEventsStore()
    store.addEvent({ id: 1, event_type: 'Stop', session_id: 'impl-1', trace_id: 't1', source_app: 'app', tags: '[]', payload: JSON.stringify({ commit_hash: 'abc1234', commit_message: 'feat: add feature' }), timestamp: Date.now() })
    const wrapper = mount(AuditorPanelContent, { global: { plugins: [getActivePinia()!] } })
    expect(wrapper.text()).toContain('abc1234')
  })
})
