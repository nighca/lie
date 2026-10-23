<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

export interface TranscriptMessage {
  id: string
  speaker: string
  text: string
  mine?: boolean
  avatar?: string | null
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
          <svg v-else-if="message.mine" viewBox="0 0 40 40" fill="currentColor"><circle cx="20" cy="13" r="8"/><path d="M5 38v-4a15 15 0 0 1 30 0v4Z"/></svg>
          <span v-else>{{ message.speaker.slice(0, 1) }}</span>
        </span>
        <div class="lie-transcript__bubble"><strong>{{ message.speaker }}</strong><p>{{ message.text }}</p></div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.lie-transcript { border: 0; border-radius: 0; background: transparent; }
.lie-transcript__log { max-height: clamp(280px, calc(100vh - 450px), 380px); overflow-y: auto; padding: 0 6px 12px 0; scrollbar-gutter: stable; }
.lie-transcript__empty { margin: 0; padding: 24px; border: 3px solid var(--lie-ink); border-radius: 24px; background: var(--lie-surface); line-height: 1.8; }
.lie-transcript__message { display: flex; align-items: flex-start; gap: 12px; width: 100%; max-width: none; margin: 0 0 20px; padding: 0; border: 0; border-radius: 0; background: transparent; }
.lie-transcript__avatar { position: relative; flex-shrink: 0; width: 50px; height: 50px; border: 3px solid var(--lie-ink); border-radius: 50%; overflow: hidden; background: var(--lie-aqua); display: grid; place-items: center; font-size: 20px; font-weight: 800; }
.lie-transcript__avatar img { position: absolute; width: 240%; max-width: none; height: auto; left: 50%; top: -3%; transform: translateX(-50%); }
.lie-transcript__avatar svg { width: 33px; height: 33px; align-self: end; }
.lie-transcript__bubble { position: relative; min-width: 0; padding: 14px 18px; border: 3px solid var(--lie-ink); border-radius: 24px; background: var(--lie-surface); flex: 1; }
.lie-transcript__bubble::before { content: ''; position: absolute; width: 12px; height: 12px; top: 16px; left: -9px; transform: rotate(45deg); background: inherit; border-left: 3px solid var(--lie-ink); border-bottom: 3px solid var(--lie-ink); }
.lie-transcript__message--mine .lie-transcript__avatar { color: var(--lie-primary); background: var(--lie-soft-blue); }
.lie-transcript__bubble strong { font-size: 14px; color: var(--lie-muted); }
.lie-transcript__bubble p { font-weight: 600; margin-top: 4px; }
@media (max-width: 700px) { .lie-transcript__log { max-height: 380px; } }
</style>
