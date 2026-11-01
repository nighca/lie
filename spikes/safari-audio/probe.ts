import { openMicrophone } from '../../packages/voice/src/microphone'

export type ProbeMode = 'direct-16k' | 'direct-default' | 'media-16k'
export type ProbePhase = 'preparing' | 'quiet-before' | 'playing' | 'quiet-after' | 'stopped'
type Energy = { frames: number; samples: number; sumSquares: number; peak: number }
type AudioSettings = { echoCancellation: boolean | null; noiseSuppression: boolean | null; autoGainControl: boolean | null; sampleRate: number | null; channelCount: number | null; latency: number | null }
type ContextInfo = { sampleRate: number; state: string }
export type ProbeReport = {
  mode: ProbeMode
  phase: ProbePhase
  settings: AudioSettings | null
  settingsByPhase: Partial<Record<'quiet-before' | 'playing' | 'quiet-after', AudioSettings>>
  contexts: { capture: ContextInfo | null; playback: ContextInfo | null }
  energy: Record<'quiet-before' | 'playing' | 'quiet-after', { frames: number; rms: number; peak: number }>
  cleanup: { tracksEnded: boolean; contextsClosed: boolean } | null
  error: string | null
}

const energy = (): Energy => ({ frames: 0, samples: 0, sumSquares: 0, peak: 0 })

/** Deterministic, quiet, speech-band test signal; never a recording or an ASR test. */
export function createProbeSignal(rate = 16000, seconds = 4) {
  return Float32Array.from({ length: rate * seconds }, (_, i) => {
    const t = i / rate
    const fade = Math.min(1, t / 0.03, (seconds - t) / 0.03)
    const envelope = 0.2 + 0.8 * Math.sin(Math.PI * 3.1 * t) ** 2
    return 0.045 * fade * envelope * (Math.sin(2 * Math.PI * 233 * t) + Math.sin(2 * Math.PI * 677 * t) + Math.sin(2 * Math.PI * 1279 * t))
  })
}

/** Owns only this trial's audio resources. No network, raw PCM retention, or storage. */
export function createAudioProbe(mode: ProbeMode, onUpdate: (report: ProbeReport) => void, dependencies = {
  openMic: openMicrophone,
  createContext: (options?: AudioContextOptions) => new AudioContext(options),
  createAudio: () => { const audio = document.createElement('audio'); document.body.append(audio); return audio },
  getUserMedia: (constraints: MediaStreamConstraints) => navigator.mediaDevices.getUserMedia(constraints),
}) {
  const abort = new AbortController()
  const stats = { 'quiet-before': energy(), playing: energy(), 'quiet-after': energy() }
  const contexts: AudioContext[] = []
  let stream: MediaStream | null = null
  let microphone: Awaited<ReturnType<typeof openMicrophone>> | null = null
  let micReady: Promise<void> | null = null
  let playback: AudioContext | null = null
  let source: AudioBufferSourceNode | null = null
  let silence: ConstantSourceNode | null = null
  let destination: MediaStreamAudioDestinationNode | null = null
  let audio: HTMLAudioElement | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let stopPromise: Promise<void> | null = null
  let started = false
  const report: ProbeReport = { mode, phase: 'preparing', settings: null, settingsByPhase: {}, contexts: { capture: null, playback: null }, energy: { 'quiet-before': { frames: 0, rms: 0, peak: 0 }, playing: { frames: 0, rms: 0, peak: 0 }, 'quiet-after': { frames: 0, rms: 0, peak: 0 } }, cleanup: null, error: null }

  function snapshot(): ProbeReport {
    for (const phase of ['quiet-before', 'playing', 'quiet-after'] as const) {
      const value = stats[phase]
      report.energy[phase] = { frames: value.frames, rms: Math.sqrt(value.sumSquares / Math.max(1, value.samples)), peak: value.peak }
    }
    return structuredClone(report)
  }
  function publish() { onUpdate(snapshot()) }
  function readSettings() {
    if (stream == null || report.phase === 'preparing' || report.phase === 'stopped') return
    const settings = stream.getAudioTracks()[0].getSettings()
    report.settings = { echoCancellation: settings.echoCancellation ?? null, noiseSuppression: settings.noiseSuppression ?? null, autoGainControl: settings.autoGainControl ?? null, sampleRate: settings.sampleRate ?? null, channelCount: settings.channelCount ?? null, latency: (settings as MediaTrackSettings & { latency?: number }).latency ?? null }
    report.settingsByPhase[report.phase] = report.settings
  }
  function phase(next: ProbePhase) { report.phase = next; readSettings(); publish() }
  function contextInfo(context: AudioContext): ContextInfo { return { sampleRate: context.sampleRate, state: context.state } }
  function rememberContext(context: AudioContext, role: 'capture' | 'playback') {
    contexts.push(context)
    report.contexts[role] = contextInfo(context)
    context.addEventListener('statechange', () => { report.contexts[role] = contextInfo(context); publish() }, { signal: abort.signal })
    return context
  }
  function stop() {
    if (stopPromise != null) return stopPromise
    abort.abort()
    if (timer != null) clearTimeout(timer)
    timer = null
    for (const previous of [source, silence]) {
      if (previous == null) continue
      previous.onended = null
      try { previous.stop() } catch { /* A source that failed to start cannot be stopped. */ }
      previous.disconnect()
    }
    source = null; silence = null
    if (audio != null) { audio.pause(); audio.srcObject = null; audio.remove(); audio = null }
    destination?.disconnect()
    for (const track of destination?.stream.getTracks() ?? []) track.stop()
    destination = null
    stopPromise = (async () => {
      await Promise.allSettled([microphone?.stop(), ...contexts.map(async context => { if (context.state !== 'closed') await context.close() })])
      // Permission can resolve after stop; openMicrophone's abort path releases that grant.
      await Promise.allSettled([micReady])
      for (const track of stream?.getTracks() ?? []) track.stop()
      for (const [role, context] of [['capture', contexts[1]], ['playback', playback]] as const) if (context != null) report.contexts[role] = contextInfo(context)
      report.cleanup = { tracksEnded: (stream?.getTracks() ?? []).every(track => track.readyState === 'ended'), contextsClosed: contexts.every(context => context.state === 'closed') }
      phase('stopped')
    })()
    return stopPromise
  }
  function finishPlayback() {
    if (timer != null) clearTimeout(timer)
    source?.disconnect(); source = null
    if (abort.signal.aborted) return
    phase('quiet-after')
    timer = setTimeout(() => { void stop() }, 2000)
  }
  function play() {
    if (abort.signal.aborted || playback == null) return
    try {
      const samples = createProbeSignal()
      const buffer = playback.createBuffer(1, samples.length, 16000)
      buffer.copyToChannel(samples, 0)
      source = playback.createBufferSource()
      source.buffer = buffer
      source.connect(destination ?? playback.destination)
      source.onended = finishPlayback
      phase('playing')
      source.start()
      // Bounded even if a suspended context never delivers onended.
      timer = setTimeout(() => { report.error = 'playback-timeout'; void stop() }, 7000)
    } catch { report.error = 'playback-failed'; void stop() }
  }
  async function start() {
    if (started || abort.signal.aborted) return
    started = true
    timer = setTimeout(() => { report.error = 'initialization-timeout'; void stop() }, 20000)
    try {
      playback = rememberContext(dependencies.createContext(mode === 'direct-default' ? {} : { sampleRate: 16000 }), 'playback')
      let mediaReady: Promise<void> = Promise.resolve()
      if (mode === 'media-16k') {
        destination = playback.createMediaStreamDestination()
        audio = dependencies.createAudio()
        audio.srcObject = destination.stream
        audio.autoplay = true
      }
      // Feed silence in every mode; media play() must not wait for the later test signal.
      silence = playback.createConstantSource()
      silence.offset.value = 0
      silence.connect(destination ?? playback.destination)
      silence.start()
      if (audio != null) mediaReady = audio.play()
      micReady = dependencies.openMic({
        signal: abort.signal,
        async getUserMedia(constraints) {
          stream = await dependencies.getUserMedia(constraints)
          return stream
        },
        createContext: () => rememberContext(dependencies.createContext(), 'capture'),
        onFrame(data) {
          if (abort.signal.aborted || report.phase === 'preparing' || report.phase === 'stopped') return
          const value = stats[report.phase]
          const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
          for (let i = 0; i < view.byteLength; i += 2) {
            const sample = view.getInt16(i, true) / 32768
            value.sumSquares += sample * sample; value.samples++; value.peak = Math.max(value.peak, Math.abs(sample))
          }
          value.frames++
          if (value.frames % 10 === 0) { readSettings(); publish() }
        },
      }).then(async mic => { if (abort.signal.aborted) await mic.stop(); else microphone = mic })
      await Promise.all([micReady, playback.resume(), mediaReady])
      if (abort.signal.aborted) return
      if (timer != null) clearTimeout(timer)
      phase('quiet-before')
      timer = setTimeout(play, 2000)
    } catch (error) {
      if (!abort.signal.aborted) report.error = error instanceof DOMException && ['NotAllowedError', 'NotFoundError', 'NotSupportedError', 'NotReadableError'].includes(error.name) ? error.name : 'audio-initialization-failed'
      await stop()
    }
  }
  return { start, stop, snapshot }
}
