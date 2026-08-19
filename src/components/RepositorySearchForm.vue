<script setup lang="ts">
import { computed } from 'vue'

const query = defineModel<string>({ required: true })

defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

const isSubmitDisabled = computed(() => query.value.trim().length === 0)

function onSubmit(): void {
  if (isSubmitDisabled.value) {
    return
  }

  emit('submit')
}
</script>

<template>
  <v-form
    class="search-form"
    :aria-busy="loading"
    @submit.prevent="onSubmit"
  >
    <v-text-field
      id="repository-search-input"
      v-model="query"
      class="search-form__field"
      label="Search repositories"
      placeholder="e.g. vue"
      hide-details
      density="comfortable"
      autocomplete="off"
      name="repository-query"
    />
    <v-btn
      class="search-form__button"
      type="submit"
      color="primary"
      height="48"
      :disabled="isSubmitDisabled"
    >
      Search
    </v-btn>
  </v-form>
</template>

<style scoped lang="scss">
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0.75rem;
}

.search-form__field {
  flex: 1 1 16rem;
  min-width: 0;
}

.search-form__button {
  flex: 1 1 100%;
  min-width: 7.5rem;
  letter-spacing: 0.01em;
}

@media (min-width: 600px) {
  .search-form__button {
    flex: 0 0 auto;
  }
}
</style>
