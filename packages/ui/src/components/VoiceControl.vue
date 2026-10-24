<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import UiButton from './UiButton.vue'

export type VoiceStatus = 'idle' | 'recording' | 'waiting' | 'speaking' | 'error'

const props = withDefaults(defineProps<{
  active?: boolean
  preparing?: boolean
  status: VoiceStatus
  label: string
  actionLabel?: string | null
  cancelLabel?: string | null
  interruptLabel?: string | null
  disabled?: boolean
  inputLevel?: number
  inputActive?: boolean
}>(), { active: false, preparing: false, actionLabel: null, cancelLabel: null, interruptLabel: null, disabled: false, inputLevel: 0, inputActive: false })

const emit = defineEmits<{ start: []; cancel: []; interrupt: [] }>()
const enabled = computed(() => props.active && !props.preparing)
const showInput = computed(() => enabled.value && props.inputActive && props.status !== 'error')
const level = computed(() => showInput.value ? props.inputLevel : 0)
const samples = ref<number[]>(Array(24).fill(0))
watch([showInput, level], ([next, value], [previous]) => {
  const history = next === previous ? samples.value : Array(24).fill(0)
  samples.value = [...history.slice(1), value]
})
const feedbackLabel = computed(() => {
  if (props.preparing) return '正在连接'
  if (props.status === 'error') return props.label
  return ''
})
function height(value: number) { return `${Math.max(3, Math.min(30, Math.sqrt(value) * 85))}px` }
</script>

<template>
  <section class="lie-voice" :data-status="status" :data-conversation="enabled ? 'active' : 'inactive'" aria-label="语音对话控制">
    <div v-if="$slots.details" class="lie-voice__details"><slot name="details" /></div>
    <div class="lie-voice__main">
      <div class="lie-voice__actions">
        <UiButton v-if="cancelLabel != null" variant="secondary" :disabled="disabled" @click="emit('cancel')">{{ cancelLabel }}</UiButton>
        <UiButton v-if="interruptLabel != null" variant="secondary" :disabled="disabled" @click="emit('interrupt')">{{ interruptLabel }}</UiButton>
        <UiButton v-if="actionLabel != null" :disabled="disabled" :aria-pressed="enabled" @click="emit('start')"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>{{ actionLabel }}</UiButton>
      </div>
      <div class="lie-voice__feedback">
        <span v-if="feedbackLabel" class="lie-voice__status" role="status">{{ feedbackLabel }}</span>
        <template v-else-if="showInput">
          <div class="lie-voice__waveform" aria-label="玩家声音音量" role="img"><i v-for="(sample, index) in samples" :key="index" :style="{ height: height(sample) }" /></div>
          <meter class="lie-voice__static-meter" aria-label="玩家声音音量" min="0" max="1" :value="level" />
        </template>
      </div>
    </div>
    <div v-if="$slots.answer" class="lie-voice__answer"><slot name="answer" /></div>
  </section>
</template>

<style scoped>
.lie-voice { display: grid; grid-template-columns: 82px minmax(0, 1fr) auto; align-items: center; gap: 16px; min-height: 124px; border: 2px solid var(--lie-ink); border-radius: 24px; background: var(--lie-surface); padding: 16px 20px; box-shadow: 0 4px #111b4520; }
.lie-voice__details { min-width: 0; }
.lie-voice__main { display: flex; align-items: center; gap: 24px; min-width: 0; }
.lie-voice__actions { display: flex; gap: 12px; flex: 0 0 auto; padding: 0; }
.lie-voice__actions :deep(.lie-button) { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; min-width: 146px; border: 2px solid var(--lie-ink); border-radius: 14px; padding: 10px 16px; font-size: 14px; font-weight: 800; box-shadow: 0 3px var(--lie-ink); }
.lie-voice__actions svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
.lie-voice__feedback { display: flex; flex: 1; flex-direction: column; justify-content: center; max-width: 390px; min-width: 0; height: 48px; }
.lie-voice__status { flex: none; font-size: 13px; line-height: 20px; font-weight: 800; }
.lie-voice__waveform { display: flex; align-items: center; gap: 3px; height: 32px; overflow: hidden; }
.lie-voice__waveform i { flex: 1; min-width: 2px; max-width: 8px; border-radius: 3px; background: #202020; }
.lie-voice__static-meter { display: none; width: 100%; }
.lie-voice__answer { display: flex; align-items: center; justify-content: flex-end; }
.lie-voice__answer :deep(.lie-button) { min-height: 42px; border: 2px solid var(--lie-ink); border-radius: 12px; padding: 8px 10px; font-size: 13px; box-shadow: 0 2px var(--lie-ink); white-space: nowrap; }
@media (max-width: 1150px) and (min-width: 701px) {
  .lie-voice { grid-template-columns: 72px minmax(0, 1fr) auto; min-height: 132px; gap: 12px; padding: 12px 16px; }
  .lie-voice__main { gap: 18px; }
  .lie-voice__actions :deep(.lie-button) { min-width: 140px; }
}
@media (max-width: 700px) {
  .lie-voice { position: fixed; bottom: 0; left: 0; right: 0; z-index: 4; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: auto auto; min-height: 0; gap: 10px 14px; border-radius: 22px 22px 0 0; padding: 12px 16px calc(16px + env(safe-area-inset-bottom)); box-shadow: 0 -4px 16px #111b4514; }
  .lie-voice__details { grid-column: 1; grid-row: 1; }
  .lie-voice__answer { grid-column: 2; grid-row: 1; }
  .lie-voice__answer :deep(.lie-button) { min-height: 34px; padding: 5px 10px; font-size: 12px; }
  .lie-voice__main { grid-column: 1 / -1; grid-row: 2; gap: 16px; }
  .lie-voice__actions :deep(.lie-button) { min-width: 128px; padding-inline: 10px; font-size: 13px; }
  .lie-voice__feedback { max-width: none; }
  .lie-voice__status { font-size: 12px; }
  .lie-voice__waveform { height: 30px; gap: 2px; }
  .lie-voice__waveform i { min-width: 1px; }
}
@media (prefers-reduced-motion: reduce) {
  .lie-voice__waveform { display: none; }
  .lie-voice__static-meter { display: block; }
}
</style>
