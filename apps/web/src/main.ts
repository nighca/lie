import { createApp } from 'vue'

import '@lie/ui/style.css'
import App from './App.vue'
import { createGameController } from './application/controller'
import { createDemoVoicePort } from './application/demoVoice'
import { createLiveVoicePort } from './application/liveVoice'
import { observePageLifecycle } from './application/pageLifecycle'
import gameConfig from './game-config.json'
import { readAppearances } from './presentation/appearances'
import './style.css'

const demo = import.meta.env.DEV && new URLSearchParams(location.search).get('demo') === '1'

async function main() {
  let appearances: ReturnType<typeof readAppearances> = []
  try {
    const response = await fetch('/appearances/manifest.json')
    if (response.ok) appearances = readAppearances(await response.json())
  } catch { /* Presentation assets are optional; names remain available. */ }
  const controller = createGameController({
    async readGame(gameId) {
      const response = await fetch(`/games/${encodeURIComponent(gameId)}.json`)
      if (!response.ok) throw new Error('Game load failed')
      return response.json()
    },
    voice: demo ? createDemoVoicePort() : createLiveVoicePort(),
    resolveVoiceId: (appearanceId) => appearances.find((appearance) => appearance.id === appearanceId)?.voiceId ?? null,
    now: Date.now,
    newSessionId: () => crypto.randomUUID(),
  })
  createApp(App, { controller, appearances, demo }).mount('#app')
  observePageLifecycle(controller, document, window)
  await controller.load(new URLSearchParams(location.search).get('game') ?? gameConfig.defaultGameId)
}

void main()
