<script setup lang="ts">
export interface TranscriptMessage {
  id: string
  speaker: string
  text: string
  mine?: boolean
}

withDefaults(defineProps<{
  messages: readonly TranscriptMessage[]
  emptyText?: string
}>(), { emptyText: '还没有对话，开口打个招呼吧。' })
</script>

<template>
  <details class="lie-transcript">
    <summary>查看对话转写 · 只读</summary>
    <div class="lie-transcript__log" role="log" aria-label="语音转写" aria-live="polite" aria-relevant="additions text">
      <p v-if="messages.length === 0" class="lie-transcript__empty">{{ emptyText }}</p>
      <article v-for="message in messages" :key="message.id" class="lie-transcript__message" :class="{ 'lie-transcript__message--mine': message.mine }">
        <strong>{{ message.speaker }}</strong><p>{{ message.text }}</p>
      </article>
    </div>
  </details>
</template>
