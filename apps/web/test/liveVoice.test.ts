import { describe, expect, it, vi } from 'vitest'
import type { VoiceChannelOptions } from '@lie/voice'

import { createLiveVoicePort } from '../src/application/liveVoice'
import { VoiceAvailabilityError } from '../src/application/voice'
import type { ConversationScope } from '../src/application/voice'

function setupBridge(voiceId: string | null = null) {
  let current = true
  let options: VoiceChannelOptions | null = null
  let drained = () => {}
  const stopMic = vi.fn(async () => {})
  const context = { state: 'running', resume: vi.fn(async () => {}), close: vi.fn(async () => {}) }
  const player = { enqueue: vi.fn(), stop: vi.fn(() => drained()) }
  const channel = { open: vi.fn(async () => {}), startInput: vi.fn(), input: vi.fn(), stopInput: vi.fn(), interrupt: vi.fn(), close: vi.fn() }
  const onEvent = vi.fn()
  const readContext = vi.fn(() => ({ background: '公共', characterId: 'one', characterName: '甲', profile: '甲自己的设定', history: [], systemPrompt: '角色提示' }))
  const abort = new AbortController()
  const scope: ConversationScope = { sessionId: 'session', characterId: 'one', voiceId, epoch: 1, signal: abort.signal, isCurrent: () => current, readContext, onEvent }
  let onFrame: (data: Uint8Array) => void = () => {}
  const dependencies = {
    fetchStatus: vi.fn(async (_signal: AbortSignal) => new Response(JSON.stringify({ status: 'ready' }))),
    createChannel(value: VoiceChannelOptions) { options = value; return channel },
    createPlayer(_context: AudioContext, onIdle: () => void = () => {}) { drained = onIdle; return player },
    openMic: vi.fn(async (value: { onFrame(data: Uint8Array): void }): Promise<{ stop(): Promise<void> }> => { onFrame = value.onFrame; return { stop: stopMic } }),
    createContext: () => context as unknown as AudioContext,
  }
  const connection = createLiveVoicePort(dependencies).create(scope)
  return { connection, dependencies, channel, player, context, onEvent, readContext, stopMic, expire() { current = false; abort.abort() }, options: () => options!, drain: () => drained(), frame: (data: Uint8Array) => onFrame(data) }
}

const format = { format: 'pcm' as const, sampleRate: 16000, channels: 1 as const, bitsPerSample: 16 as const, frameDuration: 20 }

describe('continuous browser voice and device bridge', () => {
  it.each([null, 'vendor:voice/warm'])('passes configured voice %s without changing the provider default', (voiceId) => {
    const bridge = setupBridge(voiceId)
    if (voiceId == null) expect(Object.hasOwn(bridge.options(), 'voiceId')).toBe(false)
    else expect(bridge.options().voiceId).toBe(voiceId)
    bridge.connection.close()
  })

  it.each(['unavailable', 'access-required'])('reports %s before preparing devices or opening WebSocket', async (status) => {
    const bridge = setupBridge()
    bridge.dependencies.fetchStatus.mockResolvedValue(new Response(JSON.stringify({ status }), { headers: { 'X-Lie-Local-Test-Entry': '/__lie/dev-session' } }))
    await expect(bridge.connection.open()).rejects.toMatchObject({ reason: status, localTestEntry: status === 'access-required' ? '/__lie/dev-session' : null })
    expect(bridge.dependencies.openMic).not.toHaveBeenCalled()
    expect(bridge.channel.open).not.toHaveBeenCalled()
    expect(bridge.context.resume).not.toHaveBeenCalled()
  })

  it.each(['network', 'unexpected-response', 'null-response', 'http-failure'])('keeps %s failures explicit instead of opening capture', async (failure) => {
    const bridge = setupBridge()
    if (failure === 'network') bridge.dependencies.fetchStatus.mockRejectedValue(new Error('network'))
    else bridge.dependencies.fetchStatus.mockResolvedValue(new Response(JSON.stringify(failure === 'null-response' ? null : { status: 'unknown' }), { status: failure === 'http-failure' ? 500 : 200 }))
    await expect(bridge.connection.open()).rejects.toBeInstanceOf(VoiceAvailabilityError)
    expect(bridge.dependencies.openMic).not.toHaveBeenCalled()
    expect(bridge.channel.open).not.toHaveBeenCalled()
  })

  it('cancels a pending availability check without preparing capture', async () => {
    const bridge = setupBridge()
    let ready!: (response: Response) => void
    bridge.dependencies.fetchStatus.mockImplementation(() => new Promise((resolve) => { ready = resolve }))
    const opening = bridge.connection.open()
    bridge.expire(); bridge.connection.close()
    ready(new Response(JSON.stringify({ status: 'ready' })))
    await opening
    expect(bridge.dependencies.openMic).not.toHaveBeenCalled()
    expect(bridge.channel.open).not.toHaveBeenCalled()
  })

  it('keeps capture and one channel open across drained answers and an interruption', async () => {
    const bridge = setupBridge()
    await bridge.connection.open()
    expect(bridge.options().listenMode).toBe('realtime')
    bridge.options().onEvent({ type: 'ready', format })
    for (let index = 0; index < 2; index++) {
      bridge.options().onEvent({ type: 'tts', state: 'start', text: null })
      bridge.options().onEvent({ type: 'audio', data: new Uint8Array([0, 0]) })
      bridge.options().onEvent({ type: 'tts', state: 'stop', text: null, aborted: false })
      expect(bridge.onEvent).toHaveBeenLastCalledWith({ type: 'speaking' })
      bridge.drain()
      expect(bridge.onEvent).toHaveBeenLastCalledWith({ type: 'listening' })
    }
    bridge.options().onEvent({ type: 'tts', state: 'start', text: null })
    bridge.options().onEvent({ type: 'audio', data: new Uint8Array([0, 0]) })
    bridge.onEvent.mockClear()
    bridge.options().onEvent({ type: 'tts', state: 'stop', text: null, aborted: true })
    expect(bridge.onEvent.mock.calls).toEqual([[{ type: 'interrupted' }]])
    bridge.options().onEvent({ type: 'tts', state: 'start', text: null })
    bridge.options().onEvent({ type: 'audio', data: new Uint8Array([0, 0]) })
    bridge.options().onEvent({ type: 'tts', state: 'stop', text: null, aborted: false })
    bridge.drain()
    bridge.frame(new Uint8Array([0, 0]))
    expect(bridge.onEvent).toHaveBeenLastCalledWith({ type: 'listening' })
    expect(bridge.channel.open).toHaveBeenCalledOnce()
    expect(bridge.channel.startInput).toHaveBeenCalledOnce()
    expect(bridge.channel.input).toHaveBeenCalledOnce()
    expect(bridge.stopMic).not.toHaveBeenCalled()
    bridge.expire(); bridge.connection.close(); bridge.connection.close()
    expect(bridge.channel.close).toHaveBeenCalledOnce()
    expect(bridge.stopMic).toHaveBeenCalledOnce()
    expect(bridge.context.close).toHaveBeenCalledOnce()
    const events = bridge.onEvent.mock.calls.length
    bridge.options().onEvent({ type: 'stt', text: '旧语音' })
    expect(bridge.onEvent).toHaveBeenCalledTimes(events)
  })

  it('starts microphone and channel preparation together, discards early PCM and uploads only when ready', async () => {
    const bridge = setupBridge()
    let ready!: () => void
    bridge.channel.open.mockImplementation(() => new Promise<void>((resolve) => { ready = resolve }))
    const opening = bridge.connection.open()
    await vi.waitFor(() => expect(bridge.dependencies.openMic).toHaveBeenCalledOnce())
    expect(bridge.dependencies.openMic).toHaveBeenCalledOnce()
    expect(bridge.context.resume).toHaveBeenCalledOnce()
    bridge.frame(new Uint8Array([1, 2]))
    expect(bridge.channel.input).not.toHaveBeenCalled()
    ready(); await opening
    bridge.frame(new Uint8Array([3, 4]))
    expect(bridge.channel.input).toHaveBeenCalledExactlyOnceWith(new Uint8Array([3, 4]))
    bridge.connection.close()
  })

  it('keeps tool reads scoped and rejects expired invocations', async () => {
    const bridge = setupBridge()
    const tool = bridge.options().tools[0]
    const context = JSON.parse(await tool.execute({}, new AbortController().signal))
    expect(context).toMatchObject({ characterId: 'one', profile: '甲自己的设定' })
    bridge.expire()
    await expect(tool.execute({}, new AbortController().signal)).rejects.toThrow('expired')
  })

  it('cleans a microphone grant arriving after cancellation without opening capture', async () => {
    const bridge = setupBridge()
    let grant!: (value: { stop(): Promise<void> }) => void
    bridge.dependencies.openMic = vi.fn(() => new Promise((resolve) => { grant = resolve }))
    const opening = bridge.connection.open()
    await vi.waitFor(() => expect(bridge.dependencies.openMic).toHaveBeenCalledOnce())
    bridge.expire(); bridge.connection.close()
    grant({ stop: bridge.stopMic })
    await opening
    expect(bridge.stopMic).toHaveBeenCalledOnce()
    expect(bridge.channel.startInput).not.toHaveBeenCalled()
  })

  it('cleans parallel resources and a late microphone after connection failure', async () => {
    const bridge = setupBridge()
    let grant!: (value: { stop(): Promise<void> }) => void
    bridge.dependencies.openMic = vi.fn(() => new Promise((resolve) => { grant = resolve }))
    bridge.channel.open.mockRejectedValue(new Error('network'))
    await expect(bridge.connection.open()).rejects.toThrow('network')
    expect(bridge.context.close).toHaveBeenCalledOnce()
    grant({ stop: bridge.stopMic })
    await Promise.resolve()
    expect(bridge.stopMic).toHaveBeenCalledOnce()
    expect(bridge.channel.startInput).not.toHaveBeenCalled()
  })

  it.each(['stt', 'start'] as const)('flushes an undrained old answer before a new %s boundary', async (boundary) => {
    const bridge = setupBridge()
    await bridge.connection.open()
    bridge.options().onEvent({ type: 'ready', format })
    bridge.options().onEvent({ type: 'tts', state: 'start', text: null })
    bridge.options().onEvent({ type: 'tts', state: 'sentence', text: '上轮回答。' })
    bridge.options().onEvent({ type: 'audio', data: new Uint8Array([0, 0]) })
    bridge.options().onEvent({ type: 'tts', state: 'stop', text: null, aborted: false })
    bridge.onEvent.mockClear()
    if (boundary === 'stt') bridge.options().onEvent({ type: 'stt', text: '新问题。' })
    else bridge.options().onEvent({ type: 'tts', state: 'start', text: null })
    expect(bridge.player.stop).toHaveBeenCalledOnce()
    expect(bridge.onEvent.mock.calls).toEqual([
      [{ type: 'interrupted' }],
      [boundary === 'stt' ? { type: 'userText', text: '新问题。' } : { type: 'speaking' }],
    ])
    bridge.connection.close()
  })


  it('drops recognizable old output after barge-in until the next answer starts', async () => {
    const bridge = setupBridge()
    await bridge.connection.open()
    bridge.options().onEvent({ type: 'ready', format })
    bridge.options().onEvent({ type: 'tts', state: 'start', text: null })
    bridge.options().onEvent({ type: 'audio', data: new Uint8Array([0, 0]) })
    bridge.options().onEvent({ type: 'stt', text: '插话。' })
    bridge.onEvent.mockClear(); bridge.player.enqueue.mockClear()
    bridge.options().onEvent({ type: 'audio', data: new Uint8Array([1, 1]) })
    bridge.options().onEvent({ type: 'tts', state: 'sentence', text: '旧回答。' })
    bridge.options().onEvent({ type: 'tts', state: 'stop', text: null, aborted: true })
    expect(bridge.player.enqueue).not.toHaveBeenCalled()
    expect(bridge.onEvent).not.toHaveBeenCalled()
    bridge.options().onEvent({ type: 'tts', state: 'start', text: null })
    bridge.options().onEvent({ type: 'tts', state: 'sentence', text: '新回答。' })
    bridge.options().onEvent({ type: 'audio', data: new Uint8Array([2, 2]) })
    expect(bridge.onEvent).toHaveBeenLastCalledWith({ type: 'assistantText', text: '新回答。' })
    expect(bridge.player.enqueue).toHaveBeenCalledExactlyOnceWith(new Uint8Array([2, 2]), format)
    bridge.connection.close()
  })

})
