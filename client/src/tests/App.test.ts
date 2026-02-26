import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('renders dashboard title', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Agent Observability Dashboard')
  })
})
