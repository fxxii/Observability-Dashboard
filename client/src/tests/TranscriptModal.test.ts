import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TranscriptModal from '../components/TranscriptModal.vue'

beforeEach(() => {
  setActivePinia(createPinia())
  global.fetch = async () => new Response('transcript content', { status: 200 })
})

const mockEvent = {
  id: 1, event_type: 'SubagentStop', session_id: 'sess-1', trace_id: 't1',
  source_app: 'app', tags: '[]',
  payload: JSON.stringify({ transcript_path: '/tmp/transcript.json' }),
  timestamp: Date.now()
}

describe('TranscriptModal', () => {
  it('renders modal with session id', () => {
    const wrapper = mount(TranscriptModal, {
      props: { event: mockEvent },
      attachTo: document.body,
      global: { plugins: [createPinia()] }
    })
    expect(wrapper.find('[data-modal]').exists()).toBe(true)
    expect(wrapper.text()).toContain('sess-1')
  })

  it('emits close when backdrop clicked', async () => {
    const wrapper = mount(TranscriptModal, {
      props: { event: mockEvent },
      attachTo: document.body,
      global: { plugins: [createPinia()] }
    })
    await wrapper.find('[data-backdrop]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
