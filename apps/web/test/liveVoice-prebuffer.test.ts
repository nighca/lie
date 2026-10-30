import { createPcmPlayer } from '@lie/voice'
import type { VoiceChannelOptions } from '@lie/voice'
import { afterEach, expect, it, vi } from 'vitest'

import { createLiveVoicePort } from '../src/application/liveVoice'
import type { ConversationEvent, ConversationScope } from '../src/application/voice'

function fixture() {
  const sources: { onended: (() => void) | null; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = []
  const context = {
    currentTime: 0, sampleRate: 48000, state: 'running', destination: {},
    resume: async () => {}, close: vi.fn(async () => {}),
    createBuffer: (_channels: number, size: number, rate: number) => ({ duration: size / rate, copyToChannel() {} }),
    createAnalyser: () => ({ fftSize: 512, connect() {}, disconnect() {}, getFloatTimeDomainData(data: Float32Array) { data.fill(0) } }),
    createBufferSource() {
      const source = { buffer: null, onended: null as (() => void) | null, connect() {}, disconnect() {}, start: vi.fn(), stop: vi.fn() }
      sources.push(source)
      return source
    },
  }
  let receive: VoiceChannelOptions['onEvent'] = () => {}
  const events: ConversationEvent[] = []
  const scope: ConversationScope = {
    sessionId: 'test', characterId: 'one', epoch: 1, voiceId: null, signal: new AbortController().signal,
    isCurrent: () => true,
    readContext: () => ({ background: 'public', characterId: 'one', characterName: 'A', profile: 'profile', history: [], systemPrompt: 'test' }),
    onEvent: event => events.push(event),
  }
  const connection = createLiveVoicePort({
    createPlayer: createPcmPlayer,
    createContext: () => context as unknown as AudioContext,
    createChannel(options) {
      receive = options.onEvent
      return { open: async () => {}, close() {}, startInput() {}, input() {}, stopInput() {}, interrupt() {} }
    },
    openMic: async () => ({ stop: async () => {} }),
    fetchStatus: async () => new Response('{"status":"ready"}'),
  }).create(scope)
  return { connection, sources, events, context, receive: (event: Parameters<VoiceChannelOptions['onEvent']>[0]) => receive(event) }
}

const format = { format: 'pcm' as const, sampleRate: 16000, channels: 1 as const, bitsPerSample: 16 as const, frameDuration: 20 }
afterEach(() => vi.useRealTimers())

it('flushes a real-player short tail on normal TTS stop and listens only after playback drains', async () => {
  vi.useFakeTimers()
  const f = fixture()
  try {
    await f.connection.open()
    f.receive({ type: 'ready', format })
    f.receive({ type: 'tts', state: 'start', text: null })
    f.receive({ type: 'audio', data: new Uint8Array(640) })
    expect(f.sources).toHaveLength(0)
    expect(f.events.at(-1)).toEqual({ type: 'speaking' })
    f.receive({ type: 'tts', state: 'stop', text: null, aborted: false })
    expect(f.sources).toHaveLength(1)
    expect(f.sources[0].start).toHaveBeenCalledOnce()
    expect(f.events.at(-1)).toEqual({ type: 'speaking' })
    f.sources[0].onended?.()
    expect(f.events.at(-1)).toEqual({ type: 'listening' })
  } finally { f.connection.close() }
  expect(vi.getTimerCount()).toBe(0)
})

it.each(['stt', 'aborted', 'close'])('clears real-player pending PCM on %s before its timeout', async reason => {
  vi.useFakeTimers()
  const f = fixture()
  try {
    await f.connection.open()
    f.receive({ type: 'ready', format })
    f.receive({ type: 'tts', state: 'start', text: null })
    f.receive({ type: 'audio', data: new Uint8Array(640) })
    if (reason === 'stt') f.receive({ type: 'stt', text: 'interrupt' })
    else if (reason === 'aborted') f.receive({ type: 'tts', state: 'stop', text: null, aborted: true })
    else f.connection.close()
    vi.advanceTimersByTime(100)
    expect(f.sources).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  } finally { f.connection.close() }
})


it('reports a real-player asynchronous buffer failure as error without a listening transition', async () => {
  vi.useFakeTimers()
  const f = fixture()
  try {
    await f.connection.open()
    f.receive({ type: 'ready', format })
    f.receive({ type: 'tts', state: 'start', text: null })
    f.receive({ type: 'audio', data: new Uint8Array(640) })
    vi.spyOn(f.context, 'createBuffer').mockImplementationOnce(() => { throw new Error('Playback unavailable') })
    vi.advanceTimersByTime(100)
    expect(f.events.filter(event => event.type === 'error')).toEqual([{ type: 'error' }])
    expect(f.events.some(event => event.type === 'listening')).toBe(false)
    expect(f.sources).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  } finally { f.connection.close() }
})
