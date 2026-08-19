import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RepositorySearchForm from '@/components/RepositorySearchForm.vue'

describe('RepositorySearchForm', () => {
  it('emits submit for a non-empty query', async () => {
    const wrapper = mount(RepositorySearchForm, {
      props: {
        modelValue: 'vue',
        loading: false,
      },
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('keeps Search available while loading', async () => {
    const wrapper = mount(RepositorySearchForm, {
      props: {
        modelValue: 'vue',
        loading: true,
      },
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.find('input').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
  })
})
