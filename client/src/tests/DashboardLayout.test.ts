import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import DashboardLayout from '../components/DashboardLayout.vue'

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

describe('DashboardLayout', () => {
  it('renders all panel slots', () => {
    const wrapper = mount(DashboardLayout, {
      global: { plugins: [createPinia()] },
    })
    expect(wrapper.find('[data-panel="auditor"]').exists()).toBe(true)
    expect(wrapper.find('[data-panel="critic"]').exists()).toBe(true)
    expect(wrapper.find('[data-panel="lead"]').exists()).toBe(true)
    expect(wrapper.find('[data-panel="timeline"]').exists()).toBe(true)
    expect(wrapper.find('[data-panel="pulse"]').exists()).toBe(true)
  })
})
