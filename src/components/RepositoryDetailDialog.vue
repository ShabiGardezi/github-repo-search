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
    max-width="36rem"
    scrollable
    aria-labelledby="repository-detail-title"
    @update:model-value="onOpenChange"
  >
    <v-card>
      <v-card-item>
        <v-card-title id="repository-detail-title" class="text-wrap break-long">
          {{ title }}
        </v-card-title>
        <template #append>
          <v-btn variant="text" @click="emit('close')">Close</v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <div v-if="loading" role="status">
          <v-progress-linear color="primary" indeterminate />
          <p class="detail-status">Loading…</p>
        </div>

        <v-alert
          v-else-if="error"
          :type="error.isRateLimit ? 'warning' : 'error'"
          variant="tonal"
        >
          {{ error.message }}
        </v-alert>

        <template v-else-if="repository">
          <p class="break-long">{{ repository.owner.login }}</p>
          <p v-if="repository.description" class="break-long">{{ repository.description }}</p>

          <ul class="detail-list">
            <li v-if="repository.language">Language: {{ repository.language }}</li>
            <li>Stars: {{ repository.stargazersCount.toLocaleString('en-US') }}</li>
            <li>Forks: {{ repository.forksCount.toLocaleString('en-US') }}</li>
            <li>Open issues: {{ repository.openIssuesCount.toLocaleString('en-US') }}</li>
            <li v-if="repository.license">License: {{ repository.license }}</li>
            <li v-if="createdLabel">Created: {{ createdLabel }}</li>
            <li v-if="updatedLabel">Updated: {{ updatedLabel }}</li>
          </ul>

          <a
            v-if="repository.htmlUrl"
            :href="repository.htmlUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub (opens in a new tab)
          </a>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.detail-status {
  margin: 0.75rem 0 0;
}

.detail-list {
  margin: 0 0 1rem;
  padding-left: 1.25rem;
}

.break-long {
  overflow-wrap: anywhere;
}
</style>
