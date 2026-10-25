import { createApp, h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { loadGame } from '@lie/game-core'
import '@lie/ui/style.css'
import './src/style.css'
import Application from './src/Application.vue'
import { createGameController } from './src/application/controller'
import { createDemoVoicePort } from './src/application/demoVoice'
import { readBundledCase } from './src/application/bundledCases'
import { caseCatalog } from './src/application/catalog'
import { createCharacterPresetLoader } from './src/presentation/characterPresetLoader'
import { createRemixDraft, DRAFT_KEY } from './src/editor/draft'
import { encodeGameLink } from './src/editor/share'

const kind = new URLSearchParams(location.search).get('kind')
if (kind == null) {
  for (const source of ['preview', 'official', 'shared']) for (const outcome of ['correct', 'wrong']) {
    const frame = document.createElement('iframe'); frame.id = `${source}-${outcome}`; frame.title = frame.id; frame.width = '391'; frame.height = '844'; frame.src = `/__preview_result_qa.html?kind=${source}`; document.getElementById('app')!.append(frame)
  }
} else {
  const values = new Map<string, string>()
  const memoryStorage = { get length() { return values.size }, clear() { values.clear() }, getItem(key: string) { return values.get(key) ?? null }, setItem(key: string, value: string) { values.set(key, value) }, removeItem(key: string) { values.delete(key) }, key(index: number) { return [...values.keys()][index] ?? null } }
  Object.defineProperty(window, 'localStorage', { configurable: true, value: memoryStorage })
  const game = await loadGame('empty-medal-box', readBundledCase)
  if (kind === 'preview') memoryStorage.setItem(DRAFT_KEY, JSON.stringify(createRemixDraft(game)))
  const presets = createCharacterPresetLoader(); await presets.load()
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: Application }] })
  let path = '/?game=empty-medal-box'
  if (kind === 'preview') path = '/editor'
  if (kind === 'shared') { const shared = new URL(await encodeGameLink(game, location.origin)); path = shared.pathname + shared.hash }
  await router.push(path); await router.isReady()
  createApp({ setup: () => () => h(Application, { catalog: caseCatalog, characterPresets: presets.state.presets, demo: true, createController: (source = null) => createGameController({ readGame: async () => source ?? game, voice: createDemoVoicePort(), now: Date.now, newSessionId: () => crypto.randomUUID() }) }) }).use(router).mount('#app')
}
