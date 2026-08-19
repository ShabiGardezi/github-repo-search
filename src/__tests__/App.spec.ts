import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GITHUB_RATE_LIMIT_MESSAGE, GithubApiError } from '@/api/github'
import type { GithubRepository } from '@/api/github'
import App from '../App.vue'

const searchRepositories = vi.hoisted(() => vi.fn())
const getRepository = vi.hoisted(() => vi.fn())

vi.mock('@/api/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/github')>()
  return {
    ...actual,
    searchRepositories,
    getRepository,
  }
})

const vueRepo: GithubRepository = {
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

async function searchFor(wrapper: ReturnType<typeof mount>, query: string): Promise<void> {
  await wrapper.get('input').setValue(query)
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('App search', () => {
  beforeEach(() => {
    searchRepositories.mockReset()
    getRepository.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders repository results after a successful search', async () => {
    searchRepositories.mockResolvedValue({
      items: [vueRepo],
    })

    const wrapper = mount(App)
    await searchFor(wrapper, 'vue')

    expect(wrapper.text()).toContain('vue')
    expect(wrapper.text()).toContain('vuejs')
    expect(wrapper.text()).toContain('The Progressive JavaScript Framework')
    expect(wrapper.text()).toContain('TypeScript')
    expect(wrapper.text()).toContain('42 stars')
    expect(wrapper.text()).toContain('View details')
  })

  it('shows an empty state when GitHub returns no repositories', async () => {
    searchRepositories.mockResolvedValue({
      items: [],
    })

    const wrapper = mount(App)
    await searchFor(wrapper, 'no-such-repo')

    expect(wrapper.text()).toContain('No repositories found')
    expect(wrapper.text()).not.toContain('View details')
  })

  it('shows Searching while the request is in flight', async () => {
    searchRepositories.mockReturnValue(new Promise(() => undefined))

    const wrapper = mount(App)
    await wrapper.get('input').setValue('vue')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Searching…')
  })

  it('shows a user-facing error and is not stuck loading', async () => {
    searchRepositories.mockRejectedValue(
      new GithubApiError('Nothing was found for this request.', { status: 404 }),
    )

    const wrapper = mount(App)
    await searchFor(wrapper, 'vue')

    expect(wrapper.text()).toContain('Nothing was found for this request.')
    expect(wrapper.text()).not.toContain('Searching…')
    expect(wrapper.text()).not.toContain('View details')
  })

  it('shows the rate-limit message', async () => {
    searchRepositories.mockRejectedValue(
      new GithubApiError(GITHUB_RATE_LIMIT_MESSAGE, { status: 403, isRateLimit: true }),
    )

    const wrapper = mount(App)
    await searchFor(wrapper, 'vue')

    expect(wrapper.text()).toContain('GitHub rate limit reached. Try again later.')
    expect(wrapper.text()).not.toContain('Searching…')
  })

  it('opens the detail dialog from View details', async () => {
    searchRepositories.mockResolvedValue({ items: [vueRepo] })
    getRepository.mockResolvedValue(vueRepo)

    const wrapper = mount(App, {
      global: {
        stubs: {
          VDialog: {
            template: '<div><slot /></div>',
          },
        },
      },
    })

    await searchFor(wrapper, 'vue')

    const detailsButton = wrapper.findAll('button').find((button) => button.text() === 'View details')
    expect(detailsButton).toBeDefined()
    await detailsButton!.trigger('click')
    await flushPromises()

    expect(getRepository).toHaveBeenCalledWith(
      'vuejs',
      'vue',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(wrapper.text()).toContain('View on GitHub (opens in a new tab)')
    expect(wrapper.text()).toContain('MIT License')
  })
})
