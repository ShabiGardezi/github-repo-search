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
</script>

<template>
  <v-card variant="outlined">
    <v-card-item>
      <v-card-title class="text-wrap break-long">{{ repository.name }}</v-card-title>
      <v-card-subtitle class="break-long">{{ repository.owner.login }}</v-card-subtitle>
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
      <v-btn class="mt-4" variant="tonal" @click="emit('select')">
        View details
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.repository-card__description {
  margin: 0 0 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  max-height: 6rem;
  overflow: auto;
}

.repository-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  font-size: 0.875rem;
}

.break-long {
  overflow-wrap: anywhere;
}
</style>
