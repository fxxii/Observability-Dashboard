import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, getActivePinia } from 'pinia'
import { useEventsStore } from '../stores/events'
import FilterPanel from '../components/FilterPanel.vue'

beforeEach(() => setActivePinia(createPinia()))

describe('FilterPanel', () => {
  it('renders source_app filter select', () => {
    const wrapper = mount(FilterPanel, { global: { plugins: [getActivePinia()!] } })
    expect(wrapper.find('[data-filter="source_app"]').exists()).toBe(true)
  })

  it('emits filter change when selection changes', async () => {
    const store = useEventsStore()
    store.addEvent({ id:1, event_type:'SessionStart', session_id:'s1', trace_id:'t1', source_app:'app-a', tags:'[]', payload:'{}', timestamp: Date.now() })
    const wrapper = mount(FilterPanel, { global: { plugins: [getActivePinia()!] } })
    await wrapper.find('[data-filter="source_app"]').setValue('app-a')
    expect(store.activeFilters.source_app).toBe('app-a')
  })

  it('clear button resets all filters', async () => {
    const store = useEventsStore()
    store.setFilter('source_app', 'app-a')
    const wrapper = mount(FilterPanel, { global: { plugins: [getActivePinia()!] } })
    await wrapper.find('[data-clear-filters]').trigger('click')
    expect(store.activeFilters.source_app).toBeNull()
  })
})
