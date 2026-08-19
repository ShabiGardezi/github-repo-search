import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RepositoryCard from '@/components/RepositoryCard.vue'
import type { GithubRepository } from '@/api/github'

const repository: GithubRepository = {
  id: 1,
  name: 'vue',
  fullName: 'vuejs/vue',
  description: 'The Progressive JavaScript Framework',
  htmlUrl: 'https://github.com/vuejs/vue',
  language: 'TypeScript',
  stargazersCount: 42,
  forksCount: 7,
  openIssuesCount: 3,
  license: 'MIT License',
  createdAt: '2013-07-29T03:24:51Z',
  updatedAt: '2026-01-15T00:00:00Z',
  owner: {
    login: 'vuejs',
  },
}

describe('RepositoryCard', () => {
  it('renders repository name, owner, and stats', () => {
    const wrapper = mount(RepositoryCard, {
      props: { repository },
    })

    expect(wrapper.text()).toContain('vue')
    expect(wrapper.text()).toContain('vuejs')
    expect(wrapper.text()).toContain('The Progressive JavaScript Framework')
    expect(wrapper.text()).toContain('TypeScript')
    expect(wrapper.text()).toContain('42 stars')
    expect(wrapper.text()).toContain('7 forks')
    expect(wrapper.text()).toContain('Updated Jan 15, 2026')
  })

  it('emits select from the View details button', async () => {
    const wrapper = mount(RepositoryCard, {
      props: { repository },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('omits missing optional fields', () => {
    const wrapper = mount(RepositoryCard, {
      props: {
        repository: {
          ...repository,
          id: 2,
          name: 'empty',
          description: null,
          htmlUrl: null,
          language: null,
          updatedAt: null,
          owner: {
            login: 'octocat',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('empty')
    expect(wrapper.text()).toContain('octocat')
    expect(wrapper.text()).not.toContain('Unknown')
    expect(wrapper.text()).not.toContain('Updated')
  })
})
