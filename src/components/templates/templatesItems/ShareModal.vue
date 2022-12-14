<template>
  <base-modal id="sharewith" title="Share with" :close-dialog="close">
    <div class="flex flex-col space-y-2 p-6 width">
      <h1 class="text-xl font-bold">Shared With</h1>
      <p class="text-gray-400 text-sm">
        This presentation is shared with the following users:
      </p>
      <h1 class="uppercase text-secondary text-xs font-semibold pb-2">
        MEMBERS ONLINE
      </h1>

      <ShareModalItems
        v-for="(member, i) in sharedWithUsers"
        :key="i"
        :member="member"
        :template-id="templateId"
        @send-message="sendMessage"
      />

      <p v-if="sharedWithUsers?.length === 0">Not shared with members</p>
      <div class="flex justify-between pt-2">
        <button
          class="text-gray-400 flex items-center pr-4"
          @click="$emit('hide'), shareModalCancelGaLog()"
        >
          <svg-icon name="left_arrow" class="h-4 w-6" />
          <div class="text-lg ml-1">cancel</div>
        </button>
        <dp-button
          text="Update"
          class="py-2 px-12 text-white bg-secondary"
          @click="close(), shareModalUpdatelGaLog()"
        />
      </div>
      <p class="w-full text-emerald-400 text-right mt-1">
        {{ successMessage }}
      </p>
      <ErrorBanner :message="errorMessage" class="ml-auto mr-0 mt-1" />
    </div>
  </base-modal>
</template>
<script>
import BaseModal from '@/components/utils/container/BaseModal.vue'
import DpButton from '@/components/buttons/DpButton.vue'
import ShareModalItems from '@/components/templates/templatesItems/ShareModalItems.vue'
import ErrorBanner from '@/components/utils/ErrorBanner.vue'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { gaEvent } from '@/utils/GA_Event.js'

export default {
  components: { BaseModal, DpButton, ShareModalItems, ErrorBanner },
  props: {
    templateId: {
      type: String,
      required: true,
    },
  },
  emits: ['hide'],
  setup(props, { emit }) {
    const store = useStore()
    const successMessage = ref('')
    const errorMessage = ref('')
    const sendMessage = (msg) => {
      successMessage.value = ''
      errorMessage.value = ''
      if (msg == 'Successfully Shared') successMessage.value = msg
      else errorMessage.value = msg
    }

    const templateState = computed(() =>
      store.getters['templates/getTemplateByID'](props.templateId),
    )

    const sharedWithUsers = computed(() =>
      templateState.value.internalUserDetails?.filter(
        (user) => user.role !== 'OWNER' && user.role !== 'NONE',
      ),
    )

    const close = () => {
      emit('hide')
    }

    const shareModalCancelGaLog = () => {
      gaEvent({
        action: 'share-modal-cancel-click',
        event_category: 'dashboard',
        event_label: 'User-clicked-share-modal-cancel-btn',
      })
    }
    const shareModalUpdatelGaLog = () => {
      gaEvent({
        action: 'share-modal-update-click',
        event_category: 'dashboard',
        event_label: 'User-clicked-share-modal-update-btn',
      })
    }
    return {
      close,
      successMessage,
      errorMessage,
      sendMessage,
      sharedWithUsers,
      shareModalCancelGaLog,
      shareModalUpdatelGaLog,
    }
  },
}
</script>
<style scoped>
.width {
  width: 480px;
}
</style>
