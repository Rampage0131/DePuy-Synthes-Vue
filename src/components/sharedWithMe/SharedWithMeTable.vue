<template>
  <table class="w-full">
    <thead class="main-page-table-header">
      <tr>
        <th class="px-3"></th>
        <th>Customer Name</th>
        <th>My Access</th>
        <th>Shared by</th>
        <th />
      </tr>
    </thead>
    <tbody class="divide-y">
      <shared-with-me-row v-for="rfp in sharedRfps" :key="rfp.id" :rfp="rfp" />
    </tbody>
  </table>
  <ApiState
    v-if="sharedRfps.length === 0"
    :loading="isLoading"
    :error-message="loadingError"
    class="w-full"
  />
</template>

<script>
import ApiState from '@/components/utils/apiState.vue'
import SharedWithMeRow from './SharedWithMeRow.vue'

export default {
  components: { SharedWithMeRow, ApiState },
  props: {
    sharedRfps: { type: Array, required: true },
    isLoading: { type: Boolean, required: true },
    loadingError: { type: String, required: true },
  },
}
</script>
