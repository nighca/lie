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
