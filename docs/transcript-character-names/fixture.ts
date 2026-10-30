import { createApp, h } from 'vue'
import type { GameDefinition } from '@lie/game-core'

import '@lie/ui/style.css'
import App from '../../src/App.vue'
import { createGameController } from '../../src/application/controller'
import type { ConversationScope, VoicePort } from '../../src/application/voice'
import { createCharacterPresetLoader } from '../../src/presentation/characterPresetLoader'
import '../../src/style.css'

const content: GameDefinition = {
  id: 'transcript-names-qa', title: '排练室的小插曲', summary: '合成验收样例',
  background: '沈禾、顾遥、叶舟和罗小圆在排练室碰面。这里的内容只用于界面验收。',
  interrogationLimitSeconds: 480,
  characters: [
    { id: 'shen', name: '沈禾', appearanceId: 'sunny-moustache', profile: '合成角色。' },
    { id: 'gu', name: '顾遥', appearanceId: 'coral-bob', profile: '合成角色。' },
    { id: 'ye', name: '叶舟', appearanceId: 'blue-glasses', profile: '合成角色。' },
    { id: 'luo', name: '罗小圆', appearanceId: 'plum-crop', profile: '合成角色。' },
  ],
  ending: { culpritId: 'shen', reveal: '合成结局，不属于正式案件。' },
}
let scope: ConversationScope | null = null
const voice: VoicePort = { create(value) { scope = value; return { async open() {}, close() {} } } }
const presets = createCharacterPresetLoader()
const controller = createGameController({ readGame: async () => content, voice, now: Date.now, newSessionId: () => crypto.randomUUID() })
const app = createApp({ setup: () => () => h(App, { controller, characterPresets: presets.state.presets, demo: true }) })
app.mount('#app')
await presets.load()

async function reset() { await controller.load(content.id); controller.start(); await controller.startConversation() }
async function sample() {
  await reset()
  const exchanges = [
    ['沈禾，你见过顾遥和叶舟吗？', '见过呀。顾遥在门口和叶舟说话，罗小圆刚把椅子搬进去。我当时正好从走廊经过。'],
    ['罗小圆说沈禾来得更早，你记得吗？', '沈禾就是我嘛。顾遥比我早一点，叶舟随后才来，罗小圆还提醒大家别挡住门口。'],
    ['所以顾遥、叶舟和罗小圆都在场？', '对。顾遥靠着门边，叶舟抱着剧本，罗小圆搬来最后一把椅子。我和他们打完招呼，就一起进了排练室。'],
  ]
  for (const [question, answer] of exchanges) {
    scope!.onEvent({ type: 'userText', text: question })
    scope!.onEvent({ type: 'assistantText', text: answer })
    scope!.onEvent({ type: 'listening' })
  }
  controller.endConversation()
}
window.addEventListener('message', async (event) => {
  if (event.source !== parent || event.origin !== location.origin) return
  if (event.data.action === 'sample') await sample()
  if (event.data.action === 'partial') { await reset(); scope!.onEvent({ type: 'assistantText', text: '顾' }) }
  if (event.data.action === 'middle') scope!.onEvent({ type: 'assistantText', text: '遥说沈' })
  if (event.data.action === 'finish') scope!.onEvent({ type: 'assistantText', text: '禾在门口，叶舟和罗小圆也看见了。' })
  if (event.data.action === 'reconnect') { controller.endConversation(); await controller.startConversation() }
})
window.addEventListener('pagehide', () => { app.unmount(); controller.dispose(); presets.cancel() }, { once: true })
await sample()
