import { createPcmPlayer, createVoiceChannel, openMicrophone } from '@lie/voice'
import type { PcmFormat } from '@lie/voice'

import type { VoicePort } from './voice'

export function createLiveVoicePort(dependencies = {
  createChannel: createVoiceChannel,
  createPlayer: createPcmPlayer,
  openMic: openMicrophone,
  createContext: () => new AudioContext(),
}): VoicePort {
  return {
    create(scope) {
      let context: AudioContext | null = null
      let player: ReturnType<typeof createPcmPlayer> | null = null
      let microphone: Awaited<ReturnType<typeof openMicrophone>> | null = null
      let format: PcmFormat | null = null
      let playing = false
      let answerEnded = false
      const channel = dependencies.createChannel({
        listenMode: 'manual',
        tools: [{
          name: 'self.lie_character_context',
          description: '读取当前扮演人物的背景、本人设定与本人的历史。回答玩家前先读取。',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          async execute(_arguments, signal) {
            if (signal.aborted || !scope.isCurrent()) throw new Error('Conversation expired')
            return JSON.stringify(scope.readContext())
          },
        }],
        onEvent(event) {
          if (!scope.isCurrent()) return
          if (event.type === 'ready') format = event.format
          if (event.type === 'stt') scope.onEvent({ type: 'userText', text: event.text })
          if (event.type === 'tts') {
            if (event.state === 'start') { answerEnded = false; scope.onEvent({ type: 'speaking' }) }
            if (event.state === 'sentence' && event.text != null) scope.onEvent({ type: 'assistantText', text: event.text })
            if (event.state === 'stop') { answerEnded = true; if (!playing) scope.onEvent({ type: 'idle' }) }
          }
          if (event.type === 'audio' && event.data.byteLength > 0 && format != null) {
            try { playing = true; player!.enqueue(event.data, format) } catch { scope.onEvent({ type: 'error' }) }
          }
          if (event.type === 'closed') scope.onEvent({ type: 'closed' })
          if (event.type === 'error') scope.onEvent({ type: 'error' })
        },
      })
      return {
        async open() {
          context = dependencies.createContext()
          player = dependencies.createPlayer(context, () => { playing = false; if (answerEnded && scope.isCurrent()) scope.onEvent({ type: 'idle' }) })
          await context.resume()
          if (!scope.isCurrent()) return
          await channel.open({ signal: scope.signal })
        },
        async startInput() {
          channel.startInput()
          microphone = await dependencies.openMic({ signal: scope.signal, onFrame(data) { if (scope.isCurrent()) channel.input(data) } })
          if (!scope.isCurrent()) { await microphone.stop(); microphone = null }
        },
        finishInput() {
          void microphone?.stop()
          microphone = null
          channel.stopInput()
        },
        close() {
          channel.close()
          void microphone?.stop()
          microphone = null
          player?.stop()
          if (context != null && context.state !== 'closed') void context.close()
        },
      }
    },
  }
}
