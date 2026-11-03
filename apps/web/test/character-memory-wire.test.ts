import { describe, expect, it } from 'vitest'
import { createVoiceChannel } from '@lie/voice'
import type { VoiceSocket } from '@lie/voice'

import { createGameController } from '../src/application/controller'
import { createLiveVoicePort } from '../src/application/liveVoice'
import { game } from './helpers'

class ProviderSocket implements VoiceSocket {
  binaryType: BinaryType = 'blob'
  readyState = 1
  onopen: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: ((event: { code: number; reason: string }) => void) | null = null
  sent: any[] = []
  constructor() { queueMicrotask(() => this.onopen?.()) }
  send(data: string | Uint8Array) {
    if (typeof data !== 'string') return
    const value = JSON.parse(data)
    this.sent.push(value)
    if (value.type === 'hello') {
      this.message({ type: 'hello', transport: 'websocket', session_id: 'synthetic', audio_params: { format: 'pcm', sample_rate: 16000, channels: 1 } })
      this.message({ type: 'mcp', payload: { id: 'list', method: 'tools/list' } })
    }
  }
  message(value: object) { this.onmessage?.({ data: JSON.stringify(value) }) }
  close() { this.readyState = 3 }
  async context(id: string) {
    this.message({ type: 'mcp', payload: { id, method: 'tools/call', params: { name: 'self.lie_character_context', arguments: {} } } })
    for (let index = 0; index < 20; index++) {
      const reply = this.sent.find(value => value.payload?.id === id)
      if (reply) return JSON.parse(reply.payload.result.content[0].text)
      await Promise.resolve()
    }
    throw new Error('Missing context reply')
  }
}

describe('character memory through controller, live bridge and MCP wire', () => {
  it.each([false, true])('restores only A history after A → B → A (pending answer: %s), then clears it in a new session', async pending => {
    const sockets: ProviderSocket[] = []
    const port = createLiveVoicePort({
      createChannel: options => createVoiceChannel({ ...options, createSocket() { const socket = new ProviderSocket(); sockets.push(socket); return socket } }),
      createContext: () => ({ resume: async () => {}, close: async () => {}, state: 'running' }) as unknown as AudioContext,
      createPlayer: () => ({ enqueue() {}, flush() {}, stop() {} }),
      openMic: async () => ({ stop: async () => {} }),
      fetchStatus: async () => new Response(JSON.stringify({ status: 'ready', transport: 'relay' })),
      prepareDevice: async () => new Response(null, { status: 204 }),
    })
    let sequence = 0
    const controller = createGameController({ readGame: async () => game, voice: port, newSessionId: () => `session-${++sequence}`, now: () => 100 })
    try {
      await controller.load('test'); controller.start(); await controller.startConversation()
      sockets[0].message({ type: 'stt', text: '我的暗号是青瓷风铃七二。' })
      sockets[0].message({ type: 'tts', state: 'start' })
      sockets[0].message({ type: 'tts', state: 'sentence_start', text: '我记住了你说的暗号。' })
      if (!pending) sockets[0].message({ type: 'tts', state: 'stop' })
      controller.selectCharacter('two')
      await new Promise(resolve => setTimeout(resolve, 0))
      const b = await sockets[1].context('read-b')
      expect(b.characterId).toBe('two'); expect(b.history).toEqual([])
      sockets[1].message({ type: 'stt', text: '只向乙说的另一个暗号是红木。' })
      controller.selectCharacter('one')
      await new Promise(resolve => setTimeout(resolve, 0))
      sockets[2].message({ type: 'stt', text: '我之前告诉你的暗号是什么？' })
      const a = await sockets[2].context('read-a')
      expect(a.characterId).toBe('one')
      expect(a.history.map((entry: { text: string }) => entry.text)).toEqual(['我的暗号是青瓷风铃七二。', '我记住了你说的暗号。', '我之前告诉你的暗号是什么？'])
      expect(a.history[1].interrupted).toBe(pending)
      expect(sockets[0].readyState).toBe(3); expect(sockets[1].readyState).toBe(3)
      controller.restart(); controller.start(); await controller.startConversation()
      expect((await sockets[3].context('new-session')).history).toEqual([])
    } finally { controller.dispose() }
  })
})
