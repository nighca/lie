<script setup lang="ts">
import { ref, useId, watch } from 'vue'

import UiButton from './UiButton.vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const titleId = useId()

watch([() => props.open, dialog], () => {
  if (dialog.value == null) return
  if (props.open && !dialog.value.open) dialog.value.showModal()
  if (!props.open && dialog.value.open) dialog.value.close()
}, { flush: 'post' })
</script>

<template>
  <dialog ref="dialog" class="lie-dialog" :aria-labelledby="titleId" @cancel.prevent="emit('close')">
    <header class="lie-dialog__header"><h2 :id="titleId">{{ title }}</h2><UiButton variant="quiet" aria-label="关闭弹窗" @click="emit('close')">关闭</UiButton></header>
    <div class="lie-dialog__body"><slot /></div>
    <footer v-if="$slots.actions" class="lie-dialog__actions"><slot name="actions" /></footer>
  </dialog>
</template>

<style scoped>
.lie-dialog { width: min(880px, calc(100% - 40px)); padding: 32px 36px; box-shadow: 0 8px 0 #111b4526; }
.lie-dialog__header { position: relative; justify-content: center; min-height: 48px; padding: 0 64px; text-align: center; }
.lie-dialog__header h2 { font-size: 36px; font-weight: 800; }
.lie-dialog__header :deep(.lie-button) { position: absolute; right: 0; top: 0; padding: 8px 12px; font-size: 14px; }
.lie-dialog__body { margin-top: 16px; }
.lie-dialog__actions { justify-content: center; margin-top: 28px; }
.lie-dialog__actions :deep(.lie-button) { min-width: 240px; }
@media (max-width: 700px) {
  .lie-dialog { padding: 24px 16px; }
  .lie-dialog__header { padding-inline: 48px; }
  .lie-dialog__header h2 { font-size: 28px; }
  .lie-dialog__actions :deep(.lie-button) { min-width: 180px; }
}
</style>
