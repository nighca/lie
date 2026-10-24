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
  </button>
</template>

<style scoped>
.lie-character { display: flex; flex-direction: column; gap: 0; align-items: stretch; padding: 0; width: 100px; min-height: 0; overflow: hidden; border: 2px solid #111b452a; border-radius: 20px; text-align: center; background: var(--lie-surface); }
.lie-character[aria-pressed='true'] { border-width: 2px; padding: 0; border-color: var(--lie-primary); background: var(--lie-primary); color: white; }
.lie-character__avatar { position: relative; display: grid; flex: none; width: 100%; height: 86px; border-radius: 0; overflow: hidden; background: color-mix(in srgb, var(--character-accent, var(--lie-aqua)) 18%, var(--lie-surface)); }
.lie-character__avatar :deep(img) { position: absolute; width: 200%; height: auto; max-width: none; left: 50%; top: -3%; transform: translateX(-50%); }
.lie-character__copy { padding: 4px 5px; }
.lie-character__copy strong { font-size: 14px; line-height: 24px; font-weight: 800; }
.lie-character[aria-pressed='true'] .lie-character__copy > span { color: white; }
.lie-character:disabled .lie-character__copy { color: var(--lie-disabled-text); background: var(--lie-disabled); }
@media (max-width: 700px) {
  .lie-character__avatar { height: 64px; }
  .lie-character__copy { padding: 3px 6px; }
  .lie-character__copy strong { font-size: 14px; }
}
</style>
