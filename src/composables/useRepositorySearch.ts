import { computed, ref } from 'vue'
import { searchRepositories, toGithubApiError } from '@/api/github'
import type { GithubApiError, GithubRepository } from '@/api/github'

export function useRepositorySearch() {
  const query = ref('')
  const repositories = ref<GithubRepository[]>([])
  const isLoading = ref(false)
  const error = ref<GithubApiError | null>(null)
  const hasSearched = ref(false)

  const isEmpty = computed(
    () => hasSearched.value && !isLoading.value && error.value === null && repositories.value.length === 0,
  )

  async function search(): Promise<void> {
    const trimmedQuery = query.value.trim()
    if (!trimmedQuery || isLoading.value) {
      return
    }

    isLoading.value = true
    error.value = null
    repositories.value = []
    hasSearched.value = true

    try {
      const result = await searchRepositories(trimmedQuery)
      repositories.value = result.items
    } catch (caught: unknown) {
      error.value = toGithubApiError(caught)
    } finally {
      isLoading.value = false
    }
  }

  return {
    query,
    repositories,
    isLoading,
    error,
    isEmpty,
    search,
  }
}
