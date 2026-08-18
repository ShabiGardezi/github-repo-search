import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GithubApiError } from '@/api/github'
import { useRepositorySearch } from '@/composables/useRepositorySearch'

const searchRepositories = vi.hoisted(() => vi.fn())

vi.mock('@/api/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/github')>()
  return {
    ...actual,
    searchRepositories,
  }
})

const vueRepo = {
  id: 1,
  name: 'vue',
  fullName: 'vuejs/vue',
  description: 'Vue.js',
  htmlUrl: 'https://github.com/vuejs/vue',
  language: 'TypeScript',
  stargazersCount: 42,
  forksCount: 7,
  openIssuesCount: 3,
  license: 'MIT License',
  createdAt: '2013-07-29T03:24:51Z',
  updatedAt: '2026-01-01T00:00:00Z',
  owner: {
    login: 'vuejs',
    avatarUrl: null,
  },
}

describe('useRepositorySearch', () => {
  beforeEach(() => {
    searchRepositories.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads repositories for a query', async () => {
    searchRepositories.mockResolvedValue({
      totalCount: 1,
      incompleteResults: false,
      items: [vueRepo],
    })

    const { query, repositories, error, isEmpty, search } = useRepositorySearch()
    query.value = 'vue'
    await search()

    expect(searchRepositories).toHaveBeenCalledWith('vue')
    expect(repositories.value).toEqual([vueRepo])
    expect(error.value).toBeNull()
    expect(isEmpty.value).toBe(false)
  })

  it('shows an empty state when GitHub returns no items', async () => {
    searchRepositories.mockResolvedValue({
      totalCount: 0,
      incompleteResults: false,
      items: [],
    })

    const { query, isEmpty, error, search } = useRepositorySearch()
    query.value = 'no-such-repo'
    await search()

    expect(isEmpty.value).toBe(true)
    expect(error.value).toBeNull()
  })

  it('exposes API errors', async () => {
    searchRepositories.mockRejectedValue(new GithubApiError('Not Found', { status: 404 }))

    const { query, error, search } = useRepositorySearch()
    query.value = 'vue'
    await search()

    expect(error.value).toMatchObject({ message: 'Not Found', isRateLimit: false })
  })

  it('exposes rate-limit errors', async () => {
    searchRepositories.mockRejectedValue(
      new GithubApiError('API rate limit exceeded', { status: 403, isRateLimit: true }),
    )

    const { query, error, search } = useRepositorySearch()
    query.value = 'vue'
    await search()

    expect(error.value?.isRateLimit).toBe(true)
  })

  it('does not search while a request is already loading', async () => {
    let resolveSearch: (() => void) | undefined
    searchRepositories.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = () =>
            resolve({ totalCount: 0, incompleteResults: false, items: [] })
        }),
    )

    const { query, search } = useRepositorySearch()
    query.value = 'vue'

    const firstSearch = search()
    await search()
    resolveSearch?.()
    await firstSearch

    expect(searchRepositories).toHaveBeenCalledTimes(1)
  })

  it('does not search an empty query', async () => {
    const { query, search } = useRepositorySearch()
    query.value = '   '
    await search()

    expect(searchRepositories).not.toHaveBeenCalled()
  })

  it('reports loading while the request is in flight', async () => {
    searchRepositories.mockReturnValue(new Promise(() => undefined))

    const { query, isLoading, search } = useRepositorySearch()
    query.value = 'vue'
    void search()
    await flushPromises()

    expect(isLoading.value).toBe(true)
  })
})
