import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVoiceChannel } from '../../../packages/voice/src/channel'
import type { VoiceSocket } from '../../../packages/voice/src/types'
import { createGameController } from '../../../apps/web/src/application/controller'
import { createLiveVoicePort } from '../../../apps/web/src/application/liveVoice'
import { game } from '../../../apps/web/test/helpers'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
async function settle() { for (let i = 0; i < 30; i++) await Promise.resolve() }
function fixture(pendingMic = false) {
  const sockets: (VoiceSocket & { sent: unknown[]; closeCount: number })[] = []
  const contexts: { closes: number; state: string; resume(): Promise<void>; close(): Promise<void> }[] = []
  const microphones: { stops: number; stop(): Promise<void> }[] = []
  const permission = deferred<{ stop(): Promise<void> }>()
  let starts = 0, sid = 0
  const port = createLiveVoicePort({
    createChannel(options) {
      return createVoiceChannel({ ...options, createSocket() {
        const socket: VoiceSocket & { sent: unknown[]; closeCount: number } = {
          binaryType: 'arraybuffer', readyState: 0, onopen: null, onmessage: null, onerror: null, onclose: null,
          sent: [], closeCount: 0,
          send(value) { this.sent.push(typeof value === 'string' ? JSON.parse(value) : value) },
          close() { this.closeCount++ },
        }
        sockets.push(socket)
        return socket
      } })
    },
    createContext() {
      const context = { closes: 0, state: 'running', async resume() {}, async close() { this.closes++; this.state = 'closed' } }
      contexts.push(context)
      return context as unknown as AudioContext
    },
    createPlayer(_context, drained) { return { enqueue() {}, stop() { drained?.() } } },
    async openMic() {
      starts++
      const mic = { stops: 0, async stop() { this.stops++ } }
      microphones.push(mic)
      return pendingMic ? permission.promise : mic
    },
    async fetchStatus() { return new Response(JSON.stringify({ status: 'ready' })) },
  })
  const controller = createGameController({
    voice: port, readGame: async () => ({ ...game, interrogationLimitSeconds: 2 }),
    newSessionId: () => `s${++sid}`, now: () => Date.now(),
    clock: { now: () => Date.now(), setTimeout, clearTimeout },
  })
  function message(index: number, value: unknown) { sockets[index].onmessage?.({ data: JSON.stringify(value) }) }
  async function ready(index: number) {
    await settle(); const socket = sockets[index]
    expect(socket).toBeDefined(); socket.readyState = 1; socket.onopen?.()
    message(index, { type: 'hello', transport: 'websocket', session_id: `wire${index}`, audio_params: { format: 'pcm', channels: 1, sample_rate: 16000 } })
    message(index, { type: 'mcp', payload: { id: `list${index}`, method: 'tools/list' } })
    await settle()
  }
  return { controller, sockets, contexts, microphones, permission, ready, message, starts: () => starts }
}
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0) })
afterEach(() => { vi.useRealTimers() })

describe('actual controller + live bridge + channel composition, no devices/network', () => {
  it('switches a ready A to pending B, suppresses retained A callbacks and charges only ready intervals', async () => {
    const f = fixture(); await f.controller.load('test'); f.controller.start()
    const openingA = f.controller.startConversation(); await f.ready(0); await openingA
    f.message(0, { type: 'stt', text: 'A question' })
    f.message(0, { type: 'tts', state: 'start' }); f.message(0, { type: 'tts', state: 'sentence_start', text: 'A partial' })
    const oldMessage = f.sockets[0].onmessage!, oldClose = f.sockets[0].onclose!
    await vi.advanceTimersByTimeAsync(300); f.controller.selectCharacter('two'); await settle()
    expect(f.controller.getView()).toMatchObject({ busy: true, currentCharacterId: 'two', history: [], interrogationRemainingMs: 1700 })
    oldMessage({ data: JSON.stringify({ type: 'stt', text: 'late A' }) }); oldClose({ code: 1006, reason: 'late close' })
    await vi.advanceTimersByTimeAsync(500); expect(f.controller.getView().interrogationRemainingMs).toBe(1700)
    await f.ready(1); f.message(1, { type: 'stt', text: 'B question' })
    await vi.advanceTimersByTimeAsync(200); f.controller.endConversation()
    expect(f.controller.getView()).toMatchObject({ voiceStatus: 'idle', conversationActive: false, interrogationRemainingMs: 1500, history: [{ text: 'B question' }] })
    f.controller.selectCharacter('one')
    expect(f.controller.getView().history).toMatchObject([{ text: 'A question' }, { text: 'A partial', interrupted: true }])
    expect(f.contexts.map(c => c.closes)).toEqual([1, 1]); expect(f.microphones.map(m => m.stops)).toEqual([1, 1])
    f.controller.dispose(); expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps partial transcript and spent quota after disconnect, and exposes only that character history to the next tool call', async () => {
    const f = fixture(); await f.controller.load('test'); f.controller.start()
    const first = f.controller.startConversation(); await f.ready(0); await first
    f.message(0, { type: 'stt', text: 'question retained' }); f.message(0, { type: 'tts', state: 'start' })
    f.message(0, { type: 'tts', state: 'sentence_start', text: 'partial retained' })
    await vi.advanceTimersByTimeAsync(400); f.sockets[0].onclose?.({ code: 1006, reason: 'fake disconnect' })
    expect(f.controller.getView()).toMatchObject({ voiceStatus: 'error', conversationActive: false, interrogationRemainingMs: 1600, history: [{ text: 'question retained' }, { text: 'partial retained', interrupted: true }] })
    const second = f.controller.startConversation(); await f.ready(1); await second
    f.message(1, { type: 'mcp', payload: { id: 'context', method: 'tools/call', params: { name: 'self.lie_character_context', arguments: {} } } })
    await settle()
    const reply: any = f.sockets[1].sent.find((v: any) => v.payload?.id === 'context')
    const context = JSON.parse(reply.payload.result.content[0].text)
    expect(context.characterId).toBe('one'); expect(context.history.map((v: any) => v.text)).toEqual(['question retained', 'partial retained'])
    await vi.advanceTimersByTimeAsync(1600)
    expect(f.controller.getView()).toMatchObject({ conversationActive: false, accusationOpen: true, interrogationRemainingMs: 0 })
    f.controller.dispose(); expect(vi.getTimerCount()).toBe(0)
  })

  it('disposes after transport readiness but before microphone permission resolves and stops the late device exactly once', async () => {
    const f = fixture(true); await f.controller.load('test'); f.controller.start()
    const opening = f.controller.startConversation(); await f.ready(0)
    expect(f.controller.getView()).toMatchObject({ busy: true, conversationActive: true, interrogationRemainingMs: 2000 })
    f.controller.dispose(); expect(f.sockets[0].closeCount).toBe(1); expect(f.contexts[0].closes).toBe(1)
    f.permission.resolve(f.microphones[0]); await opening; await settle()
    expect(f.microphones[0].stops).toBe(1); expect(f.starts()).toBe(1)
    expect(f.controller.getView()).toMatchObject({ busy: false, conversationActive: false, interrogationRemainingMs: 2000 })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('fails an uncompleted handshake without charging quota or leaking capture resources', async () => {
    const f = fixture(); await f.controller.load('test'); f.controller.start()
    const opening = f.controller.startConversation(); await settle()
    expect(f.sockets).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(10000); await opening
    expect(f.controller.getView()).toMatchObject({ busy: false, conversationActive: false, voiceStatus: 'error', interrogationRemainingMs: 2000, history: [] })
    expect(f.sockets[0].closeCount).toBe(1); expect(f.contexts[0].closes).toBe(1); expect(f.microphones[0].stops).toBe(1)
    f.controller.dispose(); expect(vi.getTimerCount()).toBe(0)
  })

})
