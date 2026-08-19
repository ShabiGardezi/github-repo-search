import { afterEach, describe, expect, it, vi } from 'vitest'
import { GITHUB_RATE_LIMIT_MESSAGE, GithubApiError, getRepository, searchRepositories } from '@/api/github'

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

function mockFetch(response: Response | Error): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => {
      if (response instanceof Response) {
        return response
      }

      throw response
    }),
  )
}

function lastRequest(): { url: string; init: RequestInit } {
  const call = vi.mocked(fetch).mock.calls[0]
  if (!call) {
    throw new Error('fetch was not called')
  }

  return {
    url: String(call[0]),
    init: call[1] ?? {},
  }
}

const searchItem = {
  id: 1,
  name: 'vue',
  full_name: 'vuejs/vue',
  description: 'Vue.js',
  html_url: 'https://github.com/vuejs/vue',
  language: 'TypeScript',
  stargazers_count: 42,
  forks_count: 7,
  open_issues_count: 3,
  license: { name: 'MIT License' },
  created_at: '2013-07-29T03:24:51Z',
  updated_at: '2026-01-01T00:00:00Z',
  owner: {
    login: 'vuejs',
    avatar_url: 'https://avatars.githubusercontent.com/u/6128107',
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('searchRepositories', () => {
  it('requests the search endpoint and maps the response', async () => {
    mockFetch(
      jsonResponse({
        total_count: 1,
        incomplete_results: false,
        items: [searchItem],
      }),
    )

    const result = await searchRepositories('vue', { page: 2, perPage: 10 })
    const url = new URL(lastRequest().url)
    const headers = new Headers(lastRequest().init.headers)

    expect(url.origin).toBe('https://api.github.com')
    expect(url.pathname).toBe('/search/repositories')
    expect(url.searchParams.get('q')).toBe('vue')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('per_page')).toBe('10')
    expect(headers.get('Accept')).toBe('application/vnd.github+json')
    expect(headers.get('X-GitHub-Api-Version')).toBe('2022-11-28')

    expect(result.totalCount).toBe(1)
    expect(result.incompleteResults).toBe(false)
    expect(result.items[0]).toMatchObject({
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
        avatarUrl: 'https://avatars.githubusercontent.com/u/6128107',
      },
    })
  })

  it('maps missing GitHub fields to null or 0', async () => {
    mockFetch(
      jsonResponse({
        total_count: 1,
        incomplete_results: true,
        items: [
          {
            id: 2,
            name: 'incomplete',
            full_name: 'octocat/incomplete',
            description: null,
            language: null,
            owner: { login: 'octocat' },
          },
        ],
      }),
    )

    const result = await searchRepositories('incomplete')

    expect(result.incompleteResults).toBe(true)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      id: 2,
      fullName: 'octocat/incomplete',
      description: null,
      language: null,
      htmlUrl: null,
      stargazersCount: 0,
      forksCount: 0,
      openIssuesCount: 0,
      license: null,
      createdAt: null,
      updatedAt: null,
      owner: {
        login: 'octocat',
        avatarUrl: null,
      },
    })
  })

  it('fails when a search item cannot be mapped', async () => {
    mockFetch(
      jsonResponse({
        total_count: 2,
        incomplete_results: false,
        items: [searchItem, { id: 'bad' }],
      }),
    )

    await expect(searchRepositories('vue')).rejects.toMatchObject({
      name: 'GithubApiError',
      message: 'GitHub returned an unexpected response.',
      isRateLimit: false,
    })
  })
})

describe('getRepository', () => {
  it('requests repository details', async () => {
    mockFetch(jsonResponse(searchItem))

    const repository = await getRepository('vuejs', 'vue')

    expect(lastRequest().url).toBe('https://api.github.com/repos/vuejs/vue')
    expect(repository.fullName).toBe('vuejs/vue')
    expect(repository.openIssuesCount).toBe(3)
    expect(repository.license).toBe('MIT License')
    expect(repository.createdAt).toBe('2013-07-29T03:24:51Z')
  })

  it('encodes owner and repo names in the path', async () => {
    mockFetch(jsonResponse(searchItem))

    await getRepository('org name', 'repo/name')

    expect(lastRequest().url).toBe('https://api.github.com/repos/org%20name/repo%2Fname')
  })
})

describe('GitHub API errors', () => {
  it('exposes HTTP errors for the UI', async () => {
    mockFetch(
      jsonResponse(
        { message: 'Not Found' },
        { status: 404 },
      ),
    )

    const error = await getRepository('missing', 'repo').catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(GithubApiError)
    expect(error).toMatchObject({
      status: 404,
      message: 'Nothing was found for this request.',
      isRateLimit: false,
    })
  })

  it('marks exhausted rate-limit responses', async () => {
    mockFetch(
      jsonResponse(
        { message: 'API rate limit exceeded' },
        {
          status: 403,
          headers: {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1710000000',
          },
        },
      ),
    )

    await expect(searchRepositories('vue')).rejects.toMatchObject({
      name: 'GithubApiError',
      status: 403,
      isRateLimit: true,
      message: GITHUB_RATE_LIMIT_MESSAGE,
      rateLimitReset: new Date(1710000000 * 1000),
    })
  })

  it('marks 429 responses as rate-limited', async () => {
    mockFetch(jsonResponse({ message: 'You have exceeded a secondary rate limit' }, { status: 429 }))

    await expect(searchRepositories('vue')).rejects.toMatchObject({
      status: 429,
      isRateLimit: true,
      message: GITHUB_RATE_LIMIT_MESSAGE,
    })
  })

  it('does not treat a 403 with remaining quota as a rate limit', async () => {
    mockFetch(
      jsonResponse(
        { message: 'Resource not accessible by integration' },
        {
          status: 403,
          headers: { 'x-ratelimit-remaining': '59' },
        },
      ),
    )

    await expect(searchRepositories('vue')).rejects.toMatchObject({
      status: 403,
      isRateLimit: false,
      message: 'GitHub denied this request. Try again later.',
    })
  })

  it('maps 422 responses to a search validation message', async () => {
    mockFetch(jsonResponse({ message: 'Validation Failed' }, { status: 422 }))

    await expect(searchRepositories('bad:query')).rejects.toMatchObject({
      status: 422,
      isRateLimit: false,
      message: 'That search is not valid. Try different keywords.',
    })
  })

  it('wraps network failures', async () => {
    mockFetch(new TypeError('Failed to fetch'))

    await expect(searchRepositories('vue')).rejects.toMatchObject({
      name: 'GithubApiError',
      status: null,
      message: 'Unable to reach GitHub. Check your connection and try again.',
    })
  })

  it('forwards AbortSignal and rethrows abort errors', async () => {
    const signal = new AbortController().signal
    mockFetch(new DOMException('The operation was aborted.', 'AbortError'))

    await expect(searchRepositories('vue', { signal })).rejects.toMatchObject({
      name: 'AbortError',
    })
    expect(lastRequest().init.signal).toBe(signal)
  })

  it('rejects unexpected search payloads', async () => {
    mockFetch(jsonResponse({ unexpected: true }))

    await expect(searchRepositories('vue')).rejects.toBeInstanceOf(GithubApiError)
  })

  it('rejects unexpected detail payloads', async () => {
    mockFetch(jsonResponse({ unexpected: true }))

    await expect(getRepository('vuejs', 'vue')).rejects.toMatchObject({
      message: 'GitHub returned an unexpected response.',
    })
  })
})
