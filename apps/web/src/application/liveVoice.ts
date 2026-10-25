import { createPcmPlayer, createVoiceChannel, openMicrophone } from '@lie/voice'
import type { PcmFormat, VoiceStartupObservation } from '@lie/voice'

import { VoiceAvailabilityError } from './voice'
import type { VoicePort } from './voice'

export function createLiveVoicePort(dependencies: {
  createChannel: typeof createVoiceChannel
  createPlayer: typeof createPcmPlayer
  openMic: typeof openMicrophone
  createContext: () => AudioContext
  fetchStatus: (signal: AbortSignal) => Promise<Response>
  onStartup?: (event: VoiceStartupObservation & { elapsedMs: number }) => void
  now?: () => number
} = {
  createChannel: createVoiceChannel,
  createPlayer: createPcmPlayer,
  openMic: openMicrophone,
  createContext: () => new AudioContext(),
  fetchStatus: (signal: AbortSignal) => fetch('/api/voice/status', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]) }),
}): VoicePort {
  return {
    create(scope) {
      let startedAt: number | null = null
      let startupFinished = false
      let firstForwarded = false
      let micReady: Promise<void> | null = null
      const observe = dependencies.onStartup == null ? null : (event: VoiceStartupObservation) => {
        try {
          dependencies.onStartup?.({ ...event, elapsedMs: Math.max(0, (dependencies.now ?? performance.now.bind(performance))() - (startedAt ?? 0)) })
        } catch { /* A diagnostic callback cannot affect voice behavior. */ }
      }
      function report(stage: VoiceStartupObservation['stage'], result: VoiceStartupObservation['result']) { observe?.({ stage, result }) }
      function finishStartup(result: VoiceStartupObservation['result']) {
        if (startupFinished) return
        startupFinished = true
        report('startup', result)
      }
      let context: AudioContext | null = null
      let player: ReturnType<typeof createPcmPlayer> | null = null
      let microphone: Awaited<ReturnType<typeof openMicrophone>> | null = null
      let format: PcmFormat | null = null
      let capturing = false
      let closed = false
      let playing = false
      let answerEnded = false
      let answerInProgress = false
      let inputLevel = 0
      let outputLevel = 0
      let inputActive = false
      let inputTransitionAt: number | null = null
      let lastFeedbackAt = -Infinity
      function feedback(force = false) {
        if (!capturing || !current()) return
        const now = performance.now()
        if (!force && now - lastFeedbackAt < 50) return
        lastFeedbackAt = now
        scope.onEvent({ type: 'audioLevel', inputLevel, outputLevel, inputActive })
      }
      function inputMeter(level: number) {
        if (!capturing || !current()) return
        inputLevel = level
        const switching = inputActive ? level < 0.008 : level >= 0.012
        const now = performance.now()
        if (!switching) inputTransitionAt = null
        else if (inputTransitionAt == null) inputTransitionAt = now
        else if (now - inputTransitionAt >= (inputActive ? 350 : 120)) {
          inputActive = !inputActive
          inputTransitionAt = null
        }
        feedback()
      }
      function current() { return !closed && scope.isCurrent() }
      function answerDrained() {
        playing = false
        if (outputLevel !== 0) { outputLevel = 0; feedback(true) }
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
        ...(observe == null ? {} : { onStartup: observe }),
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
          if (event.type === 'closed') { finishStartup('failed'); scope.onEvent({ type: 'closed' }) }
          if (event.type === 'error') {
            finishStartup('failed')
            scope.onEvent(event.code === 'payload-too-large' ? { type: 'error', reason: 'context-too-large' } : { type: 'error' })
          }
        },
      })
      function close() {
        if (closed) return
        closed = true
        finishStartup('cancelled')
        report('cleanup', 'started')
        capturing = false
        channel.close()
        const micStop = microphone?.stop()
        microphone = null
        answerEnded = false
        answerInProgress = false
        player?.stop()
        const contextStop = context != null && context.state !== 'closed' ? context.close() : null
        if (observe != null) void Promise.allSettled([micReady, micStop, contextStop]).then(results => {
          report('cleanup', results.some(result => result.status === 'rejected') ? 'failed' : 'completed')
        })
      }
      return {
        async open() {
          if (observe != null) {
            try { startedAt = (dependencies.now ?? performance.now.bind(performance))() } catch { startedAt = 0 }
          }
          report('startup', 'started')
          try {
            let availability: unknown
            try {
              report('status', 'started')
              const response = await dependencies.fetchStatus(scope.signal)
              report('statusHeaders', 'completed')
              if (!response.ok) throw new Error('Voice status check failed')
              availability = (await response.json())?.status
            } catch {
              report('status', scope.signal.aborted || closed ? 'cancelled' : 'failed')
              throw new VoiceAvailabilityError('check-failed')
            }
            if (!current()) { report('status', 'cancelled'); return }
            if (availability !== 'ready') {
              report('status', 'failed')
              throw new VoiceAvailabilityError(availability === 'unavailable' ? 'unavailable' : 'check-failed')
            }
            report('status', 'completed')
            context = dependencies.createContext()
            player = dependencies.createPlayer(context, answerDrained, (level) => {
              const ended = outputLevel !== 0 && level === 0
              outputLevel = level
              feedback(ended)
            })
            micReady = dependencies.openMic({
              ...(observe == null ? {} : { onStartup: observe }),
              signal: scope.signal,
              onLevel: inputMeter,
              onFrame(data) {
                if (!capturing || !current()) return
                channel.input(data)
                if (!firstForwarded) { firstForwarded = true; report('firstForwardedPcm', 'completed') }
              },
            }).then(async (mic) => {
              if (!current()) await mic.stop()
              else microphone = mic
            })
            report('playbackResume', 'started')
            const playbackReady = context.resume().then(() => report('playbackResume', 'completed'), error => {
              report('playbackResume', scope.signal.aborted || closed ? 'cancelled' : 'failed')
              throw error
            })
            await Promise.all([playbackReady, channel.open({ signal: scope.signal }), micReady])
            if (!current()) return
            channel.startInput()
            report('listenStart', 'completed')
            capturing = true
            finishStartup('completed')
          } catch (error) {
            finishStartup(scope.signal.aborted || closed ? 'cancelled' : 'failed')
            close()
            throw error
          }
        },
        close,
      }
    },
  }
}
