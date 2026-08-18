import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GithubApiError } from '@/api/github'
import type { GithubRepository } from '@/api/github'
import { useRepositoryDetail } from '@/composables/useRepositoryDetail'

const getRepository = vi.hoisted(() => vi.fn())

vi.mock('@/api/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/github')>()
  return {
    ...actual,
    getRepository,
  }
})

const vueRepo: GithubRepository = {
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

describe('useRepositoryDetail', () => {
  beforeEach(() => {
    getRepository.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads repository details', async () => {
    getRepository.mockResolvedValue(vueRepo)

    const { open, repository, error, isOpen } = useRepositoryDetail()
    await open('vuejs', 'vue')

    expect(getRepository).toHaveBeenCalledWith('vuejs', 'vue', expect.objectContaining({ signal: expect.any(AbortSignal) }))
    expect(isOpen.value).toBe(true)
    expect(repository.value).toEqual(vueRepo)
    expect(error.value).toBeNull()
  })

  it('exposes API errors', async () => {
    getRepository.mockRejectedValue(new GithubApiError('Not Found', { status: 404 }))

    const { open, error, repository } = useRepositoryDetail()
    await open('missing', 'repo')

    expect(error.value).toMatchObject({ message: 'Not Found', isRateLimit: false })
    expect(repository.value).toBeNull()
  })

  it('ignores a stale response when another repository is opened', async () => {
    let resolveFirst: ((value: GithubRepository) => void) | undefined
    let resolveSecond: ((value: GithubRepository) => void) | undefined

    getRepository
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve
          }),
      )

    const { open, repository } = useRepositoryDetail()
    const first = open('vuejs', 'vue')
    const second = open('facebook', 'react')

    resolveFirst?.(vueRepo)
    await flushPromises()
    expect(repository.value).toBeNull()

    const reactRepo = { ...vueRepo, id: 2, name: 'react', fullName: 'facebook/react' }
    resolveSecond?.(reactRepo)
    await first
    await second

    expect(repository.value).toEqual(reactRepo)
  })

  it('clears state on close and restores focus', async () => {
    getRepository.mockResolvedValue(vueRepo)

    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()

    const { open, close, isOpen, repository } = useRepositoryDetail()
    await open('vuejs', 'vue')
    close()
    await nextTick()

    expect(isOpen.value).toBe(false)
    expect(repository.value).toBeNull()
    expect(document.activeElement).toBe(button)
    button.remove()
  })
})
