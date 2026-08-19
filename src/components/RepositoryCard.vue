<script setup lang="ts">
import { computed } from 'vue'
import type { GithubRepository } from '@/api/github'
import { formatGithubDate } from '@/utils/formatGithubDate'

const props = defineProps<{
  repository: GithubRepository
}>()

const emit = defineEmits<{
  select: []
}>()

const updatedLabel = computed(() => {
  const formatted = formatGithubDate(props.repository.updatedAt)
  return formatted ? `Updated ${formatted}` : null
})

const detailsLabel = computed(() => `View details for ${props.repository.fullName}`)
</script>

<template>
  <v-card class="repository-card" variant="outlined">
    <v-card-item>
      <v-card-title class="repository-card__title break-long">{{ repository.name }}</v-card-title>
      <v-card-subtitle class="repository-card__owner break-long">{{ repository.owner.login }}</v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <p v-if="repository.description" class="repository-card__description break-long">
        {{ repository.description }}
      </p>
      <div class="repository-card__meta">
        <span v-if="repository.language">{{ repository.language }}</span>
        <span>{{ repository.stargazersCount.toLocaleString('en-US') }} stars</span>
        <span>{{ repository.forksCount.toLocaleString('en-US') }} forks</span>
        <span v-if="updatedLabel">{{ updatedLabel }}</span>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn variant="tonal" color="primary" :aria-label="detailsLabel" @click="emit('select')">
        View details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped lang="scss">
.repository-card {
  height: 100%;
}

.repository-card :deep(.v-card-item) {
  padding-bottom: 0.25rem;
}

.repository-card__title {
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.35;
}

.repository-card__owner {
  opacity: 1;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 0.875rem;
}

.repository-card__description {
  margin: 0 0 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 0.9375rem;
  line-height: 1.5;
  max-height: 6rem;
  overflow: auto;
}

.repository-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.repository-card :deep(.v-card-actions) {
  padding: 0 1rem 1rem;
}

@media (hover: hover) {
  .repository-card:hover {
    border-color: rgba(var(--v-theme-primary), 0.28);
    background: rgba(var(--v-theme-primary), 0.02);
  }
}

.repository-card:focus-within {
  border-color: rgb(var(--v-theme-primary));
}

.break-long {
  overflow-wrap: anywhere;
}
</style>
