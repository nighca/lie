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
      let capturing = false
      let closed = false
      let playing = false
      let answerEnded = false
      let answerInProgress = false
      function current() { return !closed && scope.isCurrent() }
      function answerDrained() {
        playing = false
        if (answerEnded && answerInProgress && current()) {
          answerEnded = false
          answerInProgress = false
          scope.onEvent({ type: 'listening' })
        }
      }
      function interruptAnswer() {
        if (!answerInProgress && !playing) return
        answerEnded = false
        answerInProgress = false
        player?.stop()
        playing = false
        scope.onEvent({ type: 'interrupted' })
      }
      const channel = dependencies.createChannel({
        listenMode: 'realtime',
        ...(scope.voiceId != null ? { voiceId: scope.voiceId } : {}),
        tools: [{
          name: 'self.lie_character_context',
          description: '读取当前扮演人物的背景、本人设定与本人的历史。回答玩家前先读取。',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          async execute(_arguments, signal) {
            if (signal.aborted || !current()) throw new Error('Conversation expired')
            return JSON.stringify(scope.readContext())
          },
        }],
        onEvent(event) {
          if (!current()) return
          if (event.type === 'ready') format = event.format
          if (event.type === 'stt') { interruptAnswer(); scope.onEvent({ type: 'userText', text: event.text }) }
          if (event.type === 'tts') {
            if (event.state === 'start') {
              if (answerEnded) interruptAnswer()
              answerEnded = false
              answerInProgress = true
              scope.onEvent({ type: 'speaking' })
            }
            if (event.state === 'sentence' && answerInProgress && event.text != null) { scope.onEvent({ type: 'assistantText', text: event.text }) }
            if (event.state === 'stop') {
              if (event.aborted) {
                interruptAnswer()
              } else {
                answerEnded = true
                if (!playing) answerDrained()
              }
            }
          }
          if (event.type === 'audio' && answerInProgress && event.data.byteLength > 0 && format != null) {
            try { playing = true; player!.enqueue(event.data, format) } catch { scope.onEvent({ type: 'error' }) }
          }
          if (event.type === 'closed') scope.onEvent({ type: 'closed' })
          if (event.type === 'error') scope.onEvent({ type: 'error' })
        },
      })
      function close() {
        if (closed) return
        closed = true
        capturing = false
        channel.close()
        void microphone?.stop()
        microphone = null
        answerEnded = false
        answerInProgress = false
        player?.stop()
        if (context != null && context.state !== 'closed') void context.close()
      }
      return {
        async open() {
          try {
            context = dependencies.createContext()
            player = dependencies.createPlayer(context, answerDrained)
            const micReady = dependencies.openMic({ signal: scope.signal, onFrame(data) { if (capturing && current()) channel.input(data) } }).then(async (mic) => {
              if (!current()) await mic.stop()
              else microphone = mic
            })
            await Promise.all([context.resume(), channel.open({ signal: scope.signal }), micReady])
            if (!current()) return
            channel.startInput()
            capturing = true
          } catch (error) {
            close()
            throw error
          }
        },
        close,
      }
    },
  }
}
