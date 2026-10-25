import { createApp, h, onUnmounted } from 'vue'

import '@lie/ui/style.css'
import App from '../../../apps/web/src/App.vue'
import { readBundledCase } from '../../../apps/web/src/application/bundledCases'
import { createGameController } from '../../../apps/web/src/application/controller'
import '../../../apps/web/src/style.css'

if (!import.meta.env.DEV) throw new Error('Voice notice QA is development-only')

const attempts: { ready(): void; fail(): void; closed: boolean }[] = []
const controller = createGameController({
  readGame: async () => readBundledCase('empty-medal-box'),
  now: Date.now,
  newSessionId: () => 'voice-notice-native-qa',
  voice: {
    create() {
      let ready = () => {}
      let fail = () => {}
      const pending = new Promise<void>((resolve, reject) => {
        ready = resolve
        fail = () => reject(new Error('Controlled QA failure'))
      })
      const attempt = { ready: () => ready(), fail: () => fail(), closed: false }
      attempts.push(attempt)
      return { open: () => pending, close() { attempt.closed = true } }
    },
  },
})

await controller.load('empty-medal-box')
controller.start()
createApp({
  setup() {
    onUnmounted(controller.dispose)
    return () => h('div', [
      h('aside', { style: 'position:fixed;right:4px;bottom:4px;z-index:20;background:white;padding:4px', 'aria-label': 'DEV fake transport controls' }, [
        h('button', { onClick: () => attempts.at(-1)?.ready() }, 'QA ready / late ready'),
        h('button', { onClick: () => attempts.at(-1)?.fail() }, 'QA fail'),
      ]),
      h(App, { controller, characterPresets: [], demo: true }),
    ])
  },
}).mount('#app')
