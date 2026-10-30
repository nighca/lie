import { decodePcm16 } from './pcm'
import type { PcmFormat } from './types'

/** The caller owns/resumes the AudioContext and wires interrupted/closed to stop(). */
export function createPcmPlayer(context: AudioContext, onIdle: () => void = () => {}, onLevel?: (level: number) => void) {
  let nextTime = 0
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

  function stop() {
    for (const source of sources) {
      source.onended = null
      source.stop()
      source.disconnect()
    }
    sources.clear()
    nextTime = 0
    stopMeter()
    onIdle()
  }

  return {
    enqueue(data: Uint8Array, format: PcmFormat) {
      if (format.format !== 'pcm' || format.channels !== 1 || format.bitsPerSample !== 16 || format.sampleRate !== 16000) {
        throw new Error('Unsupported playback format')
      }
      const samples = decodePcm16(data)
      if (samples.length === 0) return
      if (nextTime - context.currentTime > 30) {
        stop()
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
      const startTime = Math.max(context.currentTime + 0.02, nextTime)
      source.start(startTime)
      nextTime = startTime + buffer.duration
    },
    stop
  }
}
