import { createPcmPlayer, createVoiceChannel } from '@lie/voice'
import type { MicrophoneOptions, VoiceSocket } from '@lie/voice'
import { afterEach, expect, it, vi } from 'vitest'

import { createLiveVoicePort } from '../src/application/liveVoice'
import type { ConversationEvent } from '../src/application/voice'

async function fixture(turnTaking = true, direct = false) {
  const sent: (string | Uint8Array)[] = []
  const sources: { onended: (() => void) | null; stop: ReturnType<typeof vi.fn> }[] = []
  const events: ConversationEvent[] = []
  const abort = new AbortController()
  let current = true
  let mic: MicrophoneOptions | null = null
  const stopMic = vi.fn(async () => {})
  const socket: VoiceSocket = { binaryType: 'blob', readyState: 1, onopen: null, onmessage: null, onerror: null, onclose: null, send: data => { sent.push(data) }, close: vi.fn() }
  const context = {
    currentTime: 0, sampleRate: 16000, state: 'running', destination: {},
    resume: async () => {}, close: vi.fn(async () => {}),
    createBuffer: (_channels: number, size: number, rate: number) => ({ duration: size / rate, copyToChannel() {} }),
    createAnalyser: () => ({ fftSize: 512, connect() {}, disconnect() {}, getFloatTimeDomainData(data: Float32Array) { data.fill(0) } }),
    createBufferSource() {
      const source = { buffer: null, onended: null as (() => void) | null, connect() {}, disconnect() {}, start: vi.fn(), stop: vi.fn() }
      sources.push(source)
      return source
    },
  }
  const createChannel = vi.fn((options: Parameters<typeof createVoiceChannel>[0]) => createVoiceChannel({ ...options, createSocket: () => socket }))
  const prepareDevice = vi.fn(async () => direct ? Response.json({ transport: 'direct', url: 'wss://xrobo-io.qiniuapi.com/v1/ws/', deviceId: '02:00:00:00:00:01', clientId: 'synthetic-client', token: 'synthetic-device-token', maxSessionSeconds: 600 }) : Response.json({ transport: 'relay' }))
  const connection = createLiveVoicePort({
    createChannel,
    createPlayer: createPcmPlayer,
    createContext: () => context as unknown as AudioContext,
    openMic: async options => { mic = options; return { stop: stopMic } },
    prepareDevice,
  }, turnTaking).create({
    sessionId: 'synthetic', characterId: 'one', voiceId: null, epoch: 1, signal: abort.signal,
    isCurrent: () => current,
    readContext: () => ({ background: '', characterId: 'one', characterName: 'A', profile: '', history: [], systemPrompt: '' }),
    onEvent: event => events.push(event),
  })
  function receive(value: object | ArrayBuffer) { socket.onmessage?.({ data: value instanceof ArrayBuffer ? value : JSON.stringify(value) }) }
  const opening = connection.open()
  await vi.waitFor(() => expect(socket.onopen).toBeTypeOf('function'))
  socket.onopen?.()
  receive({ type: 'hello', transport: 'websocket', audio_params: { format: 'pcm', channels: 1, sample_rate: 16000 } })
  receive({ type: 'mcp', payload: { id: 'tools', method: 'tools/list' } })
  await opening
  return {
    connection, receive, sources, events, sent, stopMic, socket, createChannel, prepareDevice,
    frame(value: number) { mic!.onFrame(new Uint8Array(640).fill(value)) },
    level(value: number) { mic!.onLevel?.(value) },
    expire() { current = false; abort.abort() },
    binary() { return sent.filter(value => value instanceof Uint8Array) },
    paused() { return events.filter(event => event.type === 'audioLevel').at(-1)?.inputPaused },
  }
}

afterEach(() => vi.useRealTimers())

it('drops frames from TTS start through actual drain and tail guard, retaining only new input', async () => {
  vi.useFakeTimers()
  const f = await fixture()
  try {
    f.frame(1)
    f.receive({ type: 'tts', state: 'start' })
    f.frame(2)
    expect(f.paused()).toBe(true)
    f.receive(new ArrayBuffer(640))
    expect(f.sources).toHaveLength(0)
    f.frame(3)
    vi.advanceTimersByTime(100)
    f.sources[0].onended?.()
    vi.advanceTimersByTime(1000)
    f.level(.5)
    f.frame(4)
    expect(f.paused()).toBe(true)
    f.receive(new ArrayBuffer(640))
    f.receive({ type: 'tts', state: 'stop', is_aborted: false })
    f.frame(5)
    expect(f.sources).toHaveLength(2)
    f.sources[1].onended?.()
    vi.advanceTimersByTime(299)
    f.frame(6)
    expect(f.paused()).toBe(true)
    vi.advanceTimersByTime(1)
    expect(f.paused()).toBe(false)
    f.frame(7)
    expect(f.binary().map(frame => frame[0])).toEqual([1, 7])
    const controls = f.sent.filter(value => typeof value === 'string').map(value => JSON.parse(value))
    expect(controls.filter(value => value.type === 'listen').map(value => value.state)).toEqual(['start'])
    expect(controls.filter(value => value.type === 'abort')).toEqual([])
    expect(f.stopMic).not.toHaveBeenCalled()
  } finally { f.connection.close() }
  expect(vi.getTimerCount()).toBe(0)
})

it('recovers from provider abort and late STT while a new answer cancels pending recovery', async () => {
  vi.useFakeTimers()
  const f = await fixture()
  try {
    f.receive({ type: 'tts', state: 'start' })
    f.receive(new ArrayBuffer(640))
    f.receive({ type: 'tts', state: 'stop', is_aborted: true })
    f.receive({ type: 'stt', text: 'synthetic late result' })
    expect(f.events.some(event => event.type === 'userText')).toBe(true)
    vi.advanceTimersByTime(200)
    f.receive({ type: 'tts', state: 'start' })
    vi.advanceTimersByTime(1000)
    f.frame(1)
    expect(f.binary()).toHaveLength(0)
    f.receive({ type: 'tts', state: 'stop', is_aborted: true })
    vi.advanceTimersByTime(300)
    f.frame(2)
    expect(f.binary().map(frame => frame[0])).toEqual([2])
  } finally { f.connection.close() }
  expect(vi.getTimerCount()).toBe(0)
})

it('does not reopen input when an old normal tail is replaced by a new answer', async () => {
  vi.useFakeTimers()
  const f = await fixture()
  try {
    f.receive({ type: 'tts', state: 'start' })
    f.receive(new ArrayBuffer(640))
    f.receive({ type: 'tts', state: 'stop', is_aborted: false })
    const oldEnd = f.sources[0].onended
    f.receive({ type: 'tts', state: 'start' })
    oldEnd?.()
    vi.advanceTimersByTime(1000)
    f.frame(1)
    expect(f.binary()).toHaveLength(0)
    f.receive({ type: 'tts', state: 'stop', is_aborted: false })
    vi.advanceTimersByTime(300)
    f.frame(2)
    expect(f.binary().map(frame => frame[0])).toEqual([2])
  } finally { f.connection.close() }
})

it.each(['close', 'scope-change'])('keeps late frames and timers closed after %s', async reason => {
  vi.useFakeTimers()
  const f = await fixture()
  try {
    f.receive({ type: 'tts', state: 'start' })
    f.receive({ type: 'tts', state: 'stop', is_aborted: false })
    if (reason === 'close') f.connection.close()
    else f.expire()
    vi.advanceTimersByTime(1000)
    f.frame(1)
    expect(f.binary()).toHaveLength(0)
  } finally { f.connection.close() }
  expect(vi.getTimerCount()).toBe(0)
})

it('retains continuous upload and STT barge-in when the policy is off', async () => {
  vi.useFakeTimers()
  const f = await fixture(false)
  try {
    f.receive({ type: 'tts', state: 'start' })
    f.receive(new ArrayBuffer(640))
    f.frame(1)
    f.receive({ type: 'stt', text: 'synthetic interruption' })
    f.frame(2)
    expect(f.binary().map(frame => frame[0])).toEqual([1, 2])
    expect(f.events.some(event => event.type === 'interrupted')).toBe(true)
    expect(f.paused()).toBeUndefined()
    vi.advanceTimersByTime(1000)
    expect(f.sources).toHaveLength(0)
  } finally { f.connection.close() }
  expect(vi.getTimerCount()).toBe(0)
})

it('does not guess an answer end from idle, and a manually restarted scope accepts new input', async () => {
  vi.useFakeTimers()
  const old = await fixture()
  old.receive({ type: 'tts', state: 'start' })
  old.receive(new ArrayBuffer(640))
  vi.advanceTimersByTime(100)
  old.sources[0].onended?.()
  vi.advanceTimersByTime(2000)
  old.frame(1)
  expect(old.binary()).toHaveLength(0)
  old.connection.close()
  const fresh = await fixture()
  try {
    old.frame(2)
    fresh.frame(3)
    expect(old.binary()).toHaveLength(0)
    expect(fresh.binary().map(frame => frame[0])).toEqual([3])
  } finally { fresh.connection.close(); old.connection.close() }
  expect(vi.getTimerCount()).toBe(0)
})


it('keeps direct turn-taking input blocked until normal stop, real-player drain and the tail guard', async () => {
  vi.useFakeTimers()
  const f = await fixture(true, true)
  try {
    expect(f.prepareDevice).toHaveBeenCalledOnce()
    expect(f.createChannel).toHaveBeenCalledOnce()
    expect(f.createChannel.mock.calls[0][0].directConnection?.url).toBe('wss://xrobo-io.qiniuapi.com/v1/ws/')
    const hello = f.sent.filter(value => typeof value === 'string').map(value => JSON.parse(value)).find(value => value.type === 'hello')
    expect(hello).toMatchObject({ device_id: '02:00:00:00:00:01', token: 'synthetic-device-token', audio_params: { format: 'pcm', sample_rate: 16000 } })
    f.frame(1)
    f.receive({ type: 'tts', state: 'start' })
    f.frame(2)
    f.receive(new ArrayBuffer(640))
    expect(f.sources).toHaveLength(0)
    f.receive({ type: 'tts', state: 'stop', is_aborted: false })
    expect(f.sources).toHaveLength(1)
    vi.advanceTimersByTime(300)
    f.frame(3)
    expect(f.paused()).toBe(true)
    f.sources[0].onended?.()
    vi.advanceTimersByTime(299)
    f.frame(4)
    expect(f.paused()).toBe(true)
    vi.advanceTimersByTime(1)
    f.frame(5)
    expect(f.paused()).toBe(false)
    expect(f.binary().map(frame => frame[0])).toEqual([1, 5])
    f.connection.close()
    f.frame(6)
    expect(f.binary().map(frame => frame[0])).toEqual([1, 5])
    expect(f.stopMic).toHaveBeenCalledOnce()
    expect(f.socket.close).toHaveBeenCalledOnce()
    expect(f.createChannel).toHaveBeenCalledOnce()
  } finally { f.connection.close() }
  expect(vi.getTimerCount()).toBe(0)
})
