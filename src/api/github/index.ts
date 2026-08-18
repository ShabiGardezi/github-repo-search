import type {
  GetRepositoryOptions,
  GithubRepository,
  GithubRepositorySearchResult,
  SearchRepositoriesOptions,
} from './types'

export type {
  GetRepositoryOptions,
  GithubRepository,
  GithubRepositorySearchResult,
  GithubUser,
  SearchRepositoriesOptions,
} from './types'

const GITHUB_API_BASE_URL = 'https://api.github.com'
const GITHUB_API_VERSION = '2022-11-28'

export class GithubApiError extends Error {
  readonly status: number | null
  readonly isRateLimit: boolean
  readonly rateLimitReset: Date | null

  constructor(
    message: string,
    options: {
      status?: number | null
      isRateLimit?: boolean
      rateLimitReset?: Date | null
    } = {},
  ) {
    super(message)
    this.name = 'GithubApiError'
    this.status = options.status ?? null
    this.isRateLimit = options.isRateLimit ?? false
    this.rateLimitReset = options.rateLimitReset ?? null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error
    ? error.name === 'AbortError'
    : error instanceof DOMException && error.name === 'AbortError'
}

function mapRepository(value: unknown): GithubRepository {
  if (!isRecord(value) || !isRecord(value.owner)) {
    throw new GithubApiError('GitHub returned an unexpected response.')
  }

  const { id, name, full_name: fullName, owner } = value
  const login = owner.login

  if (
    typeof id !== 'number' ||
    typeof name !== 'string' ||
    typeof fullName !== 'string' ||
    typeof login !== 'string'
  ) {
    throw new GithubApiError('GitHub returned an unexpected response.')
  }

  return {
    id,
    name,
    fullName,
    description: typeof value.description === 'string' ? value.description : null,
    htmlUrl: typeof value.html_url === 'string' ? value.html_url : null,
    language: typeof value.language === 'string' ? value.language : null,
    stargazersCount: typeof value.stargazers_count === 'number' ? value.stargazers_count : 0,
    forksCount: typeof value.forks_count === 'number' ? value.forks_count : 0,
    updatedAt: typeof value.updated_at === 'string' ? value.updated_at : null,
    owner: {
      login,
      avatarUrl: typeof owner.avatar_url === 'string' ? owner.avatar_url : null,
    },
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (isRecord(body) && typeof body.message === 'string' && body.message) {
    return body.message
  }

  return fallback
}

function rateLimitReset(headers: Headers): Date | null {
  const reset = headers.get('x-ratelimit-reset')
  if (!reset) {
    return null
  }

  const seconds = Number(reset)
  return Number.isFinite(seconds) ? new Date(seconds * 1000) : null
}

function isRateLimitResponse(status: number, message: string, headers: Headers): boolean {
  if (status === 429) {
    return true
  }

  if (status !== 403) {
    return false
  }

  const remaining = headers.get('x-ratelimit-remaining')
  return remaining === '0' || /rate limit/i.test(message)
}

async function githubRequest(path: string, signal?: AbortSignal): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
      },
      signal,
    })
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }

    throw new GithubApiError('Unable to reach GitHub. Check your connection and try again.')
  }

  let body: unknown = null
  try {
    body = (await response.json()) as unknown
  } catch {
    body = null
  }

  if (!response.ok) {
    const message = errorMessage(body, `GitHub request failed (${response.status})`)
    throw new GithubApiError(message, {
      status: response.status,
      isRateLimit: isRateLimitResponse(response.status, message, response.headers),
      rateLimitReset: rateLimitReset(response.headers),
    })
  }

  return body
}

export async function searchRepositories(
  query: string,
  options: SearchRepositoriesOptions = {},
): Promise<GithubRepositorySearchResult> {
  const params = new URLSearchParams({ q: query })

  if (options.page !== undefined) {
    params.set('page', String(options.page))
  }

  if (options.perPage !== undefined) {
    params.set('per_page', String(options.perPage))
  }

  const body = await githubRequest(`/search/repositories?${params.toString()}`, options.signal)

  if (!isRecord(body) || !Array.isArray(body.items)) {
    throw new GithubApiError('GitHub returned an unexpected response.')
  }

  return {
    totalCount: typeof body.total_count === 'number' ? body.total_count : 0,
    incompleteResults: body.incomplete_results === true,
    items: body.items.map(mapRepository),
  }
}

export async function getRepository(
  owner: string,
  repo: string,
  options: GetRepositoryOptions = {},
): Promise<GithubRepository> {
  return mapRepository(
    await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      options.signal,
    ),
  )
}
