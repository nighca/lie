<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'

import App from '../App.vue'
import { readBundledCase, officialCases } from '../application/bundledCases'
import { createGameController } from '../application/controller'
import { createCharacterPresetLoader } from '../presentation/characterPresetLoader'
import { createConnectionDemoVoice } from './voice'

const delay = ref(2500)
const controlsOpen = ref(false)
const gameId = officialCases[0].game.id
const presets = createCharacterPresetLoader()
const demoVoice = createConnectionDemoVoice(() => delay.value)
const controller = createGameController({ readGame: async () => readBundledCase(gameId), voice: demoVoice.voice, now: Date.now, newSessionId: () => crypto.randomUUID() })
const view = ref(controller.getView())
const unsubscribe = controller.subscribe(value => { view.value = value })
const status = computed(() => view.value.busy ? '候场中' : view.value.conversationActive ? '模拟接通（不会收音）' : view.value.voiceStatus === 'error' ? '模拟失败' : '已停止')
async function replay() {
  controller.endConversation()
  if (controller.getView().phase !== 'interrogating') { await controller.load(gameId); controller.start() }
  void controller.startConversation()
}
onUnmounted(() => { unsubscribe(); controller.dispose(); presets.cancel() })
void Promise.all([presets.load(), controller.load(gameId)]).then(() => { controller.start(); void controller.startConversation() })
</script>

<template>
  <div class="connection-demo">
    <App :controller="controller" :character-presets="presets.state.presets" :demo="true" :allow-remix="false" @navigate-home="controller.endConversation()" @request-end="controller.endConversation()" />
    <aside class="demo-tools" :class="{ 'demo-tools--collapsed': !controlsOpen }" aria-label="设计演示控制台">
      <header><strong>设计 Demo · 全程无麦克风</strong><button type="button" :aria-expanded="controlsOpen" @click="controlsOpen = !controlsOpen">{{ controlsOpen ? '收起' : '演示工具' }}</button></header>
      <template v-if="controlsOpen">
        <p>固定节奏的戏剧过场，不代表技术连接进度。</p>
        <div class="demo-tools__row"><label>等待预设 <select v-model="delay"><option :value="900">短 · 0.9 秒</option><option :value="1700">切人参考 · 1.7 秒</option><option :value="2500">首开参考 · 2.5 秒</option><option :value="8000">长 · 8 秒</option></select></label><button type="button" @click="replay">重播</button></div>
        <div class="demo-tools__row"><button type="button" :disabled="!view.busy" @click="demoVoice.ready">立即模拟接通</button><button type="button" :disabled="!view.busy" @click="demoVoice.fail">模拟失败</button></div>
        <p role="status">{{ status }} · 切换人物可看重新候场</p>
      </template>
    </aside>
  </div>
</template>

<style>
.connection-demo .demo-tools { position: fixed; z-index: 8; top: 12px; right: 16px; width: 320px; padding: 12px 14px; border: 1px dashed #52607a; border-radius: 12px; background: #eaf2fff5; color: #111b45; box-shadow: 0 2px 8px #111b4514; font: 13px/1.5 system-ui, sans-serif; }
.demo-tools header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }.demo-tools p { margin: 7px 0 0; }.demo-tools__row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 8px; }.demo-tools button,.demo-tools select { min-height: 32px; padding: 4px 8px; border: 1px solid #52607a; border-radius: 7px; background: #fffef7; color: #111b45; font: inherit; }.demo-tools button:disabled { opacity: .5; }.demo-tools button:focus-visible,.demo-tools select:focus-visible { outline: 3px solid #075bfa; outline-offset: 2px; }
@media(max-width: 700px) { .connection-demo .demo-tools { top: 8px; bottom: auto; left: 16px; right: 16px; width: auto; }.connection-demo .demo-tools--collapsed { left: auto; padding: 4px; }.demo-tools--collapsed header strong { display: none; }.demo-tools button,.demo-tools select { min-height: 38px; }.demo-tools header strong { font-size: 12px; } }
</style>
