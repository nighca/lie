import { decodePcm16 } from './pcm'
import type { PcmFormat } from './types'

export type PlaybackStopReason = 'manual' | 'stt' | 'tts-aborted' | 'new-answer' | 'close' | 'overflow' | 'playback-error'

/** Times and queue lengths are seconds, except arrivalIntervalMs (enqueue callback timing, not network arrival). */
export type PlaybackObservation = {
  audioTime: number
  contextState: AudioContextState
} & (
  | { type: 'schedule'; arrivalIntervalMs: number | null; sampleCount: number; queueAheadBefore: number; queueAheadAfter: number; startTime: number; endTime: number; renderLead: number; gap: number | null; queueExhausted: boolean }
  | { type: 'stop'; reason: PlaybackStopReason; queuedSources: number; queueAhead: number; pendingSamples: number }
  | { type: 'buffer'; state: 'waiting' | 'pending' | 'threshold' | 'timeout' | 'flush'; pendingSamples: number; queueAhead: number }
  | { type: 'context-state' }
  | { type: 'answer'; state: 'start' | 'stop' | 'aborted' }
)

export type PlaybackObserver = (event: PlaybackObservation) => void

/** The caller owns/resumes the AudioContext and wires interrupted/closed to stop(). */
export function createPcmPlayer(context: AudioContext, onIdle: () => void = () => {}, onLevel?: (level: number) => void, onPlayback?: PlaybackObserver, onError: () => void = () => {}) {
  let nextTime = 0
  let lastArrival: number | null = null
  const pending: { samples: Float32Array<ArrayBuffer>; arrivalIntervalMs: number | null }[] = []
  let bufferTimer: ReturnType<typeof setTimeout> | null = null
  function pendingSamples() { return pending.reduce((sum, chunk) => sum + chunk.samples.length, 0) }
  function clearBufferTimer() {
    const timer = bufferTimer
    bufferTimer = null
    if (timer != null) clearTimeout(timer)
  }
  function observeBuffer(state: 'waiting' | 'pending' | 'threshold' | 'timeout' | 'flush') {
    if (onPlayback != null) observe({ type: 'buffer', state, pendingSamples: pendingSamples(), queueAhead: Math.max(0, nextTime - context.currentTime), audioTime: context.currentTime, contextState: context.state })
  }
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

  function observeStop(reason: PlaybackStopReason) {
    if (onPlayback != null) observe({ type: 'stop', reason, audioTime: context.currentTime, contextState: context.state, queuedSources: sources.size, queueAhead: Math.max(0, nextTime - context.currentTime), pendingSamples: pendingSamples() })
  }

  function clearPlayback() {
    clearBufferTimer()
    pending.length = 0
    for (const source of sources) {
      source.onended = null
      source.stop()
      source.disconnect()
    }
    sources.clear()
    nextTime = 0
    lastArrival = null
    stopMeter()
  }

  function stop(reason: PlaybackStopReason = 'manual') {
    observeStop(reason)
    clearPlayback()
    onIdle()
  }

  function schedule(chunks: typeof pending) {
    const prepared: { source: AudioBufferSourceNode; duration: number; sampleCount: number; arrivalIntervalMs: number | null }[] = []
    try {
      for (const chunk of chunks) {
        const buffer = context.createBuffer(1, chunk.samples.length, 16000)
        buffer.copyToChannel(chunk.samples, 0)
        const source = context.createBufferSource()
        prepared.push({ source, duration: buffer.duration, sampleCount: chunk.samples.length, arrivalIntervalMs: chunk.arrivalIntervalMs })
        source.buffer = buffer
        source.connect(playbackTarget())
        source.onended = () => {
          source.disconnect()
          if (!sources.delete(source)) return
          if (sources.size === 0 && pending.length === 0) { stopMeter(); onIdle() }
        }
      }
      const now = context.currentTime
      for (const chunk of prepared) {
        const previousEnd = nextTime
        // Two default 128-frame render quanta give the control thread a small submission margin.
        const renderLead = previousEnd > now ? 0 : 256 / context.sampleRate
        const startTime = previousEnd > now ? previousEnd : now + renderLead
        chunk.source.start(startTime)
        sources.add(chunk.source)
        nextTime = startTime + chunk.duration
        if (onPlayback != null) observe({
          type: 'schedule', audioTime: now, contextState: context.state,
          arrivalIntervalMs: chunk.arrivalIntervalMs, sampleCount: chunk.sampleCount,
          queueAheadBefore: Math.max(0, previousEnd - now), queueAheadAfter: nextTime - now,
          startTime, endTime: nextTime, renderLead, gap: previousEnd === 0 ? null : Math.max(0, startTime - previousEnd),
          queueExhausted: previousEnd > 0 && previousEnd <= now,
        })
      }
    } catch (error) {
      for (const { source } of prepared) if (!sources.has(source)) {
        source.onended = null
        source.disconnect()
      }
      throw error
    }
  }

  function flushPending(reason: 'threshold' | 'timeout' | 'flush') {
    clearBufferTimer()
    if (pending.length === 0) return
    observeBuffer(reason)
    schedule(pending.splice(0))
  }

  return {
    enqueue(data: Uint8Array, format: PcmFormat) {
      const arrival = onPlayback == null ? null : performance.now()
      if (format.format !== 'pcm' || format.channels !== 1 || format.bitsPerSample !== 16 || format.sampleRate !== 16000) {
        throw new Error('Unsupported playback format')
      }
      const samples = decodePcm16(data)
      if (samples.length === 0) return
      if (Math.max(0, nextTime - context.currentTime) + (pendingSamples() + samples.length) / 16000 > 30) {
        stop('overflow')
        throw new Error('PCM playback queue exceeded 30 seconds')
      }
      const arrivalIntervalMs = arrival == null || lastArrival == null ? null : arrival - lastArrival
      lastArrival = arrival
      if (pending.length === 0 && nextTime > context.currentTime) {
        schedule([{ samples, arrivalIntervalMs }])
        return
      }
      pending.push({ samples, arrivalIntervalMs })
      if (bufferTimer == null) {
        const timer = setTimeout(() => {
          if (bufferTimer !== timer) return
          bufferTimer = null
          try { flushPending('timeout') } catch {
            observeStop('playback-error')
            clearPlayback()
            try { onError() } catch { /* Resource cleanup must survive a failing error consumer. */ }
          }
        }, 100)
        bufferTimer = timer
      }
      observeBuffer(pending.length === 1 ? 'waiting' : 'pending')
      if (pendingSamples() >= 1600) flushPending('threshold')
    },
    /** Schedule any short final tail without waiting for the startup threshold. */
    flush() { flushPending('flush') },
    stop
  }
}
