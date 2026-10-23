import { describe, expect, it, vi } from 'vitest'
import type { VoiceChannelOptions } from '@lie/voice'

import { createLiveVoicePort } from '../src/application/liveVoice'
import type { ConversationScope } from '../src/application/voice'

function setupBridge() {
  let current = true
  let options: VoiceChannelOptions | null = null
  let drained = () => {}
  const stopMic = vi.fn(async () => {})
  const context = { state: 'running', resume: async () => {}, close: vi.fn(async () => {}) }
  const player = { enqueue: vi.fn(), stop: vi.fn() }
  const channel = { open: vi.fn(async () => {}), startInput: vi.fn(), input: vi.fn(), stopInput: vi.fn(), interrupt: vi.fn(), close: vi.fn() }
  const onEvent = vi.fn()
  const readContext = vi.fn(() => ({ background: '公共', characterId: 'one', characterName: '甲', profile: '甲自己的设定', history: [], systemPrompt: '角色提示' }))
  const scope: ConversationScope = { sessionId: 'session', characterId: 'one', epoch: 1, signal: new AbortController().signal, isCurrent: () => current, readContext, onEvent }
  const dependencies = {
    createChannel(value: VoiceChannelOptions) { options = value; return channel },
    createPlayer(_context: AudioContext, onIdle: () => void = () => {}) { drained = onIdle; return player },
    openMic: vi.fn(async (): Promise<{ stop(): Promise<void> }> => ({ stop: stopMic })),
    createContext: () => context as unknown as AudioContext,
  }
  const port = createLiveVoicePort(dependencies)
  const connection = port.create(scope)
  return { connection, dependencies, channel, player, context, onEvent, readContext, stopMic, expire() { current = false }, options: () => options!, drain: () => drained() }
}

const format = { format: 'pcm' as const, sampleRate: 16000, channels: 1 as const, bitsPerSample: 16 as const, frameDuration: 20 }

describe('browser voice and device bridge', () => {
  it('waits for queued PCM before declaring completion and stops all owned resources', async () => {
    const bridge = setupBridge()
    await bridge.connection.open(); await bridge.connection.startInput()
    bridge.options().onEvent({ type: 'ready', format })
    bridge.options().onEvent({ type: 'audio', data: new Uint8Array([0, 0]) })
    bridge.options().onEvent({ type: 'tts', state: 'stop', text: null })
    expect(bridge.onEvent).not.toHaveBeenCalled()
    bridge.drain()
    expect(bridge.onEvent).toHaveBeenCalledWith({ type: 'idle' })
    bridge.expire(); bridge.connection.close()
    expect(bridge.channel.close).toHaveBeenCalledOnce()
    expect(bridge.stopMic).toHaveBeenCalledOnce()
    expect(bridge.player.stop).toHaveBeenCalledOnce()
    expect(bridge.context.close).toHaveBeenCalledOnce()
    bridge.options().onEvent({ type: 'audio', data: new Uint8Array([0, 0]) })
    bridge.options().onEvent({ type: 'stt', text: '旧语音' })
    expect(bridge.player.enqueue).toHaveBeenCalledOnce()
    expect(bridge.onEvent).toHaveBeenCalledOnce()
  })

  it('keeps tool reads scoped and rejects expired invocations', async () => {
    const bridge = setupBridge()
    const tool = bridge.options().tools[0]
    const signal = new AbortController().signal
    const context = JSON.parse(await tool.execute({}, signal))
    expect(context).toMatchObject({ characterId: 'one', profile: '甲自己的设定' })
    bridge.expire()
    await expect(tool.execute({}, signal)).rejects.toThrow('expired')
    expect(bridge.readContext).toHaveBeenCalledOnce()
  })

  it('cleans a late microphone grant and ignores an empty PCM frame', async () => {
    const bridge = setupBridge()
    let grant!: (value: { stop(): Promise<void> }) => void
    bridge.dependencies.openMic = vi.fn(() => new Promise((resolve) => { grant = resolve }))
    await bridge.connection.open()
    const starting = bridge.connection.startInput()
    bridge.expire(); bridge.connection.close()
    grant({ stop: bridge.stopMic })
    await starting
    expect(bridge.stopMic).toHaveBeenCalledOnce()
    const second = setupBridge()
    await second.connection.open()
    second.options().onEvent({ type: 'ready', format })
    second.options().onEvent({ type: 'audio', data: new Uint8Array() })
    second.options().onEvent({ type: 'tts', state: 'stop', text: null })
    expect(second.onEvent).toHaveBeenCalledWith({ type: 'idle' })
  })
})
