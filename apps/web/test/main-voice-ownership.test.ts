import type { App } from 'vue'
import { afterEach, expect, it, vi } from 'vitest'

import type { GameDefinition } from '@lie/game-core'

import type { GameController } from '../src/application/controller'
import { createLiveVoicePort } from '../src/application/liveVoice'
import { game } from './helpers'

const mounted = vi.hoisted(() => ({ app: null as App | null, createController: null as ((game: GameDefinition) => GameController) | null }))

vi.mock('vue', async importOriginal => {
  const vue = await importOriginal<typeof import('vue')>()
  return { ...vue, createApp(...args: Parameters<typeof vue.createApp>) { mounted.app = vue.createApp(...args); return mounted.app } }
})
vi.mock('../src/Application.vue', () => ({ default: {
  props: ['createController'],
  setup(props: { createController: (game: GameDefinition) => GameController }) { mounted.createController = props.createController; return () => null },
} }))
vi.mock('../src/presentation/characterPresetLoader', () => ({ createCharacterPresetLoader: () => ({ state: { presets: [], status: 'ready' }, load: async () => {}, cancel() {} }) }))
vi.mock('../src/application/liveVoice', () => ({ createLiveVoicePort: vi.fn(() => ({
  prepare: vi.fn(async () => {}), reset: vi.fn(),
  create: vi.fn(() => ({ open: async () => {}, close() {} })),
})) }))

afterEach(() => { mounted.app?.unmount(); document.body.innerHTML = '' })

it('gives every real main controller factory call its own voice preparation owner', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  await import('../src/main')
  await vi.waitFor(() => expect(mounted.createController).toBeTypeOf('function'))
  const old = mounted.createController!(game), fresh = mounted.createController!(game)
  const ports = vi.mocked(createLiveVoicePort).mock.results.map(result => result.value)
  expect(ports).toHaveLength(2)
  expect(ports[0]).not.toBe(ports[1])
  try {
    await old.load('test'); await fresh.load('test')
    old.dispose()
    expect(ports[0].reset).toHaveBeenCalledTimes(2)
    expect(ports[1].reset).toHaveBeenCalledOnce()
    fresh.start(); await fresh.startConversation()
    expect(ports[1].prepare).toHaveBeenCalledOnce()
    expect(ports[1].create).toHaveBeenCalledOnce()
  } finally { old.dispose(); fresh.dispose() }
})
