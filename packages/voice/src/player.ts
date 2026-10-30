import { decodePcm16 } from './pcm'
import type { PcmFormat } from './types'

export type PlaybackStopReason = 'manual' | 'stt' | 'tts-aborted' | 'new-answer' | 'close' | 'overflow'

/** Times and queue lengths are seconds, except arrivalIntervalMs (enqueue callback timing, not network arrival). */
export type PlaybackObservation = {
  audioTime: number
  contextState: AudioContextState
} & (
  | { type: 'schedule'; arrivalIntervalMs: number | null; sampleCount: number; queueAheadBefore: number; queueAheadAfter: number; startTime: number; endTime: number; gap: number | null; queueExhausted: boolean }
  | { type: 'stop'; reason: PlaybackStopReason; queuedSources: number; queueAhead: number }
  | { type: 'context-state' }
  | { type: 'answer'; state: 'start' | 'stop' | 'aborted' }
)

export type PlaybackObserver = (event: PlaybackObservation) => void

/** The caller owns/resumes the AudioContext and wires interrupted/closed to stop(). */
export function createPcmPlayer(context: AudioContext, onIdle: () => void = () => {}, onLevel?: (level: number) => void, onPlayback?: PlaybackObserver) {
  let nextTime = 0
  let lastArrival: number | null = null
  function observe(event: PlaybackObservation) {
    try { onPlayback?.(event) } catch { /* Diagnostics cannot affect playback. */ }
  }
  function contextChanged() {
    observe({ type: 'context-state', audioTime: context.currentTime, contextState: context.state })
    if (context.state === 'closed') context.removeEventListener('statechange', contextChanged)
  }
  if (onPlayback != null && context.state !== 'closed') context.addEventListener('statechange', contextChanged)
  const sources = new Set<AudioBufferSourceNode>()
  let analyser: AnalyserNode | null = null
  let sampler: ReturnType<typeof setInterval> | null = null

  function stopMeter() {
    if (sampler != null) clearInterval(sampler)
    sampler = null
    analyser?.disconnect()
    analyser = null
    onLevel?.(0)
  }

  function playbackTarget(): AudioNode {
    if (onLevel == null) return context.destination
    if (analyser == null) {
      analyser = context.createAnalyser()
      analyser.fftSize = 512
      analyser.connect(context.destination)
      const samples = new Float32Array(analyser.fftSize)
      sampler = setInterval(() => {
        analyser!.getFloatTimeDomainData(samples)
        const energy = samples.reduce((sum, sample) => sum + sample * sample, 0)
        onLevel(Math.min(1, Math.sqrt(energy / samples.length)))
      }, 50)
    }
    return analyser
  }

  function stop(reason: PlaybackStopReason = 'manual') {
    if (onPlayback != null) observe({ type: 'stop', reason, audioTime: context.currentTime, contextState: context.state, queuedSources: sources.size, queueAhead: Math.max(0, nextTime - context.currentTime) })
    for (const source of sources) {
      source.onended = null
      source.stop()
      source.disconnect()
    }
    sources.clear()
    nextTime = 0
    lastArrival = null
    stopMeter()
    onIdle()
  }

  return {
    enqueue(data: Uint8Array, format: PcmFormat) {
      const arrival = onPlayback == null ? null : performance.now()
      if (format.format !== 'pcm' || format.channels !== 1 || format.bitsPerSample !== 16 || format.sampleRate !== 16000) {
        throw new Error('Unsupported playback format')
      }
      const samples = decodePcm16(data)
      if (samples.length === 0) return
      if (nextTime - context.currentTime > 30) {
        stop('overflow')
        throw new Error('PCM playback queue exceeded 30 seconds')
      }
      const buffer = context.createBuffer(1, samples.length, format.sampleRate)
      buffer.copyToChannel(samples, 0)
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(playbackTarget())
      sources.add(source)
      source.onended = () => {
        source.disconnect()
        sources.delete(source)
        if (sources.size === 0) { stopMeter(); onIdle() }
      }
      const now = context.currentTime
      const previousEnd = nextTime
      const startTime = previousEnd > now ? previousEnd : now + 0.02
      source.start(startTime)
      nextTime = startTime + buffer.duration
      if (onPlayback != null && arrival != null) {
        observe({
          type: 'schedule', audioTime: now, contextState: context.state,
          arrivalIntervalMs: lastArrival == null ? null : arrival - lastArrival,
          sampleCount: samples.length, queueAheadBefore: Math.max(0, previousEnd - now),
          queueAheadAfter: nextTime - now, startTime, endTime: nextTime,
          gap: previousEnd === 0 ? null : Math.max(0, startTime - previousEnd),
          queueExhausted: previousEnd > 0 && previousEnd <= now,
        })
        lastArrival = arrival
      }
    },
    stop
  }
}
