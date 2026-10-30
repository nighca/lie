<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import App from '../../../apps/web/src/App.vue'
import { createGameController } from '../../../apps/web/src/application/controller'
import { officialCases } from '../../../apps/web/src/application/bundledCases'
import { createCharacterPresetLoader } from '../../../apps/web/src/presentation/characterPresetLoader'

const embedded = new URLSearchParams(location.search).has('frame')
const selectedCase = ref(0)
const correct = ref(true)
const revision = ref(0)
const presets = createCharacterPresetLoader()
void presets.load()
const controller = createGameController({
  readGame: async () => officialCases[selectedCase.value].game,
  voice: { create() { throw new Error('此结果页夹具不允许开启语音') } },
  now: Date.now,
  newSessionId: () => crypto.randomUUID(),
})
onUnmounted(() => { controller.dispose(); presets.cancel() })
async function showResult() {
  const game = officialCases[selectedCase.value].game
  await controller.load(game.id)
  controller.start()
  controller.openAccusation()
  controller.accuse(correct.value ? game.ending.culpritId : game.characters.find((person) => person.id !== game.ending.culpritId)!.id)
  revision.value++
}
const frameUrl = computed(() => `?frame=1&case=${selectedCase.value}&correct=${correct.value}&replay=${revision.value}`)
if (embedded) {
  const params = new URLSearchParams(location.search)
  selectedCase.value = Number(params.get('case') ?? 0)
  correct.value = params.get('correct') !== 'false'
}
void showResult()
const feedback = ref('')
</script>
<template>
  <template v-if="!embedded">
    <nav class="preview-controls" aria-label="结果页预览设置">
      <strong>当前真实界面 · 离线结果预览</strong>
      <label>案件 <select v-model="selectedCase" @change="showResult"><option v-for="(entry, index) in officialCases" :value="index">{{ entry.game.title }}</option></select></label>
      <label>结果 <select v-model="correct" @change="showResult"><option :value="true">成功</option><option :value="false">失败 / 错误指认</option></select></label>
      <button @click="showResult">重播结果入场</button>
      <p>无麦克风、无模型请求。重开与返回操作可点击；此处返回仅显示回执。</p>
      <p role="status">{{ feedback }}</p>
    </nav>
    <section class="preview-desktop"><h2>桌面 · 1280px</h2><iframe :src="frameUrl" title="桌面结果页" width="1280" height="1000"></iframe></section>
    <section class="preview-mobile"><h2>手机 · 391px</h2><iframe :src="frameUrl" title="手机结果页" width="391" height="1100"></iframe></section>
  </template>
  <App v-else :key="revision" :controller="controller" :character-presets="presets.state.presets" :demo="false" @navigate-home="feedback = '返回案件列表（预览回执）'" @remix="feedback = '进入改编（预览回执）'" />
  <p v-if="embedded && feedback" role="status" class="preview-feedback">{{ feedback }}</p>
</template>
<style>
.preview-controls { padding: 20px; background: white; border-bottom: 2px solid var(--lie-ink); display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
.preview-controls p { margin: 0; width: 100%; font-size: 14px; }
.preview-controls select, .preview-controls button { font: inherit; padding: 6px 10px; }
.preview-desktop, .preview-mobile { display: inline-block; vertical-align: top; padding: 12px; }
.preview-desktop h2, .preview-mobile h2 { font-size: 16px; }
iframe { box-sizing: content-box; display: block; border: 1px solid #111b4540; background: var(--lie-canvas); }
.preview-feedback { padding: 12px; text-align: center; }
</style>
