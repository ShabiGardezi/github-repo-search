<script setup lang="ts">
import RepositoryCard from '@/components/RepositoryCard.vue'
import RepositoryDetailDialog from '@/components/RepositoryDetailDialog.vue'
import RepositorySearchForm from '@/components/RepositorySearchForm.vue'
import { useRepositoryDetail } from '@/composables/useRepositoryDetail'
import { useRepositorySearch } from '@/composables/useRepositorySearch'

const { query, repositories, isLoading, error, isEmpty, search } = useRepositorySearch()
const {
  isOpen: isDetailOpen,
  repository: selectedRepository,
  isLoading: isDetailLoading,
  error: detailError,
  open: openDetail,
  close: closeDetail,
} = useRepositoryDetail()
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="search-page">
        <header class="search-page__header">
          <h1 class="search-page__title">GitHub Repository Search</h1>
          <p class="search-page__subtitle">Find public repositories on GitHub.</p>
        </header>

        <v-sheet class="search-page__panel" border rounded="lg">
          <RepositorySearchForm v-model="query" :loading="isLoading" @submit="search" />

          <div class="search-feedback" aria-live="polite" aria-atomic="true">
            <template v-if="isLoading">
              <v-progress-linear class="search-feedback__progress" indeterminate />
              <p class="search-feedback__loading" role="status">Searching…</p>
            </template>

            <v-alert
              v-else-if="error"
              class="search-feedback__alert"
              :type="error.isRateLimit ? 'warning' : 'error'"
              role="alert"
            >
              {{ error.message }}
            </v-alert>

            <v-alert
              v-else-if="isEmpty"
              class="search-feedback__alert"
              type="info"
              role="status"
            >
              No repositories found. Try a different search.
            </v-alert>
          </div>
        </v-sheet>

        <section
          v-if="!isLoading && !error && repositories.length > 0"
          class="search-page__results"
          aria-labelledby="search-results-heading"
        >
          <h2 id="search-results-heading" class="sr-only">Search results</h2>
          <ul class="repository-list" role="list">
            <li v-for="repository in repositories" :key="repository.id">
              <RepositoryCard
                :repository="repository"
                @select="openDetail(repository.owner.login, repository.name)"
              />
            </li>
          </ul>
        </section>

        <RepositoryDetailDialog
          :open="isDetailOpen"
          :loading="isDetailLoading"
          :error="detailError"
          :repository="selectedRepository"
          @close="closeDetail"
        />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped lang="scss">
.search-page {
  max-width: 46rem;
  padding-top: 2.5rem;
  padding-bottom: 3rem;
}

.search-page__header {
  margin-bottom: 1.5rem;
}

.search-page__title {
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin: 0 0 0.375rem;
}

.search-page__subtitle {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
}

.search-page__panel {
  padding: 1.25rem;
}

.search-feedback__progress {
  margin-top: 1.25rem;
}

.search-feedback__loading {
  margin: 0.75rem 0 0;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.9375rem;
}

.search-feedback__alert {
  margin-top: 1.25rem;
}

.search-page__results {
  margin-top: 1.25rem;
}

.repository-list {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 600px) {
  .search-page {
    padding-top: 3.5rem;
  }

  .search-page__panel {
    padding: 1.5rem;
  }
}
</style>
