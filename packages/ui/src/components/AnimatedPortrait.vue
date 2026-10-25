<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { AnimationTimeline, createCanvasRenderer, loadAnimationPackage, resultAnimationStates } from '@lie/character-animation'
import type { AnimationState } from '@lie/character-animation'

const props = withDefaults(defineProps<{ src: string | null; state: AnimationState; label?: string; fit?: 'crop' | 'contain' }>(), { label: '人物形象', fit: 'crop' })
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
const failed = ref(false)
const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
const reduced = ref(media?.matches ?? true)
const resultState = computed(() => resultAnimationStates.find(state => state === props.state) ?? null)
const fallback = computed(() => props.src == null || reduced.value || failed.value || (resultState.value != null && !ready.value))
let resultConsumed = false
watch(resultState, () => { resultConsumed = false }, { flush: 'sync' })
let timeline: AnimationTimeline | null = null
const motionChanged = () => { reduced.value = media?.matches ?? false }

onMounted(() => {
  media?.addEventListener('change', motionChanged)
})
onUnmounted(() => { media?.removeEventListener('change', motionChanged) })

watch([() => props.src, reduced, canvas, resultState], async ([src, motion, element, result], _, onCleanup) => {
  ready.value = false
  failed.value = false
  timeline = null
  if (result != null && motion) resultConsumed = true
  if (src == null || motion || element == null || (result != null && resultConsumed)) return
  const controller = new AbortController()
  let active = true, frame: number | null = null, last: number | null = null
  let renderer: ReturnType<typeof createCanvasRenderer> | null = null
  let images: Map<string, HTMLImageElement> | null = null
  const stop = () => { if (frame != null) cancelAnimationFrame(frame); frame = null; last = null }
  const fail = () => { stop(); controller.abort(); ready.value = false; failed.value = true; renderer?.dispose(); renderer = null; images?.clear(); timeline = null }
  const draw = (now: number) => {
    frame = null
    if (!active || document.hidden || timeline == null || renderer == null) return
    const delta = last == null ? 0 : Math.min((now - last) / 1000, .1)
    last = now
    try { renderer.render(timeline.advance(delta)) }
    catch { fail(); return }
    if (!timeline.finished) frame = requestAnimationFrame(draw)
  }
  const visibilityChanged = () => { stop(); if (!document.hidden && ready.value && !timeline?.finished) frame = requestAnimationFrame(draw) }
  const stopStateWatch = watch(() => props.state, state => {
    if (resultState.value != null) return
    timeline?.setState(state)
    if (active && ready.value && !document.hidden && frame == null && !timeline?.finished) frame = requestAnimationFrame(draw)
  }, { flush: 'sync' })
  document.addEventListener('visibilitychange', visibilityChanged)
  onCleanup(() => { active = false; stopStateWatch(); stop(); controller.abort(); document.removeEventListener('visibilitychange', visibilityChanged); renderer?.dispose(); images?.clear(); timeline = null })
  try {
    const url = new URL(src, window.location.href)
    if (url.origin !== window.location.origin) throw Error('Animation must use local characterPreset assets')
    const loaded = await loadAnimationPackage(url, controller.signal)
    if (!active) return
    images = loaded.images
    if (result != null && !Object.hasOwn(loaded.data.states, result)) { images.clear(); failed.value = true; return }
    renderer = createCanvasRenderer(element, loaded.data, images)
    timeline = new AnimationTimeline(loaded.data, props.state)
    renderer.render(timeline.advance(0))
    ready.value = true
    if (result != null) resultConsumed = true
    if (!document.hidden) frame = requestAnimationFrame(draw)
  } catch { if (active) fail() }
}, { immediate: true, flush: 'sync' })
</script>

<template>
  <div class="animated-portrait" :class="{ 'animated-portrait--contain': fit === 'contain' }">
    <canvas ref="canvas" v-show="ready" role="img" :aria-label="label"></canvas>
    <slot v-if="fallback"></slot>
    <slot v-else-if="!ready" name="loading"></slot>
  </div>
</template>

<style scoped>
.animated-portrait { display: contents; }
canvas { position: absolute; height: 130%; width: 100%; max-width: none; object-fit: contain; object-position: 50% 0; left: 50%; top: 0; transform: translateX(-50%); }
.animated-portrait--contain canvas { height: 100%; left: 0; transform: none; object-position: center bottom; }
</style>
