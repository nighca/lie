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
    <span class="lie-voice__symbol" aria-hidden="true">
      <svg v-if="status === 'speaking'" viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15h7l9-8v26l-9-8H5Z"/><path d="M28 13q8 7 0 14M32 7q14 13 0 26"/></svg>
      <span v-else-if="status === 'error'" class="lie-voice__error">!</span>
      <span v-else-if="status === 'waiting'" class="lie-voice__waiting">•••</span>
      <svg v-else viewBox="0 0 32 40" width="32" height="40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="10" y="3" width="12" height="22" rx="6" /><path d="M4 19v2a12 12 0 0 0 24 0v-2M16 33v5M10 38h12" /></svg></span>
    <div class="lie-voice__status"><strong role="status" aria-live="polite">{{ label }}</strong><slot name="meter" /></div>
    <div class="lie-voice__actions">
      <UiButton v-if="cancelLabel != null" variant="secondary" :disabled="disabled" @click="emit('cancel')">{{ cancelLabel }}</UiButton>
      <UiButton v-if="interruptLabel != null" variant="secondary" :disabled="disabled" @click="emit('interrupt')">{{ interruptLabel }}</UiButton>
      <UiButton v-if="actionLabel != null" :disabled="disabled" @click="emit('start')">{{ actionLabel }}</UiButton>
    </div>
  </section>
</template>

<style scoped>
.lie-voice { gap: 24px; min-height: 124px; border-radius: 42px; padding: 20px 24px; box-shadow: 0 5px 0 #111b451a; }
.lie-voice__symbol { position: relative; width: 80px; height: 80px; box-shadow: inset 0 -5px 0 #0049d6; }
.lie-voice__status strong { display: block; font-size: 22px; font-weight: 800; line-height: 1.4; }
.lie-voice__actions { justify-content: flex-end; gap: 12px; }
.lie-voice__actions :deep(.lie-button) { font-size: 18px; }
.lie-voice__waiting { font-size: 22px; letter-spacing: 1px; }
.lie-voice__error { font-size: 48px; font-weight: 800; }
.lie-voice[data-status='error'] .lie-voice__symbol { background: var(--lie-coral); box-shadow: none; }
@media (max-width: 700px) {
  .lie-voice { padding: 16px; gap: 16px; border-radius: 28px; }
  .lie-voice__symbol { width: 64px; height: 64px; }
  .lie-voice__status strong { font-size: 20px; }
  .lie-voice__actions { justify-content: flex-start; }
}
</style>
