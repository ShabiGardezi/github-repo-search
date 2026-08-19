export type GithubUser = {
  login: string
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
  openIssuesCount: number
  license: string | null
  owner: GithubUser
  createdAt: string | null
  updatedAt: string | null
}

export type GithubRepositorySearchResult = {
  items: GithubRepository[]
}

export type SearchRepositoriesOptions = {
  signal?: AbortSignal
}

export type GetRepositoryOptions = {
  signal?: AbortSignal
}
