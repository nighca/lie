import { createPcmPlayer, createVoiceChannel, openMicrophone } from '@lie/voice'
import type { PcmFormat, PlaybackObserver, PlaybackStopReason, VoiceStartupObservation } from '@lie/voice'

import { observeVoicePlayback } from './voicePlaybackDiagnostics'
import { VoiceAvailabilityError } from './voice'
import type { VoicePort } from './voice'

export function createLiveVoicePort(overrides: {
  createChannel: typeof createVoiceChannel
  createPlayer: typeof createPcmPlayer
  openMic: typeof openMicrophone
  createContext: () => AudioContext
  fetchStatus: (signal: AbortSignal) => Promise<Response>
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
    fetchStatus: (signal: AbortSignal) => fetch('/api/voice/status', { credentials: 'same-origin', cache: 'no-store', signal }),
    prepareDevice: (signal: AbortSignal) => fetch('/api/voice/prepare', { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal }),
  }
  let generation = 0
  let preparedGeneration: number | null = null
  let pending: { generation: number; promise: Promise<number> } | null = null
  async function prepareAttempt() {
    const signal = AbortSignal.timeout(20000)
    async function status() {
      const response = await dependencies.fetchStatus(signal)
      if (!response.ok) throw new VoiceAvailabilityError('check-failed')
      const result = await response.json()
      if (result?.status !== 'ready') throw new VoiceAvailabilityError(result?.status === 'unavailable' ? 'unavailable' : 'check-failed')
    }
    try {
      await status()
      let response = await dependencies.prepareDevice(signal)
      if (response.status === 409) {
        if ((await response.json())?.error !== 'identity-required') throw new VoiceAvailabilityError('check-failed')
        await status()
        response = await dependencies.prepareDevice(signal)
      }
      if (response.status !== 204) throw new VoiceAvailabilityError('check-failed')
    } catch (error) {
      throw error instanceof VoiceAvailabilityError ? error : new VoiceAvailabilityError('check-failed')
    }
  }
  function ensurePrepared(): Promise<number> {
    if (preparedGeneration === generation) return Promise.resolve(generation)
    if (pending != null) return pending.promise
    const attempt = ++generation
    const promise = prepareAttempt().then(() => {
      if (generation === attempt) preparedGeneration = attempt
      if (pending?.generation === attempt) pending = null
      return attempt
    }, error => {
      if (pending?.generation === attempt) pending = null
      throw error
    })
    pending = { generation: attempt, promise }
    return promise
  }
  function invalidatePrepared(attempt: number | null) {
    if (attempt == null || generation !== attempt || preparedGeneration !== attempt) return
    preparedGeneration = null
    generation++
  }
  return {
    async prepare() { await ensurePrepared() },
    create(scope) {
      let startedAt: number | null = null
      let startupFinished = false
      let firstForwarded = false
      let preparationGeneration: number | null = null
      let channelReady = false
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
      function current() { return !closed && scope.isCurrent() }
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
          if (event.type === 'ready') { format = event.format; channelReady = true }
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
            if (!channelReady) invalidatePrepared(preparationGeneration)
            finishStartup('failed'); scope.onEvent({ type: 'closed' })
          }
          if (event.type === 'error') {
            if (!channelReady) invalidatePrepared(preparationGeneration)
            finishStartup('failed')
            scope.onEvent(event.code === 'payload-too-large' ? { type: 'error', reason: 'context-too-large' } : { type: 'error' })
          }
        },
      })
      function close() {
        if (closed) return
        closed = true
        cancelInputResume()
        finishStartup('cancelled')
        report('cleanup', 'started')
        capturing = false
        channel.close()
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
          if (observe != null) {
            try { startedAt = (dependencies.now ?? performance.now.bind(performance))() } catch { startedAt = 0 }
          }
          report('startup', 'started')
          try {
            if (!current()) return
            report('status', 'started')
            try { preparationGeneration = await ensurePrepared() }
            catch (error) {
              if (!current()) { report('status', 'cancelled'); return }
              report('status', 'failed')
              throw error
            }
            if (!current()) { report('status', 'cancelled'); return }
            report('status', 'completed')
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
            const transportReady = channel.open({ signal: scope.signal }).then(() => { channelReady = true }, error => {
              if (current()) invalidatePrepared(preparationGeneration)
              throw error
            })
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
