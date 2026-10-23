import { afterEach, describe, expect, it, vi } from 'vitest'

import { createVoiceChannel } from '../src/channel'
import type { VoiceEvent, VoiceSocket, VoiceTool } from '../src/types'

class FakeSocket implements VoiceSocket {
  binaryType: BinaryType = 'blob'
  readyState = 0
  onopen: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: ((event: { code: number; reason: string }) => void) | null = null
  sent: (string | Uint8Array)[] = []
  send(data: string | Uint8Array) { this.sent.push(data) }
  close() { this.readyState = 3 }
  connect() { this.readyState = 1; this.onopen?.() }
  message(data: object | ArrayBuffer) {
    this.onmessage?.({ data: data instanceof ArrayBuffer ? data : JSON.stringify(data) })
  }
  hello() {
    this.message({ type: 'hello', transport: 'websocket', session_id: 'server-session', audio_params: { format: 'pcm', sample_rate: 16000, channels: 1, bits_per_sample: 16 } })
  }
  json() { return this.sent.filter((value): value is string => typeof value === 'string').map((value) => JSON.parse(value)) }
}

function fixture(tools: VoiceTool[] = []) {
  const socket = new FakeSocket()
  const events: VoiceEvent[] = []
  const channel = createVoiceChannel({ createSocket: () => socket, tools, onEvent: (event) => events.push(event), handshakeTimeoutMs: 100, toolTimeoutMs: 50 })
  return { channel, socket, events }
}

async function ready(tools: VoiceTool[] = []) {
  const fixtureValue = fixture(tools)
  const opening = fixtureValue.channel.open()
  fixtureValue.socket.connect()
  fixtureValue.socket.hello()
  await opening
  return fixtureValue
}

function toolCall(socket: FakeSocket, id = 1) {
  socket.message({ type: 'mcp', payload: { id, jsonrpc: '2.0', method: 'tools/call', params: { name: 'context', arguments: { question: 'hello' } } } })
}

afterEach(() => vi.useRealTimers())

describe('Linx voice channel', () => {
  it('negotiates PCM, emits ordered STT/TTS/audio and validates input frames', async () => {
    const { channel, socket, events } = await ready()
    expect(socket.binaryType).toBe('arraybuffer')
    expect(socket.json()[0]).toMatchObject({ type: 'hello', audio_params: { format: 'pcm', sample_rate: 16000, frame_size: 320 } })
    channel.startInput()
    channel.startInput()
    channel.input(new Uint8Array(640))
    expect(() => channel.input(new Uint8Array(10))).toThrow('640')
    channel.stopInput()
    channel.stopInput()
    expect(socket.json().slice(1)).toEqual([
      { type: 'listen', session_id: 'server-session', state: 'start', mode: 'realtime' },
      { type: 'listen', session_id: 'server-session', state: 'stop' }
    ])
    socket.message({ type: 'stt', text: '你在哪里？' })
    socket.message({ type: 'tts', state: 'sentence_start', text: 'not started' })
    socket.message(new ArrayBuffer(2))
    socket.message({ type: 'tts', state: 'start' })
    socket.message({ type: 'tts', state: 'start' })
    socket.message({ type: 'tts', state: 'sentence_start', text: '我在家。' })
    socket.message(new ArrayBuffer(640))
    socket.message({ type: 'tts', state: 'stop' })
    socket.message({ type: 'tts', state: 'stop' })
    socket.message(new ArrayBuffer(2))
    expect(events.map((event) => event.type)).toEqual(['ready', 'stt', 'tts', 'tts', 'audio', 'tts'])
    expect(events[3]).toEqual({ type: 'tts', state: 'sentence', text: '我在家。' })
    channel.close()
  })

  it('closes malformed or unsupported negotiation and rejects opening', async () => {
    const { channel, socket, events } = fixture()
    const opening = channel.open()
    const rejection = expect(opening).rejects.toThrow('Unsupported')
    socket.connect()
    socket.message({ type: 'hello', transport: 'websocket', audio_params: { format: 'opus' } })
    await rejection
    expect(events.map((event) => event.type)).toEqual(['error', 'closed'])
    expect(socket.readyState).toBe(3)
  })

  it('times out opening, supports abort before/after open and closes once', async () => {
    vi.useFakeTimers()
    const { channel, events } = fixture()
    const opening = channel.open()
    const rejection = expect(opening).rejects.toThrow('timed out')
    await vi.advanceTimersByTimeAsync(100)
    await rejection
    channel.close()
    expect(events.filter((event) => event.type === 'closed')).toHaveLength(1)
    const aborted = new AbortController()
    aborted.abort()
    await expect(fixture().channel.open({ signal: aborted.signal })).rejects.toMatchObject({ name: 'AbortError' })
    const next = fixture()
    const controller = new AbortController()
    const pending = next.channel.open({ signal: controller.signal })
    const pendingRejection = expect(pending).rejects.toThrow('Aborted')
    controller.abort()
    await pendingRejection
  })

  it('handles MCP discovery, execution, unknown tools, duplicates and bounded tool timeout', async () => {
    vi.useFakeTimers()
    const execute = vi.fn<VoiceTool['execute']>(async () => 'only this character context')
    const { channel, socket, events } = await ready([{ name: 'context', description: 'Current context', inputSchema: { type: 'object' }, execute }])
    socket.message({ type: 'mcp', payload: { id: 'init', method: 'initialize' } })
    socket.message({ type: 'mcp', payload: { id: 'list', method: 'tools/list' } })
    toolCall(socket)
    toolCall(socket)
    await vi.advanceTimersByTimeAsync(0)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(execute.mock.calls[0]?.[0]).toEqual({ question: 'hello' })
    expect(socket.json().find((value) => value.payload?.id === 'list').payload.result.tools[0].name).toBe('context')
    expect(socket.json().find((value) => value.payload?.id === 1).payload.result).toEqual({ content: [{ type: 'text', text: 'only this character context' }], isError: false })
    socket.message({ type: 'mcp', payload: { id: 'bad', method: 'tools/call', params: { name: 'other' } } })
    expect(socket.json().at(-1).payload.error.code).toBe(-32601)
    expect(events.filter((event) => event.type === 'tool')).toHaveLength(2)
    channel.close()

    const signals: AbortSignal[] = []
    const stalled = await ready([{ name: 'context', description: '', inputSchema: {}, execute: async (_, callSignal) => { signals.push(callSignal); return new Promise(() => {}) } }])
    toolCall(stalled.socket)
    await vi.advanceTimersByTimeAsync(50)
    expect(signals[0]?.aborted).toBe(true)
    expect(stalled.socket.json().at(-1).payload.result.isError).toBe(true)
    expect(stalled.events).toContainEqual({ type: 'error', code: 'tool', message: 'Voice tool failed or timed out' })
    stalled.channel.close()
  })

  it('cancels pending tools on close and drops callbacks from old sockets', async () => {
    let resolveTool: (value: string) => void = () => {}
    const callSignals: AbortSignal[] = []
    const { channel, socket, events } = await ready([{ name: 'context', description: '', inputSchema: {}, execute: (_, signal) => { callSignals.push(signal); return new Promise((resolve) => { resolveTool = resolve }) } }])
    toolCall(socket)
    await Promise.resolve()
    const oldMessage = socket.onmessage!
    channel.close()
    const count = events.length
    expect(callSignals[0]?.aborted).toBe(true)
    resolveTool('late context')
    oldMessage({ data: JSON.stringify({ type: 'stt', text: 'old character' }) })
    await Promise.resolve()
    await Promise.resolve()
    expect(events).toHaveLength(count)
    expect(socket.json().some((value) => value.payload?.result?.content)).toBe(false)
    await expect(channel.open()).rejects.toThrow('once')
  })

  it('aborts an already-ready channel and cancels pending tools without publishing late output', async () => {
    const controller = new AbortController()
    const signals: AbortSignal[] = []
    let resolveTool: (value: string) => void = () => {}
    const { channel, socket, events } = fixture([{
      name: 'context', description: '', inputSchema: {},
      execute: (_, signal) => {
        signals.push(signal)
        return new Promise((resolve) => { resolveTool = resolve })
      }
    }])
    const opening = channel.open({ signal: controller.signal })
    socket.connect()
    socket.hello()
    await opening
    toolCall(socket)
    await Promise.resolve()
    controller.abort()
    expect(signals[0]?.aborted).toBe(true)
    expect(events.at(-1)).toEqual({ type: 'closed', code: 1000, reason: 'Aborted' })
    resolveTool('late result')
    await Promise.resolve()
    await Promise.resolve()
    expect(socket.json().some((value) => value.payload?.result?.content)).toBe(false)
    expect(events.filter((event) => event.type === 'closed')).toHaveLength(1)
    expect(() => channel.startInput()).toThrow('not ready')
  })

  it('notifies immediate interrupt, suppresses cancelled output, and reports unexpected disconnect', async () => {
    const { channel, socket, events } = await ready()
    socket.message({ type: 'tts', state: 'start' })
    channel.interrupt()
    socket.message(new ArrayBuffer(640))
    socket.message({ type: 'tts', state: 'sentence_start', text: 'cancelled' })
    socket.message({ type: 'tts', state: 'start' })
    socket.message({ type: 'tts', state: 'stop' })
    expect(events.map((event) => event.type)).toEqual(['ready', 'tts', 'interrupted'])
    expect(socket.json().at(-1)).toMatchObject({ type: 'abort', session_id: 'server-session' })
    channel.startInput()
    socket.message({ type: 'tts', state: 'start' })
    socket.message(new ArrayBuffer(640))
    expect(events.at(-1)?.type).toBe('audio')
    socket.onclose?.({ code: 1006, reason: 'network lost' })
    expect(events.at(-1)).toEqual({ type: 'closed', code: 1006, reason: 'network lost' })
    expect(() => channel.startInput()).toThrow('not ready')
  })
})
