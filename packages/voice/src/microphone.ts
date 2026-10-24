import { observeStartup } from './startup'
import type { VoiceStartupObserver } from './startup'
import { createPcmEncoder } from './pcm'

const workletSource = `
class LieCapture extends AudioWorkletProcessor {
  process(inputs) {
    const channels = inputs[0];
    if (channels && channels.length) {
      const mono = new Float32Array(channels[0].length);
      for (const channel of channels) {
        for (let i = 0; i < mono.length; i++) mono[i] += channel[i] / channels.length;
      }
      this.port.postMessage(mono, [mono.buffer]);
    }
    return true;
  }
}
registerProcessor('lie-capture', LieCapture);
`

export type MicrophoneOptions = {
  onStartup?: VoiceStartupObserver
  onFrame: (data: Uint8Array) => void
  onLevel?: (level: number) => void
  signal?: AbortSignal
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>
  createContext?: () => AudioContext
  createWorklet?: (context: AudioContext) => AudioWorkletNode
}

/** Requires a secure context and user gesture. Owns its stream/context until stop(). */
export async function openMicrophone(options: MicrophoneOptions): Promise<{ stop: () => Promise<void> }> {
  const { signal } = options
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  const getUserMedia = options.getUserMedia ?? ((constraints) => navigator.mediaDevices.getUserMedia(constraints))
  observeStartup(options.onStartup, 'microphone', 'started')
  const stream = await getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false }).then(stream => {
    observeStartup(options.onStartup, 'microphone', 'completed')
    return stream
  }, error => {
    observeStartup(options.onStartup, 'microphone', signal?.aborted ? 'cancelled' : 'failed')
    throw error
  })
  let context: AudioContext | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let worklet: AudioWorkletNode | null = null
  let gain: GainNode | null = null
  let moduleUrl: string | null = null
  let preparingStage: 'worklet' | 'captureResume' | null = null
  let lastLevelAt = -Infinity
  let stopped = false
  let stopPromise: Promise<void> | null = null

  function stop(): Promise<void> {
    if (stopPromise != null) return stopPromise
    stopped = true
    options.onLevel?.(0)
    signal?.removeEventListener('abort', abort)
    if (worklet != null) {
      worklet.port.onmessage = null
      worklet.port.close()
      worklet.disconnect()
    }
    source?.disconnect()
    gain?.disconnect()
    for (const track of stream.getTracks()) track.stop()
    if (moduleUrl != null) URL.revokeObjectURL(moduleUrl)
    stopPromise = context != null && context.state !== 'closed' ? context.close() : Promise.resolve()
    return stopPromise
  }

  function abort() { void stop() }
  function checkAbort() {
    if (signal?.aborted || stopped) throw new DOMException('Aborted', 'AbortError')
  }

  try {
    checkAbort()
    signal?.addEventListener('abort', abort, { once: true })
    context = (options.createContext ?? (() => new AudioContext()))()
    moduleUrl = URL.createObjectURL(new Blob([workletSource], { type: 'application/javascript' }))
    preparingStage = 'worklet'
    observeStartup(options.onStartup, 'worklet', 'started')
    await context.audioWorklet.addModule(moduleUrl)
    observeStartup(options.onStartup, 'worklet', 'completed')
    preparingStage = null
    checkAbort()
    URL.revokeObjectURL(moduleUrl)
    moduleUrl = null
    const encoder = createPcmEncoder(context.sampleRate, options.onFrame)
    source = context.createMediaStreamSource(stream)
    worklet = (options.createWorklet ?? ((audioContext) => new AudioWorkletNode(audioContext, 'lie-capture')))(context)
    worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (stopped) return
      encoder.push(event.data)
      const now = performance.now()
      if (options.onLevel != null && now - lastLevelAt >= 50) {
        lastLevelAt = now
        const energy = event.data.reduce((sum, sample) => sum + sample * sample, 0)
        options.onLevel(Math.min(1, Math.sqrt(energy / Math.max(1, event.data.length))))
      }
    }
    gain = context.createGain()
    gain.gain.value = 0
    source.connect(worklet)
    worklet.connect(gain)
    gain.connect(context.destination)
    preparingStage = 'captureResume'
    observeStartup(options.onStartup, 'captureResume', 'started')
    await context.resume()
    observeStartup(options.onStartup, 'captureResume', 'completed')
    preparingStage = null
    checkAbort()
    return { stop }
  } catch (error) {
    if (preparingStage != null) observeStartup(options.onStartup, preparingStage, signal?.aborted ? 'cancelled' : 'failed')
    await stop()
    throw error
  }
}
