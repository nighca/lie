<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { createCanvasRenderer, loadAnimationPackage, sampleClip } from '../../packages/character-animation/src/index'
import type { ResultAnimationState } from '../../packages/character-animation/src/types'
import AnimatedPortrait from '../../packages/ui/src/components/AnimatedPortrait.vue'
import characters from './characters.json'

const selectedId = ref(characters[0].id)
const selected = computed(() => characters.find(character => character.id === selectedId.value)!)
const src = computed(() => `/design/result-reactions/${selected.value.id}/package.json`)
const exportError = ref(false)
const version = ref(0)
const staticOnly = ref(false)
const terminalCheck = ref('')
function checkTerminals() {
  terminalCheck.value = panels.every(panel => {
    const canvas = document.querySelector<HTMLCanvasElement>(`.${panel.file} canvas`)
    return canvas != null && canvas.toDataURL('image/png') === exports.value[panel.file]
  }) ? '通过：两种播放末帧与静态图像素一致' : '尚未停在末帧，请在重播结束后检查'
}
const exports = ref<Record<string, string>>({})
const panels: { state: ResultAnimationState; title: string; symbol: string; file: string }[] = [
  { state: 'accusedCorrectly', title: '指认正确', symbol: '✓', file: 'accused-correctly' },
  { state: 'accusedWrongly', title: '指认错误', symbol: '×', file: 'accused-wrongly' },
]
watch(src, async (url, _, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  exports.value = {}
  terminalCheck.value = ''
  exportError.value = false
  try {
    const loaded = await loadAnimationPackage(new URL(url, location.href), controller.signal)
    for (const panel of panels) {
      const canvas = document.createElement('canvas')
      const renderer = createCanvasRenderer(canvas, loaded.data, loaded.images)
      const clip = loaded.data.clips[loaded.data.states[panel.state]!]
      renderer.render(sampleClip(loaded.data, clip, clip.duration))
      exports.value[panel.file] = canvas.toDataURL('image/png')
      renderer.dispose()
    }
    loaded.images.clear()
  } catch {
    if (!controller.signal.aborted) exportError.value = true
  }
}, { immediate: true })
</script>

<template>
  <main>
    <h1>人物结果反应 · 统一检查</h1>
    <p>选择人物，对比两种结果反应。各播放一次后停住，也可切换静态终态。</p>
    <nav class="characters" aria-label="人物"><button v-for="character in characters" :key="character.id" :aria-pressed="selectedId === character.id" @click="selectedId = character.id">{{ character.name }}</button></nav>
    <h2 class="selected-name">{{ selected.name }}</h2>
    <nav><button @click="version++">重播样片</button><label><input v-model="staticOnly" type="checkbox">只看静态终态</label></nav>
    <div class="panels">
      <section v-for="panel in panels" :key="panel.state" :class="panel.file">
        <h2><span aria-hidden="true">{{ panel.symbol }}</span>{{ panel.title }}</h2>
        <div class="stage">
          <AnimatedPortrait :key="`${selectedId}-${panel.state}-${version}`" :src="staticOnly ? null : src" :state="panel.state" fit="contain" :label="`${selected.name} · ${panel.title}`">
            <img :src="`/design/result-reactions/${selectedId}/${panel.file}.png`" :alt="`${selected.name} · ${panel.title}终态`">
          </AnimatedPortrait>
        </div>
        <p>{{ panel.state === 'accusedCorrectly' ? '被看穿后的无奈。' : '被错指后的疑问。' }}</p>
        <a v-if="exports[panel.file]" :href="exports[panel.file]" :download="`${selectedId}-${panel.file}.png`">下载{{ panel.title }}终态图</a>
      </section>
    </div>
    <p v-if="exportError" role="status">终态导出未完成，可以重新选择人物后检查。</p>
    <details><summary>制作检查</summary><button @click="checkTerminals">检查终态一致</button><output>{{ terminalCheck }}</output></details>
  </main>
</template>

<style>
* { box-sizing: border-box; }
body { margin: 0; background: #fff38b; color: #101936; font: 16px/1.55 system-ui, sans-serif; }
main { max-width: 1120px; padding: 24px; margin: auto; }
h1 { font-size: 30px; margin: 0 0 8px; } h2 { margin: 0; padding: 12px 22px; border-bottom: 3px solid #101936; font-size: 26px; }
h2 span { display: inline-block; font-size: 42px; margin-right: 15px; line-height: 1; vertical-align: -3px; }
nav { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin: 20px 0; }
.characters { gap: 10px; } .characters button[aria-pressed="true"] { background: #1656ff; color: white; }
.selected-name { padding: 0; border: none; font-size: 22px; }
button { border: 2px solid #101936; border-radius: 14px; padding: 10px 20px; background: #fffdf4; color: inherit; font: inherit; font-weight: 700; cursor: pointer; }
input { accent-color: #1656ff; }
.panels { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
section { background: #fffdf4; border: 3px solid #101936; border-radius: 24px; overflow: hidden; }
.accused-correctly h2 { background: #a3e9d1; } .accused-wrongly h2 { background: #ff9c8c; }
.stage { height: 470px; position: relative; }
.stage img { width: 100%; height: 100%; object-fit: contain; object-position: center bottom; }
details { margin-top: 20px; } output { display: block; }
section p, section a { margin: 8px 20px 16px; } section a { display: block; color: #1747b5; }
@media (max-width: 650px) { main { padding: 16px; } h1 { font-size: 24px; } .panels { grid-template-columns: 1fr; } .stage { height: 390px; } }
</style>
