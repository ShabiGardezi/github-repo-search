import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mounts the search screen', () => {
    const wrapper = mount(App)

    expect(wrapper.text()).toContain('GitHub Repository Search')
    expect(wrapper.find('input').exists()).toBe(true)
  })
})
