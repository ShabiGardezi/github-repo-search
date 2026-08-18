export type GithubUser = {
  login: string
  avatarUrl: string | null
}

export type GithubRepository = {
  id: number
  name: string
  fullName: string
  description: string | null
  htmlUrl: string | null
  language: string | null
  stargazersCount: number
  forksCount: number
  owner: GithubUser
  updatedAt: string | null
}

export type GithubRepositorySearchResult = {
  totalCount: number
  incompleteResults: boolean
  items: GithubRepository[]
}

export type SearchRepositoriesOptions = {
  page?: number
  perPage?: number
  signal?: AbortSignal
}

export type GetRepositoryOptions = {
  signal?: AbortSignal
}
