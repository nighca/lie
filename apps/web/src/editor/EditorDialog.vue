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
    <header><h2>{{ title }}</h2><button type="button" class="close" aria-label="关闭" @click="emit('close')">×</button></header>
    <slot />
  </dialog>
</template>

<style scoped>
.editor-dialog { width: min(680px, calc(100vw - 32px)); max-height: calc(100dvh - 40px); padding: 26px; border: 2px solid var(--lie-ink); border-radius: 24px; color: var(--lie-ink); background: var(--lie-surface); overflow-y: auto; }
.editor-dialog::backdrop { background: #111b4573; }
header { display: flex; justify-content: space-between; align-items: start; gap: 20px; margin-bottom: 20px; }
h2 { margin: 0; font-size: 23px; }
.close { flex-shrink: 0; border: 0; border-radius: 10px; background: #edf0f5; width: 34px; height: 34px; font: inherit; font-size: 25px; color: inherit; cursor: pointer; }
@media (max-width: 670px) { .editor-dialog { padding: 20px; } h2 { font-size: 21px; } }
</style>
