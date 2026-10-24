<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { AnimationTimeline, createCanvasRenderer, loadAnimationPackage } from '@lie/appearance-animation'
import type { AnimationState } from '@lie/appearance-animation'

const props = withDefaults(defineProps<{ src: string | null; state: AnimationState; label?: string }>(), { label: '人物形象' })
const canvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
const reduced = ref(false)
let timeline: AnimationTimeline | null = null
let media: MediaQueryList | null = null
const motionChanged = () => { reduced.value = media?.matches ?? false }

onMounted(() => {
  media = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionChanged()
  media.addEventListener('change', motionChanged)
})
onUnmounted(() => { media?.removeEventListener('change', motionChanged) })

watch(() => props.state, state => { timeline?.setState(state) })
watch([() => props.src, reduced, canvas], async ([src, motion, element], _, onCleanup) => {
  ready.value = false
  timeline = null
  if (src == null || motion || element == null) return
  const controller = new AbortController()
  let active = true, frame: number | null = null, last: number | null = null
  let renderer: ReturnType<typeof createCanvasRenderer> | null = null
  let images: Map<string, HTMLImageElement> | null = null
  const stop = () => { if (frame != null) cancelAnimationFrame(frame); frame = null; last = null }
  const fail = () => { stop(); controller.abort(); ready.value = false; renderer?.dispose(); renderer = null; images?.clear(); timeline = null }
  const draw = (now: number) => {
    frame = null
    if (!active || document.hidden || timeline == null || renderer == null) return
    const delta = last == null ? 0 : Math.min((now - last) / 1000, .1)
    last = now
    try { renderer.render(timeline.advance(delta)) }
    catch { fail(); return }
    frame = requestAnimationFrame(draw)
  }
  const visibilityChanged = () => { stop(); if (!document.hidden && ready.value) frame = requestAnimationFrame(draw) }
  document.addEventListener('visibilitychange', visibilityChanged)
  onCleanup(() => { active = false; stop(); controller.abort(); document.removeEventListener('visibilitychange', visibilityChanged); renderer?.dispose(); images?.clear(); timeline = null })
  try {
    const url = new URL(src, window.location.href)
    if (url.origin !== window.location.origin) throw Error('Animation must use local appearance assets')
    const loaded = await loadAnimationPackage(url, controller.signal)
    if (!active) return
    images = loaded.images
    renderer = createCanvasRenderer(element, loaded.data, images)
    timeline = new AnimationTimeline(loaded.data, props.state)
    renderer.render(timeline.advance(0))
    ready.value = true
    if (!document.hidden) frame = requestAnimationFrame(draw)
  } catch { if (active) fail() }
}, { immediate: true, flush: 'post' })
</script>

<template>
  <div class="animated-portrait">
    <canvas ref="canvas" v-show="ready" role="img" :aria-label="label"></canvas>
    <slot v-if="!ready"></slot>
  </div>
</template>

<style scoped>
.animated-portrait { display: contents; }
canvas { position: absolute; height: 130%; width: 100%; max-width: none; object-fit: contain; object-position: 50% 0; left: 50%; top: 0; transform: translateX(-50%); }
</style>
