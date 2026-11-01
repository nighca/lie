import { afterEach, describe, expect, it, vi } from 'vitest'

import { openMicrophone } from '../../packages/voice/src/microphone'
import { createAudioProbe, createProbeSignal } from './probe'
import type { ProbeMode, ProbeReport } from './probe'

function fixture(mode: ProbeMode = 'direct-16k') {
  const rows: ProbeReport[] = []
  const track = { readyState: 'live', stop: vi.fn(() => { track.readyState = 'ended' }), getSettings: () => ({ echoCancellation: true, sampleRate: 48000, channelCount: 1, get deviceId() { throw Error('must not read identifiers') } }) }
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] }
  const routeTrack = { readyState: 'live', stop: vi.fn(() => { routeTrack.readyState = 'ended' }) }
  const route = { stream: { getTracks: () => [routeTrack] }, disconnect: vi.fn() }
  const worklet = { port: { onmessage: null as ((event: { data: Float32Array }) => void) | null, close: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }
  const source = { buffer: null, onended: null as (() => void) | null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(() => { endTimer = setTimeout(() => source.onended?.(), 4000) }), stop: vi.fn(() => clearTimeout(endTimer)) }
  const silence = { offset: { value: 1 }, onended: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() }
  let endTimer: ReturnType<typeof setTimeout>
  const contexts: { sampleRate: number; state: string; destination: object; close: ReturnType<typeof vi.fn> }[] = []
  const createContext = vi.fn((options?: AudioContextOptions) => {
    const context = Object.assign(new EventTarget(), {
      sampleRate: options?.sampleRate ?? 48000, state: 'running', destination: {},
      resume: vi.fn(async () => {}), close: vi.fn(async () => { context.state = 'closed' }),
      audioWorklet: { addModule: async () => {} },
      createMediaStreamSource: () => ({ connect() {}, disconnect() {} }),
      createGain: () => ({ gain: { value: 1 }, connect() {}, disconnect() {} }),
      createBuffer: (_channels: number, length: number, sampleRate: number) => ({ length, sampleRate, copyToChannel: vi.fn() }),
      createBufferSource: () => source,
      createConstantSource: () => silence,
      createMediaStreamDestination: () => route,
    })
    contexts.push(context)
    return context as unknown as AudioContext
  })
  const audio = { srcObject: null, autoplay: false, play: vi.fn(async () => {}), pause: vi.fn(), remove: vi.fn() }
  const dependencies = {
    createContext,
    openMic: (options: Parameters<typeof openMicrophone>[0]) => openMicrophone({ ...options, createWorklet: () => worklet as unknown as AudioWorkletNode }),
    createAudio: () => audio as unknown as HTMLAudioElement,
    getUserMedia: vi.fn(async (_constraints: MediaStreamConstraints) => stream as unknown as MediaStream),
  }
  const probe = createAudioProbe(mode, row => rows.push(row), dependencies)
  return { probe, dependencies, track, routeTrack, route, source, silence, contexts, audio, rows, sample: () => worklet.port.onmessage?.({ data: new Float32Array(960).fill(0.25) }) }
}

afterEach(() => vi.useRealTimers())

describe('local-only Safari audio probe', () => {
  it.each(['direct-16k', 'direct-default', 'media-16k'] as const)('measures %s with a single output route and releases resources', async mode => {
    vi.useFakeTimers()
    const f = fixture(mode)
    await f.probe.start()
    expect(f.dependencies.getUserMedia).toHaveBeenCalledExactlyOnceWith({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false })
    expect(f.contexts.map(value => value.sampleRate)).toEqual([mode === 'direct-default' ? 48000 : 16000, 48000])
    f.sample()
    await vi.advanceTimersByTimeAsync(2000)
    f.sample()
    expect(f.source.connect).toHaveBeenCalledExactlyOnceWith(mode === 'media-16k' ? f.route : f.contexts[0].destination)
    expect(f.silence.connect).toHaveBeenCalledExactlyOnceWith(mode === 'media-16k' ? f.route : f.contexts[0].destination)
    expect(f.silence.offset.value).toBe(0)
    if (mode === 'media-16k') expect(f.audio.play).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(4000)
    f.sample()
    await vi.advanceTimersByTimeAsync(2000)
    const report = f.probe.snapshot()
    expect(report.phase).toBe('stopped')
    expect(report.error).toBeNull()
    expect(report.settings).toEqual({ echoCancellation: true, noiseSuppression: null, autoGainControl: null, sampleRate: 48000, channelCount: 1, latency: null })
    for (const phase of ['quiet-before', 'playing', 'quiet-after'] as const) expect(report.energy[phase]).toEqual({ frames: 1, rms: 0.25, peak: 0.25 })
    expect(report.cleanup).toEqual({ tracksEnded: true, contextsClosed: true })
    expect(f.track.readyState).toBe('ended')
    expect(f.silence.stop).toHaveBeenCalledOnce()
    expect(f.contexts.every(value => value.state === 'closed')).toBe(true)
    if (mode === 'media-16k') {
      expect(f.routeTrack.readyState).toBe('ended')
      expect(f.audio.srcObject).toBeNull()
      expect(f.audio.remove).toHaveBeenCalledOnce()
    }
    await vi.advanceTimersByTimeAsync(10000)
    expect(f.probe.snapshot().error).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    await f.probe.stop()
  })

  it('releases a late permission grant after cancellation without starting playback', async () => {
    vi.useFakeTimers()
    const f = fixture()
    let grant!: (stream: MediaStream) => void
    f.dependencies.getUserMedia.mockImplementation(() => new Promise(resolve => { grant = resolve }))
    const starting = f.probe.start()
    const stopping = f.probe.stop()
    grant({ getTracks: () => [f.track], getAudioTracks: () => [f.track] } as unknown as MediaStream)
    await Promise.all([starting, stopping])
    expect(f.source.start).not.toHaveBeenCalled()
    expect(f.track.readyState).toBe('ended')
    expect(f.probe.snapshot().cleanup).toEqual({ tracksEnded: true, contextsClosed: true })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cleans up media playback rejection and sanitizes errors without retaining content', async () => {
    vi.useFakeTimers()
    const f = fixture('media-16k')
    f.audio.play.mockRejectedValue(new DOMException('private seed', 'NotAllowedError'))
    await f.probe.start()
    expect(f.probe.snapshot()).toMatchObject({ phase: 'stopped', error: 'NotAllowedError', cleanup: { tracksEnded: true, contextsClosed: true } })
    expect(JSON.stringify(f.rows)).not.toContain('private seed')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('bounds playback that never ends and accepts only one start', async () => {
    vi.useFakeTimers()
    const f = fixture()
    f.source.start.mockImplementation(() => {})
    await f.probe.start(); await f.probe.start()
    expect(f.dependencies.getUserMedia).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(9000)
    expect(f.probe.snapshot()).toMatchObject({ phase: 'stopped', error: 'playback-timeout', cleanup: { tracksEnded: true, contextsClosed: true } })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('continues cleanup when a source fails both start and stop', async () => {
    vi.useFakeTimers()
    const f = fixture('media-16k')
    f.source.start.mockImplementation(() => { throw new DOMException('start failed', 'InvalidStateError') })
    f.source.stop.mockImplementation(() => { throw new DOMException('never started', 'InvalidStateError') })
    await f.probe.start()
    await vi.advanceTimersByTimeAsync(2000)
    expect(f.probe.snapshot()).toMatchObject({ phase: 'stopped', error: 'playback-failed', cleanup: { tracksEnded: true, contextsClosed: true } })
    expect(f.audio.remove).toHaveBeenCalledOnce()
    expect(f.routeTrack.readyState).toBe('ended')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reads active settings again for each phase and reports failed context cleanup honestly', async () => {
    vi.useFakeTimers()
    const f = fixture()
    await f.probe.start()
    vi.spyOn(f.track, 'getSettings').mockReturnValue({ echoCancellation: false, sampleRate: 48000, channelCount: 1, get deviceId() { throw Error('must not read identifiers') } })
    await vi.advanceTimersByTimeAsync(2000)
    expect(f.probe.snapshot().settingsByPhase['quiet-before']?.echoCancellation).toBe(true)
    expect(f.probe.snapshot().settingsByPhase.playing?.echoCancellation).toBe(false)
    f.contexts[0].close.mockRejectedValue(new Error('close failed'))
    await f.probe.stop()
    expect(f.probe.snapshot().cleanup).toEqual({ tracksEnded: true, contextsClosed: false })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('uses a deterministic bounded synthetic signal with a silent onset', () => {
    const samples = createProbeSignal()
    expect(samples).toHaveLength(64000)
    expect(samples[0]).toBe(0)
    expect(samples.every(value => Number.isFinite(value) && Math.abs(value) <= 0.135)).toBe(true)
    expect(createProbeSignal()).toEqual(samples)
  })
})
