<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { UiButton } from '@lie/ui'

import CharacterNameText from './CharacterNameText.vue'

const props = withDefaults(defineProps<{ name: string; accent?: string | null }>(), { accent: null })
const emit = defineEmits<{ cancel: [] }>()
const step = ref(0)
const timers = [700, 1400, 2100].map((delay, index) => setTimeout(() => { step.value = index + 1 }, delay))
onUnmounted(() => timers.forEach(clearTimeout))
const headline = computed(() => [
  `正在请${props.name}过来…`,
  '搬个椅子…',
  'TA 正在入座…',
  '等 TA 坐稳…',
][step.value])
</script>

<template>
  <section class="voice-connection-notice" role="status" aria-live="polite" aria-label="语音连接提示" :data-step="step">
    <div class="voice-connection-notice__copy" :key="step">
      <strong><CharacterNameText v-if="step === 0" :text="headline" :characters="[{ name, accent }]" /><template v-else>{{ headline }}</template></strong>
    </div>
    <footer><span>等 TA 坐定，再开口哦</span><UiButton variant="secondary" aria-label="取消连接" @click="emit('cancel')">取消</UiButton></footer>
  </section>
</template>

<style scoped>
.voice-connection-notice { position: fixed; z-index: 6; top: 55dvh; left: 50%; transform: translate(-50%, -50%); width: min(380px, calc(100% - 32px)); padding: 18px 22px 14px; border: 2px solid var(--lie-ink); border-radius: 24px; background: #fffef7; color: var(--lie-ink); box-shadow: 0 5px 0 #111b4520; text-align: center; }
.voice-connection-notice__copy { animation: copy-arrive .2s ease-out; min-height: 40px; display: grid; align-items: center; }
.voice-connection-notice__copy strong { display: block; font-size: 22px; line-height: 1.5; font-weight: 800; overflow-wrap: anywhere; }
footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px; border-top: 1px solid #111b451a; padding-top: 10px; }footer > span { text-align: left; font-size: 14px; color: #52607a; }
footer :deep(button) { min-height: 44px; padding: 8px 16px; border-width: 1.5px; border-radius: 13px; font-size: 14px; box-shadow: none; }
@keyframes copy-arrive { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
@media(max-width: 420px) { .voice-connection-notice { padding: 14px 18px 12px; }.voice-connection-notice__copy strong { font-size: 20px; } }
@media(prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
