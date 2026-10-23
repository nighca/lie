<script setup lang="ts">
import UiButton from './UiButton.vue'

export type VoiceStatus = 'idle' | 'recording' | 'waiting' | 'speaking' | 'error'

withDefaults(defineProps<{
  status: VoiceStatus
  label: string
  actionLabel?: string | null
  cancelLabel?: string | null
  interruptLabel?: string | null
  disabled?: boolean
}>(), { actionLabel: null, cancelLabel: null, interruptLabel: null, disabled: false })

const emit = defineEmits<{ start: []; cancel: []; interrupt: [] }>()
</script>

<template>
  <section class="lie-voice" :data-status="status" aria-label="语音对话控制">
    <span class="lie-voice__symbol" aria-hidden="true"><svg viewBox="0 0 32 40" width="32" height="40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="10" y="3" width="12" height="22" rx="6" /><path d="M4 19v2a12 12 0 0 0 24 0v-2M16 33v5M10 38h12" /></svg></span>
    <div class="lie-voice__status"><strong role="status" aria-live="polite">{{ label }}</strong><slot name="meter" /></div>
    <div class="lie-voice__actions">
      <UiButton v-if="cancelLabel != null" variant="secondary" :disabled="disabled" @click="emit('cancel')">{{ cancelLabel }}</UiButton>
      <UiButton v-if="interruptLabel != null" variant="secondary" :disabled="disabled" @click="emit('interrupt')">{{ interruptLabel }}</UiButton>
      <UiButton v-if="actionLabel != null" :disabled="disabled" @click="emit('start')">{{ actionLabel }}</UiButton>
    </div>
  </section>
</template>
