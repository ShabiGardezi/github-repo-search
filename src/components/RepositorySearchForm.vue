<script setup lang="ts">
import { computed } from 'vue'

const query = defineModel<string>({ required: true })

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

const isSubmitDisabled = computed(() => props.loading || query.value.trim().length === 0)

function onSubmit(): void {
  if (isSubmitDisabled.value) {
    return
  }

  emit('submit')
}
</script>

<template>
  <v-form class="search-form" @submit.prevent="onSubmit">
    <v-row dense align="center">
      <v-col cols="12" sm>
        <v-text-field
          v-model="query"
          label="Search repositories"
          placeholder="e.g. vue"
          hide-details
          variant="outlined"
          density="comfortable"
          autocomplete="off"
        />
      </v-col>
      <v-col cols="12" sm="auto">
        <v-btn
          class="search-form__button"
          type="submit"
          color="primary"
          size="large"
          :loading="loading"
          :disabled="isSubmitDisabled"
          block
        >
          Search
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<style scoped lang="scss">
.search-form__button {
  min-width: 8rem;
}
</style>
