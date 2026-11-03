import { createPcmPlayer, createVoiceChannel, openMicrophone, readDirectVoiceConnection } from '@lie/voice'
import type { DirectVoiceConnection, PcmFormat, PlaybackObserver, PlaybackStopReason, VoiceChannelOptions, VoiceStartupObservation } from '@lie/voice'

import { observeVoicePlayback } from './voicePlaybackDiagnostics'
import { VoiceAvailabilityError } from './voice'
import type { VoicePort } from './voice'

export function createLiveVoicePort(overrides: {
  createChannel: typeof createVoiceChannel
  createPlayer: typeof createPcmPlayer
  openMic: typeof openMicrophone
  createContext: () => AudioContext
  prepareDevice: (signal: AbortSignal) => Promise<Response>
  onPlayback?: PlaybackObserver
  onStartup?: (event: VoiceStartupObservation & { elapsedMs: number }) => void
  now?: () => number
} | null = null, turnTaking = false): VoicePort {
  const dependencies: NonNullable<typeof overrides> = overrides ?? {
    createChannel: createVoiceChannel,
    createPlayer: createPcmPlayer,
    openMic: openMicrophone,
    createContext: () => new AudioContext({ sampleRate: 16000 }),
    ...(import.meta.env.DEV ? { onPlayback: observeVoicePlayback } : {}),
    prepareDevice: (signal: AbortSignal) => fetch('/api/voice/prepare', { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal }),
  }
  let caseAbort = new AbortController()
  let preparation: Promise<DirectVoiceConnection | null> | null = null
  function ensurePrepared(): Promise<DirectVoiceConnection | null> {
    if (preparation != null) return preparation
    const signal = AbortSignal.any([caseAbort.signal, AbortSignal.timeout(20000)])
    preparation = (async () => {
      try {
        signal.throwIfAborted()
        const response = await dependencies.prepareDevice(signal)
        signal.throwIfAborted()
        if (response.status === 503) throw new VoiceAvailabilityError('unavailable')
        if (!response.ok) throw new VoiceAvailabilityError('check-failed')
        const result = await response.json()
        signal.throwIfAborted()
        if (result?.transport === 'relay') return null
        if (result?.transport !== 'direct') throw new VoiceAvailabilityError('check-failed')
        return readDirectVoiceConnection(result)
      } catch (error) {
        throw error instanceof VoiceAvailabilityError ? error : new VoiceAvailabilityError('check-failed')
      }
    })()
    return preparation
  }
  return {
    async prepare() { await ensurePrepared() },
    reset() {
      caseAbort.abort()
      caseAbort = new AbortController()
      preparation = null
    },
    create(scope) {
      let openingStarted = false
      let startedAt: number | null = null
      let startupFinished = false
      let firstForwarded = false
      const caseSignal = caseAbort.signal
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
      let channel: ReturnType<typeof createVoiceChannel> | null = null
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
      let inputPaused = false
      let inputResumeTimer: ReturnType<typeof setTimeout> | null = null
      let inputTransitionAt: number | null = null
      let lastFeedbackAt = -Infinity
      function feedback(force = false) {
        if (!capturing || !current()) return
        const now = performance.now()
        if (!force && now - lastFeedbackAt < 50) return
        lastFeedbackAt = now
        scope.onEvent({ type: 'audioLevel', inputLevel, outputLevel, inputActive, ...(turnTaking ? { inputPaused } : {}) })
      }
      function inputMeter(level: number) {
        if (!capturing || !current() || inputPaused) return
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
      function current() { return !closed && !caseSignal.aborted && !scope.signal.aborted && scope.isCurrent() }
      function cancelInputResume() {
        if (inputResumeTimer != null) clearTimeout(inputResumeTimer)
        inputResumeTimer = null
      }
      function pauseInput() {
        if (!turnTaking) return
        cancelInputResume()
        inputPaused = true
        inputLevel = 0
        inputActive = false
        inputTransitionAt = null
        feedback(true)
      }
      function resumeInputAfterPlayback() {
        if (!inputPaused) return
        cancelInputResume()
        inputResumeTimer = setTimeout(() => {
          inputResumeTimer = null
          if (!capturing || !current() || answerInProgress || playing) return
          inputPaused = false
          feedback(true)
        }, 300)
      }
      function answerDrained() {
        playing = false
        if (outputLevel !== 0) { outputLevel = 0; feedback(true) }
        if (answerEnded && answerInProgress && current()) {
          answerEnded = false
          answerInProgress = false
          scope.onEvent({ type: 'listening' })
          resumeInputAfterPlayback()
        }
      }
      function observeAnswer(state: 'start' | 'stop' | 'aborted') {
        if (context == null || dependencies.onPlayback == null) return
        try { dependencies.onPlayback({ type: 'answer', state, audioTime: context.currentTime, contextState: context.state }) } catch { /* Diagnostics cannot affect conversations. */ }
      }
      function interruptAnswer(reason: PlaybackStopReason) {
        if (!answerInProgress && !playing) return
        answerEnded = false
        answerInProgress = false
        player?.stop(reason)
        playing = false
        scope.onEvent({ type: 'interrupted' })
        resumeInputAfterPlayback()
      }
      const channelOptions: VoiceChannelOptions = {
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
          if (event.type === 'stt') { interruptAnswer('stt'); scope.onEvent({ type: 'userText', text: event.text }) }
          if (event.type === 'tts') {
            if (event.state === 'start') {
              observeAnswer('start')
              if (answerEnded) interruptAnswer('new-answer')
              answerEnded = false
              answerInProgress = true
              pauseInput()
              scope.onEvent({ type: 'speaking' })
            }
            if (event.state === 'sentence' && answerInProgress && event.text != null) { scope.onEvent({ type: 'assistantText', text: event.text }) }
            if (event.state === 'stop') {
              observeAnswer(event.aborted ? 'aborted' : 'stop')
              if (event.aborted) {
                interruptAnswer('tts-aborted')
              } else {
                answerEnded = true
                try { player?.flush() } catch { scope.onEvent({ type: 'error' }); return }
                if (!playing) answerDrained()
              }
            }
          }
          if (event.type === 'audio' && answerInProgress && event.data.byteLength > 0 && format != null) {
            try { playing = true; player!.enqueue(event.data, format) } catch { scope.onEvent({ type: 'error' }) }
          }
          if (event.type === 'closed') {
            finishStartup('failed'); scope.onEvent({ type: 'closed' })
          }
          if (event.type === 'error') {
            finishStartup('failed')
            scope.onEvent(event.code === 'payload-too-large' ? { type: 'error', reason: 'context-too-large' } : { type: 'error' })
          }
        },
      }
      function close() {
        if (closed) return
        closed = true
        cancelInputResume()
        finishStartup('cancelled')
        report('cleanup', 'started')
        capturing = false
        channel?.close()
        const micStop = microphone?.stop()
        microphone = null
        answerEnded = false
        answerInProgress = false
        player?.stop('close')
        const contextStop = context != null && context.state !== 'closed' ? context.close() : null
        if (observe != null) void Promise.allSettled([micReady, micStop, contextStop]).then(results => {
          report('cleanup', results.some(result => result.status === 'rejected') ? 'failed' : 'completed')
        })
      }
      return {
        async open() {
          if (openingStarted) throw new Error('Voice connection can only be opened once')
          openingStarted = true
          if (observe != null) {
            try { startedAt = (dependencies.now ?? performance.now.bind(performance))() } catch { startedAt = 0 }
          }
          report('startup', 'started')
          try {
            if (!current()) return
            report('prepare', 'started')
            let directConnection: DirectVoiceConnection | null
            try { directConnection = await ensurePrepared() }
            catch (error) {
              if (!current()) { report('prepare', 'cancelled'); return }
              report('prepare', 'failed')
              throw error
            }
            if (!current()) { report('prepare', 'cancelled'); return }
            report('prepare', 'completed')
            channel = dependencies.createChannel({ ...channelOptions, ...(directConnection == null ? {} : { directConnection }) })
            context = dependencies.createContext()
            player = dependencies.createPlayer(context, answerDrained, (level) => {
              const ended = outputLevel !== 0 && level === 0
              outputLevel = level
              feedback(ended)
            }, dependencies.onPlayback, () => { if (current()) scope.onEvent({ type: 'error' }) })
            micReady = dependencies.openMic({
              ...(observe == null ? {} : { onStartup: observe }),
              signal: scope.signal,
              onLevel: inputMeter,
              onFrame(data) {
                if (!capturing || !current() || inputPaused) return
                channel!.input(data)
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
            const transportReady = channel.open({ signal: scope.signal })
            await Promise.all([playbackReady, transportReady, micReady])
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
