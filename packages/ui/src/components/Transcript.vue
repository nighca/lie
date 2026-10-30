<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

import { createTranscriptReveal } from '../presentation/transcriptReveal'
import type { RevealRow } from '../presentation/transcriptReveal'

export interface TranscriptMessage {
  id: string
  speaker: string
  text: string
  mine?: boolean
  avatar?: string | null
  interrupted?: boolean
  pending?: boolean
}

const brokenAvatars = ref(new Set<string>())
const log = ref<HTMLElement | null>(null)

const props = withDefaults(defineProps<{
  messages: readonly TranscriptMessage[]
  animate?: boolean
  emptyText?: string
}>(), { animate: false, emptyText: '还没有对话，开口打个招呼吧。' })

defineSlots<{ text?: (props: { text: string }) => unknown }>()

function followLatest() {
  if (log.value != null) log.value.scrollTop = log.value.scrollHeight
}

const display = shallowRef<RevealRow<TranscriptMessage>[]>([])
const motion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
const reduced = ref(motion?.matches ?? false)
const reveal = createTranscriptReveal<TranscriptMessage>((rows) => { display.value = rows })
function motionChanged() { reduced.value = motion?.matches ?? false }
motion?.addEventListener('change', motionChanged)
watch(() => [props.messages, props.animate, reduced.value], () => reveal.update(props.messages, props.animate && !reduced.value), { deep: true, immediate: true })
watch(display, followLatest, { flush: 'post' })
onUnmounted(() => { reveal.dispose(); motion?.removeEventListener('change', motionChanged) })
onMounted(followLatest)
</script>

<template>
  <section class="lie-transcript" aria-label="对话转写">
    <div ref="log" class="lie-transcript__log" role="log" aria-label="语音转写" aria-live="polite" aria-relevant="additions text">
      <p v-if="messages.length === 0" class="lie-transcript__empty">{{ emptyText }}</p>
      <article v-for="{ key, message, text } in display" :key="key" class="lie-transcript__message" :class="{ 'lie-transcript__message--mine': message.mine }">
        <span class="lie-transcript__avatar" :class="{ 'lie-transcript__avatar--detective': message.mine && (message.avatar == null || brokenAvatars.has(message.avatar)) }" aria-hidden="true">
          <img v-if="message.avatar != null && !brokenAvatars.has(message.avatar)" :src="message.avatar" alt="" @error="brokenAvatars.add(message.avatar)">
          <svg v-else-if="message.mine" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="30" fill="#EAF2FF" stroke="#111B45" stroke-width="3"/><path d="M13 59Q16 47 27 46H37Q48 47 51 59" fill="#075BFA" stroke="#111B45" stroke-width="3" stroke-linejoin="round"/><path d="M26 46L32 52L38 46" fill="#FFFEF7" stroke="#111B45" stroke-width="2.5"/><path d="M18 25Q18 13 32 13Q46 13 46 25V33Q45 47 32 48Q19 47 18 33Z" fill="#FFFEF7" stroke="#111B45" stroke-width="3"/><path d="M15 25L20 12Q22 8 27 12L32 15L38 11Q42 8 45 13L49 25Z" fill="#075BFA" stroke="#111B45" stroke-width="3" stroke-linejoin="round"/><path d="M16 23Q32 20 48 23L49 26H15Z" fill="#FF665B"/><path d="M12 26Q32 22 52 26Q49 31 32 30Q15 31 12 26Z" fill="#075BFA" stroke="#111B45" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="35" r="1.7" fill="#111B45"/><circle cx="38" cy="35" r="1.7" fill="#111B45"/><path d="M27 41Q32 45 37 41" fill="none" stroke="#111B45" stroke-width="2.5" stroke-linecap="round"/></svg>
          <span v-else>{{ message.speaker.slice(0, 1) }}</span>
        </span>
        <div class="lie-transcript__bubble"><strong>{{ message.speaker }}</strong><p :aria-live="text !== message.text ? 'off' : 'polite'"><slot name="text" :text="text">{{ text }}</slot></p><span v-if="message.interrupted" class="lie-transcript__interrupted">回答被打断</span></div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.lie-transcript { display: flex; border: 0; border-radius: 0; background: transparent; }
.lie-transcript__log { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; max-height: var(--lie-transcript-max-height, 420px); overflow-y: auto; padding: 0 6px 4px 0; scrollbar-gutter: stable; }
.lie-transcript__empty { margin: 0; color: var(--lie-muted); line-height: 1.8; }
.lie-transcript__message { position: relative; display: flex; flex-shrink: 0; align-self: flex-start; width: fit-content; max-width: calc(100% - 40px); margin: 0 0 14px 40px; padding: 0; border: 0; border-radius: 0; background: transparent; }
.lie-transcript__avatar { position: absolute; left: -40px; top: 7px; width: 30px; height: 30px; border: 2px solid var(--lie-ink); border-radius: 50%; overflow: hidden; background: var(--lie-aqua); display: grid; place-items: center; font-size: 14px; font-weight: 800; }
.lie-transcript__avatar img { position: absolute; width: 210%; max-width: none; height: auto; left: 50%; top: -3%; transform: translateX(-50%); }
.lie-transcript__avatar--detective { border: 0; background: transparent; }
.lie-transcript__avatar--detective svg { width: 30px; height: 30px; }
.lie-transcript__bubble { min-width: 0; padding: 12px 16px; border-radius: 18px 18px 18px 5px; background: #fff5d8; }
.lie-transcript__message--mine { align-self: flex-end; margin-left: 0; margin-right: 40px; }
.lie-transcript__message--mine .lie-transcript__avatar { left: auto; right: -40px; color: var(--lie-primary); background: var(--lie-soft-blue); }
.lie-transcript__message--mine .lie-transcript__bubble { background: var(--lie-soft-blue); border-radius: 18px 18px 5px 18px; overflow-wrap: anywhere; }
.lie-transcript__message--mine .lie-transcript__bubble strong { display: block; text-align: right; }
.lie-transcript__bubble strong { font-size: 12px; color: var(--lie-muted); }
.lie-transcript__bubble p { font-size: 16px; line-height: 1.7; font-weight: 600; margin-top: 4px; }
.lie-transcript__interrupted { display: inline-block; margin-top: 4px; font-size: 12px; color: var(--lie-muted); }
</style>
