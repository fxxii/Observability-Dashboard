import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PulseChart from '../components/PulseChart.vue'

beforeEach(() => setActivePinia(createPinia()))

describe('PulseChart', () => {
  it('renders a canvas element', () => {
    const wrapper = mount(PulseChart, { global: { plugins: [createPinia()] } })
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  it('renders time range selector buttons', () => {
    const wrapper = mount(PulseChart, { global: { plugins: [createPinia()] } })
    expect(wrapper.text()).toContain('1m')
    expect(wrapper.text()).toContain('3m')
    expect(wrapper.text()).toContain('5m')
  })
})
