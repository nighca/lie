import { createApp, h } from 'vue'
import '@lie/ui/style.css'
import './src/style.css'
import App from './src/App.vue'
import { createGameController } from './src/application/controller'
import { readBundledCase } from './src/application/bundledCases'
import { createCharacterPresetLoader } from './src/presentation/characterPresetLoader'
import type { ConversationScope } from './src/application/voice'

const query = new URLSearchParams(location.search)
if (!query.has('frame')) {
  document.getElementById('app')!.innerHTML = '<iframe id="desktop" title="desktop" src="/__voice_connection_qa.html?frame=1" width="1280" height="878" style="display:block;border:0"></iframe><iframe id="mobile" title="mobile" src="/__voice_connection_qa.html?frame=1" width="391" height="844" style="display:block;border:0"></iframe>'
} else {
  const attempts: { scope: ConversationScope; ready(): void; fail(): void; closed: boolean }[] = []
  const presets = createCharacterPresetLoader()
  const controller = createGameController({ readGame: readBundledCase, now: Date.now, newSessionId: () => crypto.randomUUID(), voice: { create(scope) {
    let ready = () => {}; let fail = () => {}
    const prepared = new Promise<void>((resolve, reject) => { ready = resolve; fail = () => reject(new Error('QA connection failure')) })
    const attempt = { scope, ready: () => ready(), fail: () => fail(), closed: false }; attempts.push(attempt)
    return { open: () => prepared, close() { attempt.closed = true } }
  } } })
  createApp({ setup: () => () => h(App, { controller, characterPresets: presets.state.presets, demo: false, onNavigateHome: () => controller.end(), onRequestEnd: () => controller.end() }) }).mount('#app')
  const controls = document.createElement('aside'); controls.id = 'qa-controls'
  controls.style.cssText = 'position:fixed;top:0;right:0;z-index:50;background:white;font-size:11px'
  function button(label: string, run: () => void) { const b = document.createElement('button'); b.textContent = label; b.onclick = run; controls.append(b) }
  button('模拟收音就绪', () => attempts.at(-1)?.ready())
  button('模拟连接失败', () => attempts.at(-1)?.fail())
  button('模拟旧连接迟到', () => { attempts.slice(0, -1).forEach(a => { a.ready(); a.scope.onEvent({ type: 'assistantText', text: '旧连接不应串入' }) }) })
  document.body.append(controls)
  await controller.load('empty-medal-box'); controller.start(); void presets.load()
}
