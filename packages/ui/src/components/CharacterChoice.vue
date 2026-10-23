<script setup lang="ts">
withDefaults(defineProps<{
  name: string
  description?: string | null
  selected?: boolean
  disabled?: boolean
}>(), { description: null, selected: false, disabled: false })
</script>

<template>
  <button class="lie-character" type="button" :aria-pressed="selected" :disabled="disabled">
    <span class="lie-character__avatar" aria-hidden="true"><slot name="avatar">{{ name.slice(0, 1) }}</slot></span>
    <span class="lie-character__copy"><strong>{{ name }}</strong><span v-if="description != null">{{ description }}</span></span>
    <span v-if="selected" class="lie-character__selected">当前人物</span>
  </button>
</template>

<style scoped>
.lie-character { display: flex; flex-direction: column; gap: 0; align-items: stretch; padding: 0; min-height: 0; overflow: hidden; border-radius: 20px; text-align: center; background: var(--lie-surface); }
.lie-character[aria-pressed='true'] { padding: 0; background: var(--lie-surface); }
.lie-character__avatar { position: relative; display: grid; flex: none; width: 100%; height: 106px; border-radius: 0; overflow: hidden; background: color-mix(in srgb, var(--character-accent, var(--lie-aqua)) 18%, var(--lie-surface)); }
.lie-character__avatar :deep(img) { position: absolute; width: 240%; height: auto; max-width: none; left: 50%; top: -3%; transform: translateX(-50%); }
.lie-character__copy { padding: 7px 8px 9px; border-top: 2px solid #111b4514; }
.lie-character__copy strong { font-size: 20px; font-weight: 800; }
.lie-character__selected { align-self: stretch; margin: 0; padding: 0 8px 8px; font-size: 12px; line-height: 1.4; }
.lie-character[aria-pressed='true'] .lie-character__copy { padding-bottom: 0; border-color: transparent; }
.lie-character[aria-pressed='true'] .lie-character__copy, .lie-character[aria-pressed='true'] .lie-character__selected { background: var(--lie-primary); color: white; }
.lie-character[aria-pressed='true'] .lie-character__copy > span { color: white; }
.lie-character:disabled .lie-character__copy, .lie-character:disabled .lie-character__selected { color: var(--lie-disabled-text); background: var(--lie-disabled); }
@media (max-width: 1100px) {
  .lie-character__avatar { height: 130px; }
  .lie-character__avatar :deep(img) { width: 200%; }
}
</style>
