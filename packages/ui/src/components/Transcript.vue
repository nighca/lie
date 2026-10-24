<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

export interface TranscriptMessage {
  id: string
  speaker: string
  text: string
  mine?: boolean
  avatar?: string | null
  interrupted?: boolean
}

const brokenAvatars = ref(new Set<string>())
const log = ref<HTMLElement | null>(null)

const props = withDefaults(defineProps<{
  messages: readonly TranscriptMessage[]
  emptyText?: string
}>(), { emptyText: '还没有对话，开口打个招呼吧。' })

function followLatest() {
  if (log.value != null) log.value.scrollTop = log.value.scrollHeight
}

watch(() => props.messages, followLatest, { deep: true, flush: 'post' })
onMounted(followLatest)
</script>

<template>
  <section class="lie-transcript" aria-label="对话转写">
    <div ref="log" class="lie-transcript__log" role="log" aria-label="语音转写" aria-live="polite" aria-relevant="additions text">
      <p v-if="messages.length === 0" class="lie-transcript__empty">{{ emptyText }}</p>
      <article v-for="message in messages" :key="message.id" class="lie-transcript__message" :class="{ 'lie-transcript__message--mine': message.mine }">
        <span class="lie-transcript__avatar" aria-hidden="true">
          <img v-if="message.avatar != null && !brokenAvatars.has(message.avatar)" :src="message.avatar" alt="" @error="brokenAvatars.add(message.avatar)">
          <svg v-else-if="message.mine" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" fill="var(--lie-surface)" stroke="currentColor" stroke-width="2.5"/><circle cx="15" cy="18" r="1.7" fill="currentColor"/><circle cx="25" cy="18" r="1.7" fill="currentColor"/><path d="M15 24Q20 29 25 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
          <span v-else>{{ message.speaker.slice(0, 1) }}</span>
        </span>
        <div class="lie-transcript__bubble"><strong>{{ message.speaker }}</strong><p>{{ message.text }}</p><span v-if="message.interrupted" class="lie-transcript__interrupted">回答被打断</span></div>
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
.lie-transcript__avatar svg { width: 23px; height: 23px; }
.lie-transcript__bubble { min-width: 0; padding: 12px 16px; border-radius: 18px 18px 18px 5px; background: #fff5d8; }
.lie-transcript__message--mine { align-self: flex-end; }
.lie-transcript__message--mine .lie-transcript__avatar { color: var(--lie-primary); background: var(--lie-soft-blue); }
.lie-transcript__message--mine .lie-transcript__bubble { background: var(--lie-soft-blue); border-radius: 18px 18px 5px 18px; }
.lie-transcript__bubble strong { font-size: 12px; color: var(--lie-muted); }
.lie-transcript__bubble p { font-size: 16px; line-height: 1.7; font-weight: 600; margin-top: 4px; }
.lie-transcript__interrupted { display: inline-block; margin-top: 4px; font-size: 12px; color: var(--lie-muted); }
</style>
