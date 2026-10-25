import { createApp, h, onUnmounted } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { GameDefinition } from '@lie/game-core'

import '@lie/ui/style.css'
import Application from './Application.vue'
import { readCatalog } from './application/catalog'
import { createGameController } from './application/controller'
import { createDemoVoicePort } from './application/demoVoice'
import { createLiveVoicePort } from './application/liveVoice'
import { createCharacterPresetLoader } from './presentation/characterPresetLoader'
import './style.css'

const demo = import.meta.env.DEV && new URLSearchParams(location.search).get('demo') === '1'

async function main() {
  const presets = createCharacterPresetLoader()
  const createController = (game: GameDefinition | null = null) => createGameController({
    async readGame(gameId) {
      if (game != null) return game
      const response = await fetch(`/games/${encodeURIComponent(gameId)}.json`)
      if (!response.ok) throw new Error('Game load failed')
      return response.json()
    },
    voice: demo ? createDemoVoicePort() : createLiveVoicePort(),
    resolveVoiceId: (appearanceId) => presets.state.presets.find((characterPreset) => characterPreset.id === appearanceId)?.voiceId ?? null,
    now: Date.now,
    newSessionId: () => crypto.randomUUID(),
  })
  const router = createRouter({ history: createWebHistory(), routes: [{ path: '/:pathMatch(.*)*', component: Application }] })
  const loadCatalog = async () => {
    const response = await fetch('/games/index.json')
    if (!response.ok) throw new Error('Catalog load failed')
    return readCatalog(await response.json())
  }
  const app = createApp({
    setup() {
      onUnmounted(presets.cancel)
      return () => h(Application, {
        createController, loadCatalog, demo,
        characterPresets: presets.state.presets,
        presetStatus: presets.state.status,
        loadCharacterPresets: presets.load,
      })
    },
  })
  app.use(router)
  await router.isReady()
  app.mount('#app')
  void presets.load()
}

void main()
