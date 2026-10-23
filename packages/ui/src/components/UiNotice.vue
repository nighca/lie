<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'info' | 'error' }>(), { tone: 'info' })
</script>

<template><div class="lie-notice" :data-tone="tone" role="status"><strong>{{ tone === 'error' ? '请留意' : '提示' }}</strong><div><slot /></div></div></template>
