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
    <span class="lie-character__selected" :class="{ 'lie-character__selected--placeholder': !selected }" :aria-hidden="!selected">当前人物</span>
  </button>
</template>

<style scoped>
.lie-character { display: flex; flex-direction: column; gap: 0; align-items: stretch; padding: 0; min-height: 0; overflow: hidden; border: 3px solid #111b452a; border-radius: 20px; text-align: center; background: var(--lie-surface); }
.lie-character[aria-pressed='true'] { border-width: 3px; padding: 0; border-color: var(--lie-primary); background: var(--lie-primary); color: white; }
.lie-character__avatar { position: relative; display: grid; flex: none; width: 100%; height: 99px; border-radius: 0; overflow: hidden; background: color-mix(in srgb, var(--character-accent, var(--lie-aqua)) 18%, var(--lie-surface)); }
.lie-character__avatar :deep(img) { position: absolute; width: 200%; height: auto; max-width: none; left: 50%; top: -3%; transform: translateX(-50%); }
.lie-character__copy { padding: 6px 8px; }
.lie-character__copy strong { font-size: 16px; font-weight: 800; }
.lie-character__selected { align-self: stretch; margin: 0; padding: 0 6px 6px; font-size: 11px; line-height: 1.4; }
.lie-character__selected--placeholder { visibility: hidden; }
.lie-character[aria-pressed='true'] .lie-character__copy > span { color: white; }
.lie-character:disabled .lie-character__copy, .lie-character:disabled .lie-character__selected { color: var(--lie-disabled-text); background: var(--lie-disabled); }
@media (max-width: 700px) {
  .lie-character__avatar { height: 64px; }
  .lie-character__copy { padding: 3px 6px; }
  .lie-character__copy strong { font-size: 14px; }
  .lie-character__selected { padding-bottom: 3px; font-size: 10px; }
}
</style>
