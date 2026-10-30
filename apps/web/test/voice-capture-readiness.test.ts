import { flushPromises } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'

import { createGameController } from '../src/application/controller'
import { createLiveVoicePort } from '../src/application/liveVoice'
import { game } from './helpers'

it('keeps the controller connecting after the transport opens until microphone capture is ready', async () => {
  let grant: ((mic: { stop(): Promise<void> }) => void) | null = null
  let now = 0
  const channel = { open: vi.fn(async () => {}), startInput: vi.fn(), input: vi.fn(), stopInput: vi.fn(), interrupt: vi.fn(), close: vi.fn() }
  const stopMic = vi.fn(async () => {})
  const voice = createLiveVoicePort({
    createChannel: () => channel,
    createPlayer: () => ({ enqueue() {}, flush() {}, stop() {} }),
    createContext: () => ({ state: 'running', resume: async () => {}, close: async () => {} }) as unknown as AudioContext,
    openMic: () => new Promise(resolve => { grant = resolve }),
    fetchStatus: async () => new Response('{"status":"ready"}'),
  })
  const controller = createGameController({ readGame: async () => game, voice, now: () => now, newSessionId: () => 'capture-test', clock: { now: () => now, setTimeout, clearTimeout } })
  try {
    await controller.load('test'); controller.start()
    const opening = controller.startConversation()
    await flushPromises()
    expect(channel.open).toHaveBeenCalledOnce()
    now = 5000
    expect(controller.getView()).toMatchObject({ busy: true, conversationActive: true, interrogationRemainingMs: 480000 })
    expect(channel.startInput).not.toHaveBeenCalled()
    if (grant == null) throw new Error('Microphone preparation was not started')
    const finish: (mic: { stop(): Promise<void> }) => void = grant
    finish({ stop: stopMic }); await opening
    expect(channel.startInput).toHaveBeenCalledOnce()
    expect(controller.getView()).toMatchObject({ busy: false, conversationActive: true, voiceStatus: 'recording', interrogationRemainingMs: 480000 })
    now += 100
    expect(controller.getView().interrogationRemainingMs).toBe(479900)
  } finally { controller.dispose() }
  expect(stopMic).toHaveBeenCalledOnce()
})
