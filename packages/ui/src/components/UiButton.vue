<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'quiet'
  disabled?: boolean
  busy?: boolean
}>(), { variant: 'primary', disabled: false, busy: false })
</script>

<template>
  <button class="lie-button" :class="`lie-button--${variant}`" type="button" :disabled="disabled || busy" :aria-busy="busy"><span v-if="busy" aria-hidden="true">… </span><slot /></button>
</template>
