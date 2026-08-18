import { nextTick, ref } from 'vue'
import { getRepository, toGithubApiError } from '@/api/github'
import type { GithubApiError, GithubRepository } from '@/api/github'

export function useRepositoryDetail() {
  const isOpen = ref(false)
  const repository = ref<GithubRepository | null>(null)
  const isLoading = ref(false)
  const error = ref<GithubApiError | null>(null)
  let inFlight: AbortController | null = null
  let triggerEl: HTMLElement | null = null

  async function open(owner: string, repo: string): Promise<void> {
    const active = document.activeElement
    triggerEl = active instanceof HTMLElement ? active : null

    inFlight?.abort()
    const controller = new AbortController()
    inFlight = controller

    isOpen.value = true
    isLoading.value = true
    error.value = null
    repository.value = null

    try {
      const result = await getRepository(owner, repo, { signal: controller.signal })
      if (inFlight !== controller) {
        return
      }

      repository.value = result
    } catch (caught: unknown) {
      if (controller.signal.aborted || inFlight !== controller) {
        return
      }

      error.value = toGithubApiError(caught)
    } finally {
      if (inFlight === controller) {
        isLoading.value = false
      }
    }
  }

  function close(): void {
    const el = triggerEl
    triggerEl = null
    inFlight?.abort()
    inFlight = null
    isOpen.value = false
    isLoading.value = false
    error.value = null
    repository.value = null

    void nextTick(() => {
      el?.focus()
    })
  }

  return {
    isOpen,
    repository,
    isLoading,
    error,
    open,
    close,
  }
}
