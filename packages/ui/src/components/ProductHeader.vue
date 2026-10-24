<script setup lang="ts">
withDefaults(defineProps<{ title?: string | null }>(), { title: null })
const logoUrl = '/brand/logo.svg'
const emit = defineEmits<{ navigateHome: [] }>()
</script>

<template>
  <header class="lie-product-header">
    <a class="lie-product-header__brand" href="/" aria-label="LIE 首页" @click.prevent="emit('navigateHome')"><img :src="logoUrl" width="105" height="56" alt=""><span class="lie-handwritten-underline">语音推理</span></a>
    <div v-if="$slots.title || title != null" class="lie-product-header__title"><slot name="title"><h1>{{ title }}</h1></slot></div>
    <div v-if="$slots.actions" class="lie-product-header__actions"><slot name="actions" /></div>
    <div v-if="$slots.notice" class="lie-product-header__notice"><slot name="notice" /></div>
  </header>
</template>

<style scoped>
.lie-product-header { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 64px; }
.lie-product-header__brand { display: inline-flex; align-items: center; gap: 16px; color: var(--lie-ink); text-decoration: none; line-height: 1; flex-shrink: 0; }
.lie-product-header__brand:focus-visible { outline: 3px solid var(--lie-ink); outline-offset: 5px; border-radius: 4px; }
.lie-product-header__brand img { display: block; width: 105px; height: 56px; object-fit: contain; }
.lie-product-header__brand span { font-size: 18px; font-weight: 800; letter-spacing: .025em; white-space: nowrap; }
.lie-product-header__title { font-size: clamp(24px, 2.35vw, 34px); text-align: center; margin: 0; min-width: 0; }
.lie-product-header__title h1 { font: inherit; margin: 0; }
.lie-product-header__actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.lie-product-header__notice { position: absolute; left: 0; bottom: -18px; color: var(--lie-muted); font-size: 11px; line-height: 16px; }
.lie-product-header__notice :slotted(p) { margin: 0; }
@media (max-width: 1000px) {
  .lie-product-header { flex-wrap: wrap; }
  .lie-product-header__title { order: 3; width: 100%; text-align: left; }
}
@media (max-width: 700px) {
  .lie-product-header { gap: 12px; }
  .lie-product-header__brand { gap: 8px; }
  .lie-product-header__brand img { width: 88px; height: 47px; }
  .lie-product-header__brand span { font-size: 14px; }
  .lie-product-header__title { font-size: 24px; }
  .lie-product-header__actions :deep(.lie-button) { min-height: 40px; border-width: 2px; border-radius: 12px; padding: 6px 8px; font-size: 14px; }
}
</style>
