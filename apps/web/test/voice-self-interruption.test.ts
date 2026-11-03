import { describe, expect, it, vi } from 'vitest'
import { createVoiceChannel } from '@lie/voice'
import type { MicrophoneOptions, VoiceSocket } from '@lie/voice'

import { createLiveVoicePort } from '../src/application/liveVoice'

describe('self-interruption event-path investigation (synthetic audio only)', () => {
  it.each(['我在乎。', '等一下，我想问另一件事。'])('attributes provider STT %s to input while retaining barge-in', async (text) => {
    const sent: (string | Uint8Array)[] = []
    const socket: VoiceSocket = {
      binaryType: 'blob', readyState: 1,
      onopen: null, onmessage: null, onerror: null, onclose: null,
      send: data => { sent.push(data) }, close: vi.fn(),
    }
    function receive(value: object | ArrayBuffer) {
      socket.onmessage?.({ data: value instanceof ArrayBuffer ? value : JSON.stringify(value) })
    }
    let capture: MicrophoneOptions | null = null
    const onEvent = vi.fn()
    const micStop = vi.fn(async () => {})
    const player = { enqueue: vi.fn(), flush: vi.fn(), stop: vi.fn() }
    const context = { state: 'running', resume: async () => {}, close: async () => {} }
    const connection = createLiveVoicePort({
      createChannel: options => createVoiceChannel({ ...options, createSocket: () => socket }),
      createContext: () => context as unknown as AudioContext,
      createPlayer: () => player,
      openMic: async options => { capture = options; return { stop: micStop } },
      fetchStatus: async () => Response.json({ status: 'ready', transport: 'relay' }),
      prepareDevice: async () => new Response(null, { status: 204 }),
    }).create({
      sessionId: 'offline', characterId: 'one', voiceId: null, epoch: 1,
      signal: new AbortController().signal, isCurrent: () => true,
      readContext: () => ({ background: '', characterId: 'one', characterName: '甲', profile: '', history: [], systemPrompt: '' }),
      onEvent,
    })
    try {
      const opening = connection.open()
      await vi.waitFor(() => expect(socket.onopen).toBeTypeOf('function'))
      socket.onopen?.()
      receive({ type: 'hello', transport: 'websocket', audio_params: { format: 'pcm', channels: 1, sample_rate: 16000 } })
      receive({ type: 'mcp', payload: { id: 'tools', method: 'tools/list' } })
      await opening
      receive({ type: 'tts', state: 'start' })
      receive({ type: 'tts', state: 'sentence_start', text: '我在乎。' })
      receive(new ArrayBuffer(640))
      expect(onEvent).toHaveBeenLastCalledWith({ type: 'assistantText', text: '我在乎。' })
      expect(player.enqueue).toHaveBeenCalledOnce()
      const mic = capture as unknown as MicrophoneOptions
      const now = vi.spyOn(performance, 'now')
      try {
        now.mockReturnValue(0); mic.onLevel?.(0.5)
        now.mockReturnValue(150); mic.onLevel?.(0.5)
        expect(onEvent).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'audioLevel', inputActive: true }))
      } finally { now.mockRestore() }
      mic.onFrame(new Uint8Array(640))
      expect(sent.filter(value => value instanceof Uint8Array)).toHaveLength(1)
      expect(player.stop).not.toHaveBeenCalled()
      expect(onEvent.mock.calls.flat().filter(event => event.type === 'userText')).toEqual([])

      onEvent.mockClear()
      receive({ type: 'stt', text })
      expect(player.stop).toHaveBeenCalledExactlyOnceWith('stt')
      expect(onEvent.mock.calls).toEqual([[{ type: 'interrupted' }], [{ type: 'userText', text }]])
      mic.onFrame(new Uint8Array(640))
      expect(sent.filter(value => value instanceof Uint8Array)).toHaveLength(2)
      expect(micStop).not.toHaveBeenCalled()
    } finally { connection.close() }
    expect(micStop).toHaveBeenCalledOnce()
  })
})
