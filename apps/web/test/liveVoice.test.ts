import { describe, expect, it, vi } from 'vitest'
import type { VoiceChannelOptions, VoiceStartupObservation } from '@lie/voice'

import { createLiveVoicePort } from '../src/application/liveVoice'
import { VoiceAvailabilityError } from '../src/application/voice'
import type { ConversationScope } from '../src/application/voice'

function setupBridge(voiceId: string | null = null, diagnostics: { onStartup?: (event: VoiceStartupObservation & { elapsedMs: number }) => void; now?: () => number } = {}) {
  let current = true
  let options: VoiceChannelOptions | null = null
  let drained = () => {}
  let inputMeter = (_level: number) => {}
  let outputMeter = (_level: number) => {}
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
    ...diagnostics,
    fetchStatus: vi.fn(async (_signal: AbortSignal) => new Response(JSON.stringify({ status: 'ready' }))),
    createChannel(value: VoiceChannelOptions) { options = value; return channel },
    createPlayer(_context: AudioContext, onIdle: () => void = () => {}, onLevel?: (level: number) => void) { drained = onIdle; outputMeter = onLevel ?? (() => {}); return player },
    openMic: vi.fn(async (value: { onFrame(data: Uint8Array): void; onLevel?: (level: number) => void }): Promise<{ stop(): Promise<void> }> => { onFrame = value.onFrame; inputMeter = value.onLevel ?? (() => {}); return { stop: stopMic } }),
    createContext: () => context as unknown as AudioContext,
  }
  const connection = createLiveVoicePort(dependencies).create(scope)
  return { connection, dependencies, channel, player, context, onEvent, readContext, stopMic, expire() { current = false; abort.abort() }, options: () => options!, inputMeter: (level: number) => inputMeter(level), outputMeter: (level: number) => outputMeter(level), drain: () => drained(), frame: (data: Uint8Array) => onFrame(data) }
}

const format = { format: 'pcm' as const, sampleRate: 16000, channels: 1 as const, bitsPerSample: 16 as const, frameDuration: 20 }

describe('continuous browser voice and device bridge', () => {
  it('uses sampled levels rather than packets, estimates input activity with hysteresis and isolates closure', async () => {
    const bridge = setupBridge()
    let now = 0
    const time = vi.spyOn(performance, 'now').mockImplementation(() => now)
    try {
      await bridge.connection.open()
      bridge.options().onEvent({ type: 'ready', format })
      bridge.options().onEvent({ type: 'tts', state: 'start', text: null })
      bridge.options().onEvent({ type: 'audio', data: new Uint8Array([1, 2]) })
      expect(bridge.onEvent.mock.calls.flat().filter((event) => event.type === 'audioLevel')).toHaveLength(0)
      bridge.inputMeter(0.02)
      expect(bridge.onEvent).toHaveBeenLastCalledWith({ type: 'audioLevel', inputLevel: 0.02, outputLevel: 0, inputActive: false })
      now = 150; bridge.inputMeter(0.03)
      expect(bridge.onEvent).toHaveBeenLastCalledWith({ type: 'audioLevel', inputLevel: 0.03, outputLevel: 0, inputActive: true })
      now = 200; bridge.outputMeter(0.2)
      expect(bridge.onEvent).toHaveBeenLastCalledWith({ type: 'audioLevel', inputLevel: 0.03, outputLevel: 0.2, inputActive: true })
      now = 250; bridge.inputMeter(0)
      now = 550; bridge.inputMeter(0)
      expect(bridge.onEvent).toHaveBeenLastCalledWith({ type: 'audioLevel', inputLevel: 0, outputLevel: 0.2, inputActive: true })
      now = 600; bridge.inputMeter(0)
      expect(bridge.onEvent).toHaveBeenLastCalledWith({ type: 'audioLevel', inputLevel: 0, outputLevel: 0.2, inputActive: false })
      bridge.connection.close()
      bridge.onEvent.mockClear()
      now = 700; bridge.inputMeter(1); bridge.outputMeter(1)
      expect(bridge.onEvent).not.toHaveBeenCalled()
    } finally { bridge.connection.close(); time.mockRestore() }
  })

  it.each([null, 'vendor:voice/warm'])('passes configured voice %s without changing the provider default', (voiceId) => {
    const bridge = setupBridge(voiceId)
    if (voiceId == null) expect(Object.hasOwn(bridge.options(), 'voiceId')).toBe(false)
    else expect(bridge.options().voiceId).toBe(voiceId)
    bridge.connection.close()
  })

  it('reports unavailable before preparing devices or opening WebSocket', async () => {
    const bridge = setupBridge()
    bridge.dependencies.fetchStatus.mockResolvedValue(new Response(JSON.stringify({ status: 'unavailable' })))
    await expect(bridge.connection.open()).rejects.toMatchObject({ reason: 'unavailable' })
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


describe('local startup diagnostics', () => {
  it('uses a per-opening relative clock, keeps branches parallel and records only the first forwarded PCM', async () => {
    let now = 100
    const events: (VoiceStartupObservation & { elapsedMs: number })[] = []
    const bridge = setupBridge(null, { now: () => now, onStartup: event => events.push(event) })
    let status!: (value: Response) => void
    let channelReady!: () => void
    bridge.dependencies.fetchStatus.mockImplementation(() => new Promise(resolve => { status = resolve }))
    bridge.channel.open.mockImplementation(() => new Promise(resolve => { channelReady = resolve }))
    const opening = bridge.connection.open()
    expect(events).toEqual([{ stage: 'startup', result: 'started', elapsedMs: 0 }, { stage: 'status', result: 'started', elapsedMs: 0 }])
    expect(bridge.dependencies.openMic).toHaveBeenCalledTimes(0)
    now = 140
    status(new Response('{"status":"ready"}'))
    await vi.waitFor(() => expect(bridge.channel.open).toHaveBeenCalledOnce())
    expect(bridge.dependencies.openMic).toHaveBeenCalledOnce()
    expect(bridge.context.resume).toHaveBeenCalledOnce()
    bridge.frame(new Uint8Array(640))
    expect(events.some(event => event.stage === 'firstForwardedPcm')).toBe(false)
    now = 180
    channelReady(); await opening
    bridge.frame(new Uint8Array(640)); bridge.frame(new Uint8Array(640))
    expect(events.filter(event => event.stage === 'firstForwardedPcm')).toEqual([{ stage: 'firstForwardedPcm', result: 'completed', elapsedMs: 80 }])
    expect(events.findIndex(event => event.stage === 'listenStart')).toBeLessThan(events.findIndex(event => event.stage === 'firstForwardedPcm'))
    expect(events.every(event => Object.keys(event).sort().join() === 'elapsedMs,result,stage')).toBe(true)
    bridge.connection.close()
    await vi.waitFor(() => expect(events.at(-1)).toEqual({ stage: 'cleanup', result: 'completed', elapsedMs: 80 }))
    const second = setupBridge(null, { now: () => now, onStartup: event => events.push(event) })
    await second.connection.open()
    expect(events.filter(event => event.stage === 'startup' && event.result === 'started').map(event => event.elapsedMs)).toEqual([0, 0])
    second.connection.close()
  })

  it('reports cleanup completion only after late permission and asynchronous stop settle', async () => {
    const events: VoiceStartupObservation[] = []
    const bridge = setupBridge(null, { onStartup: event => events.push(event) })
    let grant!: (value: { stop(): Promise<void> }) => void
    let stopped!: () => void
    bridge.dependencies.openMic.mockImplementation(() => new Promise(resolve => { grant = resolve }))
    const opening = bridge.connection.open()
    await vi.waitFor(() => expect(bridge.dependencies.openMic).toHaveBeenCalledOnce())
    bridge.expire(); bridge.connection.close()
    expect(events).toContainEqual(expect.objectContaining({ stage: 'startup', result: 'cancelled' }))
    expect(events.filter(event => event.stage === 'cleanup').map(event => event.result)).toEqual(['started'])
    grant({ stop: () => new Promise(resolve => { stopped = resolve }) })
    await vi.waitFor(() => expect(stopped).toBeTypeOf('function'))
    expect(events.filter(event => event.stage === 'cleanup').map(event => event.result)).toEqual(['started'])
    stopped(); await opening
    await vi.waitFor(() => expect(events.filter(event => event.stage === 'cleanup').map(event => event.result)).toEqual(['started', 'completed']))
    expect(bridge.channel.startInput).toHaveBeenCalledTimes(0)
  })

  it('isolates throwing observers from successful startup and failure cleanup', async () => {
    const bridge = setupBridge(null, { onStartup() { throw new Error('diagnostic only') } })
    await bridge.connection.open()
    bridge.frame(new Uint8Array(640))
    expect(bridge.channel.input).toHaveBeenCalledOnce()
    expect(() => bridge.connection.close()).not.toThrow()
    const failed = setupBridge(null, { onStartup() { throw new Error('diagnostic only') } })
    failed.channel.open.mockRejectedValue(new Error('network'))
    await expect(failed.connection.open()).rejects.toThrow('network')
    expect(failed.context.close).toHaveBeenCalledOnce()
  })
})


it('records failed startup before a controller-like error consumer cancels the scope', async () => {
  const events: VoiceStartupObservation[] = []
  const bridge = setupBridge(null, { onStartup: event => events.push(event) })
  let reject!: (error: Error) => void
  bridge.channel.open.mockImplementation(() => new Promise((_resolve, fail) => { reject = fail }))
  bridge.onEvent.mockImplementation(event => {
    if (event.type === 'error') { bridge.expire(); bridge.connection.close() }
  })
  const opening = bridge.connection.open()
  await vi.waitFor(() => expect(bridge.channel.open).toHaveBeenCalledOnce())
  bridge.options().onEvent({ type: 'error', code: 'connection', message: 'private network detail' })
  reject(new Error('network'))
  await expect(opening).rejects.toThrow('network')
  expect(events.filter(event => event.stage === 'startup').map(event => event.result)).toEqual(['started', 'failed'])
})

it('propagates the specific frame limit cause and closes devices once through the caller', async () => {
  const bridge = setupBridge()
  await bridge.connection.open()
  bridge.options().onEvent({ type: 'error', code: 'payload-too-large', message: 'Voice context exceeds the transport frame limit' })
  expect(bridge.onEvent).toHaveBeenLastCalledWith({ type: 'error', reason: 'context-too-large' })
  bridge.connection.close(); bridge.connection.close()
  expect(bridge.stopMic).toHaveBeenCalledTimes(1)
  expect(bridge.channel.close).toHaveBeenCalledTimes(1)
  expect(bridge.context.close).toHaveBeenCalledTimes(1)
})
