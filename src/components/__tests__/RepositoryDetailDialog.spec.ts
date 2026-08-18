import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { GithubApiError } from '@/api/github'
import type { GithubRepository } from '@/api/github'
import RepositoryDetailDialog from '@/components/RepositoryDetailDialog.vue'

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
  createdAt: '2013-07-29T12:00:00Z',
  updatedAt: '2026-01-15T12:00:00Z',
  owner: {
    login: 'vuejs',
    avatarUrl: null,
  },
}

function mountDialog(
  props: Partial<{
    open: boolean
    loading: boolean
    error: GithubApiError | null
    repository: GithubRepository | null
  }> = {},
) {
  return mount(RepositoryDetailDialog, {
    props: {
      open: true,
      loading: false,
      error: null,
      repository,
      ...props,
    },
    global: {
      stubs: {
        VDialog: {
          template: '<div><slot /></div>',
        },
      },
    },
  })
}

describe('RepositoryDetailDialog', () => {
  it('renders useful repository details and a safe GitHub link', () => {
    const wrapper = mountDialog()

    expect(wrapper.text()).toContain('vue')
    expect(wrapper.text()).toContain('vuejs')
    expect(wrapper.text()).toContain('The Progressive JavaScript Framework')
    expect(wrapper.text()).toContain('TypeScript')
    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('7')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('MIT License')
    expect(wrapper.text()).toContain('Jul 29, 2013')
    expect(wrapper.text()).toContain('Jan 15, 2026')

    const link = wrapper.get('a')
    expect(link.text()).toContain('opens in a new tab')
    expect(link.attributes('href')).toBe('https://github.com/vuejs/vue')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
    expect(link.attributes('rel')).toContain('noreferrer')
  })

  it('shows loading and error states', () => {
    const loading = mountDialog({ loading: true, repository: null })
    expect(loading.text()).toContain('Loading…')
    loading.unmount()

    const error = mountDialog({
      repository: null,
      error: new GithubApiError('Not Found', { status: 404 }),
    })
    expect(error.text()).toContain('Not Found')
    error.unmount()

    const rateLimit = mountDialog({
      repository: null,
      error: new GithubApiError('limited', { status: 403, isRateLimit: true }),
    })
    expect(rateLimit.text()).toContain('GitHub rate limit reached')
    rateLimit.unmount()
  })

  it('omits missing optional fields', () => {
    const wrapper = mountDialog({
      repository: {
        ...repository,
        description: null,
        language: null,
        license: null,
        htmlUrl: null,
        createdAt: null,
        updatedAt: null,
      },
    })

    expect(wrapper.text()).not.toContain('Language')
    expect(wrapper.text()).not.toContain('License')
    expect(wrapper.text()).not.toContain('Created')
    expect(wrapper.text()).not.toContain('Updated')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('emits close from the close button', async () => {
    const wrapper = mountDialog()

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
