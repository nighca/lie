import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import '@lie/ui/style.css'
import Application from './Application.vue'
import { readCatalog } from './application/catalog'
import { createGameController } from './application/controller'
import { createDemoVoicePort } from './application/demoVoice'
import { createLiveVoicePort } from './application/liveVoice'
import { readAppearances } from './presentation/appearances'
import './style.css'

const demo = import.meta.env.DEV && new URLSearchParams(location.search).get('demo') === '1'

async function main() {
  let appearances: ReturnType<typeof readAppearances> = []
  try {
    const response = await fetch('/appearances/manifest.json')
    if (response.ok) appearances = readAppearances(await response.json())
  } catch { /* Presentation assets are optional; names remain available. */ }
  const createController = () => createGameController({
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
  const router = createRouter({ history: createWebHistory(), routes: [{ path: '/:pathMatch(.*)*', component: Application }] })
  const app = createApp(Application, {
    createController, appearances, demo,
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
