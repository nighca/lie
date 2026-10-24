<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
onMounted(() => dialog.value!.showModal())
onBeforeUnmount(() => dialog.value!.close())
</script>

<template>
  <dialog ref="dialog" class="editor-dialog" :aria-label="title" @cancel.prevent="emit('close')">
    <header><h2>{{ title }}</h2><button type="button" class="close" aria-label="关闭" @click="emit('close')"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg></button></header>
    <slot />
  </dialog>
</template>

<style scoped>
.editor-dialog { width: min(680px, calc(100vw - 32px)); max-height: calc(100dvh - 40px); padding: 26px; border: 2px solid var(--lie-ink); border-radius: 24px; color: var(--lie-ink); background: var(--lie-surface); overflow-y: auto; }
.editor-dialog::backdrop { background: #111b4573; }
header { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 20px; }
h2 { margin: 0; font-size: 23px; line-height: 1.4; }
.close { display: inline-grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 10px; background: #edf0f5; line-height: 1; color: inherit; cursor: pointer; }
.close svg { display: block; }
.close:focus-visible { outline: 3px solid var(--lie-primary); outline-offset: 3px; }
@media (max-width: 670px) { .editor-dialog { padding: 20px; } h2 { font-size: 21px; } }
</style>
