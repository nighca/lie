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
    <span v-if="selected" class="lie-character__selected" >当前人物</span>
  </button>
</template>
