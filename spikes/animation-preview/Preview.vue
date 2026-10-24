<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AnimatedPortrait } from '@lie/ui'
import type { AnimationState } from '@lie/appearance-animation'
import { readAppearances } from '../../apps/web/src/presentation/appearances'
import type { Appearance } from '../../apps/web/src/presentation/appearances'
const query = new URLSearchParams(location.search)
const candidateAppearance = query.get('appearance') ?? 'coral-bob'
const candidateSource = query.get('src')
const candidateSources = new Map([...query.entries()].filter(([key]) => key.startsWith('src.')).map(([key, value]) => [key.slice(4), value]))
if (candidateSource != null) candidateSources.set(candidateAppearance, candidateSource)
const selected = ref(candidateAppearance), entries = ref<readonly Appearance[]>([])
const state = ref<AnimationState>('default')
const appearance = computed(() => entries.value.find(value => value.id === selected.value) ?? null)
const source = computed(() => candidateSources.get(selected.value) ?? appearance.value?.animation ?? null)
const animatedAppearances = computed(() => entries.value.filter(item => item.animation != null || candidateSources.has(item.id)))
const portrait = computed(() => state.value === 'default' ? appearance.value?.portrait : appearance.value?.portraits[state.value] ?? appearance.value?.portrait)
onMounted(async () => { entries.value = readAppearances(await (await fetch('/appearances/manifest.json')).json()) })
</script>
<template>
  <h1>人物动画制作验收</h1><p>正式组件与契约 · 本页无麦克风或语音连接，讲话嘴形为合成时序。</p>
  <nav class="characters" aria-label="动画人物"><button v-for="item in animatedAppearances" :key="item.id" :aria-pressed="selected === item.id" @click="selected = item.id">{{ item.name }}</button></nav>
  <nav><label>人物 <select v-model="selected"><option v-for="item in entries" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><button v-for="pose in (['default','listening','waiting','speaking'] as const)" :key="pose" :aria-pressed="state === pose" @click="state = pose">{{ pose }}</button></nav>
  <main><section><h2>静态参考</h2><div class="stage"><img :src="portrait" alt="原静态图"></div></section><section><h2>动画 / 失败与无动画时回静态</h2><div class="stage"><AnimatedPortrait :src="source" :state="state"><img :src="portrait" alt="静态回退"></AnimatedPortrait></div></section></main>
</template>
<style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#fff18a;color:#111b45;font:15px/1.6 system-ui}h1{margin:0}h2{font-size:18px}.characters{margin-bottom:12px}nav{display:flex;gap:10px;flex-wrap:wrap;align-items:center}button,select{border:2px solid #111b45;border-radius:10px;padding:8px 12px;background:#fffef7;color:#111b45}button[aria-pressed=true]{background:#075bfa;color:white}main{display:grid;grid-template-columns:1fr 1fr;gap:24px}.stage{position:relative;aspect-ratio:1;background:#fffef7;border:2px solid #111b45;border-radius:22px;overflow:hidden}.stage img{position:absolute;height:130%;width:100%;object-fit:contain;object-position:50% 0;left:50%;top:0;transform:translateX(-50%)}@media(max-width:620px){body{padding:16px}main{grid-template-columns:1fr}}
</style>
