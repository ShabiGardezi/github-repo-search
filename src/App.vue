<script setup lang="ts">
import { GITHUB_RATE_LIMIT_MESSAGE } from '@/api/github'
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
      <v-container class="search-page py-8">
        <h1 class="search-page__title">GitHub Repository Search</h1>
        <p class="search-page__subtitle">Find public repositories on GitHub.</p>

        <RepositorySearchForm v-model="query" :loading="isLoading" @submit="search" />

        <div class="search-feedback" aria-live="polite">
          <template v-if="isLoading">
            <v-progress-linear class="mt-6" color="primary" indeterminate />
            <p class="search-feedback__loading" role="status">Searching…</p>
          </template>

          <v-alert
            v-else-if="error?.isRateLimit"
            class="mt-6"
            type="warning"
            variant="tonal"
          >
            {{ GITHUB_RATE_LIMIT_MESSAGE }}
          </v-alert>

          <v-alert v-else-if="error" class="mt-6" type="error" variant="tonal">
            {{ error.message }}
          </v-alert>

          <v-alert v-else-if="isEmpty" class="mt-6" type="info" variant="tonal">
            No repositories found. Try a different search.
          </v-alert>
        </div>

        <div v-if="!isLoading && !error && repositories.length > 0" class="repository-list">
          <RepositoryCard
            v-for="repository in repositories"
            :key="repository.id"
            :repository="repository"
            @select="openDetail(repository.owner.login, repository.name)"
          />
        </div>

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
  max-width: 48rem;
}

.search-page__title {
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 0.25rem;
}

.search-page__subtitle {
  color: rgba(var(--v-theme-on-surface), 0.65);
  margin: 0 0 1.5rem;
}

.search-feedback__loading {
  margin: 0.75rem 0 0;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.repository-list {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
