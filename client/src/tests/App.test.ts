import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

// Mock WebSocket for test environment
global.WebSocket = class MockWebSocket {
  onopen: (() => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  onclose: (() => void) | null = null
  onerror: ((e: Event) => void) | null = null
  constructor() {}
  close() {}
  send() {}
} as unknown as typeof WebSocket

global.fetch = async () => new Response(JSON.stringify({ events: [] }))

describe('App', () => {
  it('renders dashboard title', () => {
    const wrapper = mount(App, {
      global: { plugins: [createPinia()] },
    })
    expect(wrapper.text()).toContain('Agent Observability')
  })
})
