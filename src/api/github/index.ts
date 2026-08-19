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

  constructor(
    message: string,
    options: {
      status?: number | null
      isRateLimit?: boolean
    } = {},
  ) {
    super(message)
    this.name = 'GithubApiError'
    this.status = options.status ?? null
    this.isRateLimit = options.isRateLimit ?? false
  }
}

export const GITHUB_RATE_LIMIT_MESSAGE = 'GitHub rate limit reached. Try again later.'

export function toGithubApiError(caught: unknown): GithubApiError {
  return caught instanceof GithubApiError
    ? caught
    : new GithubApiError('Something went wrong. Please try again.')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error
    ? error.name === 'AbortError'
    : error instanceof DOMException && error.name === 'AbortError'
}

function mapRepository(value: unknown): GithubRepository | null {
  if (!isRecord(value) || !isRecord(value.owner)) {
    return null
  }

  const id = value.id
  const name = nonEmptyString(value.name)
  const fullName = nonEmptyString(value.full_name)
  const login = nonEmptyString(value.owner.login)

  if (typeof id !== 'number' || !name || !fullName || !login) {
    return null
  }

  return {
    id,
    name,
    fullName,
    description: nonEmptyString(value.description),
    htmlUrl: nonEmptyString(value.html_url),
    language: nonEmptyString(value.language),
    stargazersCount: typeof value.stargazers_count === 'number' ? value.stargazers_count : 0,
    forksCount: typeof value.forks_count === 'number' ? value.forks_count : 0,
    openIssuesCount: typeof value.open_issues_count === 'number' ? value.open_issues_count : 0,
    license: isRecord(value.license) ? nonEmptyString(value.license.name) : null,
    createdAt: nonEmptyString(value.created_at),
    updatedAt: nonEmptyString(value.updated_at),
    owner: {
      login,
    },
  }
}

function githubErrorMessage(body: unknown): string {
  if (isRecord(body) && typeof body.message === 'string' && body.message) {
    return body.message
  }

  return ''
}

function isRateLimitResponse(status: number, githubMessage: string, headers: Headers): boolean {
  if (status === 429) {
    return true
  }

  if (status !== 403) {
    return false
  }

  const remaining = headers.get('x-ratelimit-remaining')
  return remaining === '0' || /rate limit/i.test(githubMessage)
}

function userFacingHttpMessage(status: number, isRateLimit: boolean): string {
  if (isRateLimit) {
    return GITHUB_RATE_LIMIT_MESSAGE
  }

  if (status === 404) {
    return 'Nothing was found for this request.'
  }

  if (status === 422) {
    return 'That search is not valid. Try different keywords.'
  }

  if (status === 403) {
    return 'GitHub denied this request. Try again later.'
  }

  if (status >= 500) {
    return 'GitHub is unavailable. Try again later.'
  }

  return 'Something went wrong. Please try again.'
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
    const githubMessage = githubErrorMessage(body)
    const isRateLimit = isRateLimitResponse(response.status, githubMessage, response.headers)
    throw new GithubApiError(userFacingHttpMessage(response.status, isRateLimit), {
      status: response.status,
      isRateLimit,
    })
  }

  return body
}

export async function searchRepositories(
  query: string,
  options: SearchRepositoriesOptions = {},
): Promise<GithubRepositorySearchResult> {
  const params = new URLSearchParams({ q: query })
  const body = await githubRequest(`/search/repositories?${params.toString()}`, options.signal)

  if (!isRecord(body) || !Array.isArray(body.items)) {
    throw new GithubApiError('GitHub returned an unexpected response.')
  }

  return {
    items: body.items.map((item) => {
      const repository = mapRepository(item)
      if (!repository) {
        throw new GithubApiError('GitHub returned an unexpected response.')
      }

      return repository
    }),
  }
}

export async function getRepository(
  owner: string,
  repo: string,
  options: GetRepositoryOptions = {},
): Promise<GithubRepository> {
  const repository = mapRepository(
    await githubRequest(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      options.signal,
    ),
  )

  if (!repository) {
    throw new GithubApiError('GitHub returned an unexpected response.')
  }

  return repository
}
