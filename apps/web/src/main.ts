import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { GameDefinition } from '@lie/game-core'

import '@lie/ui/style.css'
import Application from './Application.vue'
import { readCatalog } from './application/catalog'
import { createGameController } from './application/controller'
import { createDemoVoicePort } from './application/demoVoice'
import { createLiveVoicePort } from './application/liveVoice'
import { readCharacterPresets } from './presentation/characterPresets'
import './style.css'

const demo = import.meta.env.DEV && new URLSearchParams(location.search).get('demo') === '1'

async function main() {
  let characterPresets: ReturnType<typeof readCharacterPresets> = []
  try {
    const response = await fetch('/appearances/manifest.json')
    if (response.ok) characterPresets = readCharacterPresets(await response.json())
  } catch { /* Presentation assets are optional; names remain available. */ }
  const createController = (game: GameDefinition | null = null) => createGameController({
    async readGame(gameId) {
      if (game != null) return game
      const response = await fetch(`/games/${encodeURIComponent(gameId)}.json`)
      if (!response.ok) throw new Error('Game load failed')
      return response.json()
    },
    voice: demo ? createDemoVoicePort() : createLiveVoicePort(),
    resolveVoiceId: (appearanceId) => characterPresets.find((characterPreset) => characterPreset.id === appearanceId)?.voiceId ?? null,
    now: Date.now,
    newSessionId: () => crypto.randomUUID(),
  })
  const router = createRouter({ history: createWebHistory(), routes: [{ path: '/:pathMatch(.*)*', component: Application }] })
  const app = createApp(Application, {
    createController, characterPresets, demo,
    async loadCatalog() {
      const response = await fetch('/games/index.json')
      if (!response.ok) throw new Error('Catalog load failed')
      return readCatalog(await response.json())
    },
  })
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void main()
