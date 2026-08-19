<script setup lang="ts">
import { computed } from 'vue'
import type { GithubApiError, GithubRepository } from '@/api/github'
import { formatGithubDate } from '@/utils/formatGithubDate'

const props = defineProps<{
  open: boolean
  loading: boolean
  error: GithubApiError | null
  repository: GithubRepository | null
}>()

const emit = defineEmits<{
  close: []
}>()

const title = computed(() => props.repository?.name ?? 'Repository details')
const createdLabel = computed(() => formatGithubDate(props.repository?.createdAt ?? null))
const updatedLabel = computed(() => formatGithubDate(props.repository?.updatedAt ?? null))

function onOpenChange(value: boolean): void {
  if (!value) {
    emit('close')
  }
}
</script>

<template>
  <v-dialog
    :model-value="open"
    max-width="40rem"
    scrollable
    aria-labelledby="repository-detail-title"
    @update:model-value="onOpenChange"
  >
    <v-card class="detail-card" border>
      <v-card-item>
        <v-card-title id="repository-detail-title" class="detail-card__title break-long">
          {{ title }}
        </v-card-title>
        <v-card-subtitle v-if="repository" class="detail-card__owner break-long">
          {{ repository.owner.login }}
        </v-card-subtitle>
        <template #append>
          <v-btn variant="text" aria-label="Close repository details" @click="emit('close')">
            Close
          </v-btn>
        </template>
      </v-card-item>

      <v-divider />

      <v-card-text>
        <div v-if="loading" class="detail-loading" role="status">
          <v-progress-linear indeterminate />
          <p class="detail-status">Loading…</p>
        </div>

        <v-alert
          v-else-if="error"
          :type="error.isRateLimit ? 'warning' : 'error'"
          role="alert"
        >
          {{ error.message }}
        </v-alert>

        <template v-else-if="repository">
          <p v-if="repository.description" class="detail-description break-long">
            {{ repository.description }}
          </p>

          <dl class="detail-list">
            <div v-if="repository.language" class="detail-list__row">
              <dt>Language</dt>
              <dd>{{ repository.language }}</dd>
            </div>
            <div class="detail-list__row">
              <dt>Stars</dt>
              <dd>{{ repository.stargazersCount.toLocaleString('en-US') }}</dd>
            </div>
            <div class="detail-list__row">
              <dt>Forks</dt>
              <dd>{{ repository.forksCount.toLocaleString('en-US') }}</dd>
            </div>
            <div class="detail-list__row">
              <dt>Open issues</dt>
              <dd>{{ repository.openIssuesCount.toLocaleString('en-US') }}</dd>
            </div>
            <div v-if="repository.license" class="detail-list__row">
              <dt>License</dt>
              <dd>{{ repository.license }}</dd>
            </div>
            <div v-if="createdLabel" class="detail-list__row">
              <dt>Created</dt>
              <dd>{{ createdLabel }}</dd>
            </div>
            <div v-if="updatedLabel" class="detail-list__row">
              <dt>Updated</dt>
              <dd>{{ updatedLabel }}</dd>
            </div>
          </dl>
        </template>
      </v-card-text>

      <v-card-actions v-if="repository?.htmlUrl && !loading && !error">
        <v-btn
          :href="repository.htmlUrl"
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          color="primary"
        >
          View on GitHub (opens in a new tab)
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.detail-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.detail-card__owner {
  opacity: 1;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.detail-loading {
  padding: 0.5rem 0 0.25rem;
}

.detail-status {
  margin: 0.75rem 0 0;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.detail-description {
  margin: 0 0 1.25rem;
  color: rgba(var(--v-theme-on-surface), 0.78);
  font-size: 0.9375rem;
  line-height: 1.55;
}

.detail-list {
  display: grid;
  gap: 0.625rem 1.5rem;
  margin: 0;
}

.detail-list__row {
  display: grid;
  grid-template-columns: 8.5rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: baseline;
}

.detail-list__row dt {
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 0.8125rem;
  font-weight: 500;
}

.detail-list__row dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.detail-card :deep(.v-card-actions) {
  padding: 0.5rem 1rem 1rem;
}

@media (max-width: 599px) {
  .detail-list__row {
    grid-template-columns: 1fr;
    gap: 0.125rem;
  }
}

.break-long {
  overflow-wrap: anywhere;
}
</style>
