import { createApp, h } from 'vue'
import '@lie/ui/style.css'
import '/src/style.css'
import App from '/src/App.vue'
import { createGameController } from '/src/application/controller'
import { createDemoVoicePort } from '/src/application/demoVoice'
import { readCharacterPresets } from '/src/presentation/characterPresets'
const query = new URLSearchParams(location.search)
const presets = readCharacterPresets(await fetch('/appearances/manifest.json').then(response => response.json())).map(preset => query.has('static') ? { ...preset, animation: null } : preset)
const count = Number(query.get('count') ?? presets.length)
const game = {
  id: 'layout-fixture', title: '人物定位 · 离线布局检查', summary: '合成内容，不使用语音。',
  interrogationLimitSeconds: 480, background: '此页渲染正式 App 与人物组件；人物数量与预设用于独立布局检查。',
  characters: presets.slice(0, count).map(preset => ({ id: preset.id, name: preset.name, profile: '布局检查角色。', appearanceId: preset.id })),
  ending: { culpritId: presets[0].id, reveal: '布局检查结束。' },
}
const controller = createGameController({ readGame: async () => game, voice: createDemoVoicePort(), newSessionId: () => crypto.randomUUID(), now: Date.now })
await controller.load(game.id)
controller.start()
createApp({ render: () => h(App, { controller, characterPresets: presets, demo: true }) }).mount('#app')
