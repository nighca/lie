<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

withDefaults(defineProps<{ title?: string | null }>(), { title: null })
const playing = ref(false)
let motionPreference: MediaQueryList | null = null
function play() { if (!playing.value) playing.value = true }
function stop() { playing.value = false }
function touch(event: PointerEvent) { if (event.pointerType === 'touch') play() }
function focus(event: FocusEvent) {
  const target = event.currentTarget
  if (target instanceof HTMLElement && target.matches(':focus-visible')) play()
}
onMounted(() => {
  if (typeof window.matchMedia !== 'function') return
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', stop)
})
onUnmounted(() => { stop(); motionPreference?.removeEventListener('change', stop) })
const emit = defineEmits<{ navigateHome: [] }>()
</script>

<template>
  <header class="lie-product-header">
    <a class="lie-product-header__brand" href="/" aria-label="LIE 首页" @mouseenter="play" @focus="focus" @pointerdown="touch" @pointerleave="stop" @pointercancel="stop" @blur="stop" @click.prevent="emit('navigateHome')"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 235" width="105" height="56" class="lie-product-header__logo" :class="{ 'lie-product-header__logo--playing': playing }" aria-hidden="true" focusable="false" @animationend="stop"><title>LIE</title><path fill="#111B45" d="M65 31C49 30 42 39 40 56L29 174C27 192 36 202 54 203L143 205C159 205 168 197 169 182C170 168 162 159 146 159L92 158C84 158 81 154 82 147L92 58C94 41 84 32 69 31Z"/><path fill="#075BFA" d="M216 89C201 89 194 97 193 110L185 184C183 198 190 206 203 206L218 206C230 205 237 198 238 185L245 111C247 96 239 89 225 89Z"/><circle fill="#FF665B" cx="221" cy="55" r="23"/><path fill="#111B45" d="M295 43L371 28C388 25 398 35 398 49C399 62 393 70 380 72L319 85C314 86 313 88 313 93L314 101C314 104 315 106 320 105L368 97C382 95 389 103 390 115C391 128 384 136 371 138L322 147C317 148 315 151 315 155L315 161C315 164 317 166 322 165L383 158C400 156 410 164 411 179C412 195 403 203 389 204L297 209C276 210 265 198 266 177L266 78C267 57 276 47 295 43Z"/></svg></a>
    <div v-if="$slots.title || title != null" class="lie-product-header__title"><slot name="title"><h1>{{ title }}</h1></slot></div>
    <div v-if="$slots.actions" class="lie-product-header__actions"><slot name="actions" /></div>
    <div v-if="$slots.notice" class="lie-product-header__notice"><slot name="notice" /></div>
  </header>
</template>

<style scoped>
.lie-product-header { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 64px; }
.lie-product-header__brand { position: relative; isolation: isolate; display: block; width: 136px; height: 64px; color: var(--lie-ink); text-decoration: none; line-height: 1; flex-shrink: 0; }
.lie-product-header__brand::after { content: ''; position: absolute; z-index: 0; left: 30.9%; top: 70.3%; width: 50%; height: 14.1%; background: url('/brand/underline.svg') center / 100% 100% no-repeat; transform: rotate(-8deg); pointer-events: none; }
.lie-product-header__brand:focus-visible { outline: 3px solid var(--lie-ink); outline-offset: 5px; border-radius: 4px; }
.lie-product-header__logo { position: relative; z-index: 1; display: block; width: 105px; height: 56px; overflow: hidden; }
.lie-product-header__logo--playing circle { animation: lie-logo-dot-jump 560ms ease-in-out; }
@keyframes lie-logo-dot-jump { 0%, 64.3%, 100% { transform: translateY(0); } 26.8% { transform: translateY(-12.57px); } }
@keyframes lie-logo-dot-rest { 0%, 99% { stroke: var(--lie-ink, #111b45); stroke-width: 4px; } 100% { stroke: none; } }
@media (prefers-reduced-motion: reduce) { .lie-product-header__logo--playing circle { animation-name: lie-logo-dot-rest; } }
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
  .lie-product-header__brand { width: 114px; height: 54px; }
  .lie-product-header__logo { width: 88px; height: 47px; }
  .lie-product-header__title { font-size: 24px; }
  .lie-product-header__actions :deep(.lie-button) { min-height: 40px; border-width: 2px; border-radius: 12px; padding: 6px 8px; font-size: 14px; }
}
</style>
