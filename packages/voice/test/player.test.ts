import { afterEach, describe, expect, it, vi } from 'vitest'

import { createPcmPlayer } from '../src/player'

const format = { format: 'pcm' as const, sampleRate: 16000, channels: 1 as const, bitsPerSample: 16 as const, frameDuration: 20 }

function fixture() {
  const sources: { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; onended: (() => void) | null; buffer: AudioBuffer | null }[] = []
  const analyser = { fftSize: 0, connect: vi.fn(), disconnect: vi.fn(), getFloatTimeDomainData: vi.fn((data: Float32Array) => data.fill(0.25)) }
  const context = {
    currentTime: 0, destination: {}, createAnalyser: vi.fn(() => analyser),
    createBuffer: vi.fn(() => ({ duration: 0.02, copyToChannel: vi.fn() })),
    createBufferSource() {
      const source = { connect: vi.fn(), disconnect: vi.fn(), stop: vi.fn(), start: vi.fn(), onended: null as (() => void) | null, buffer: null as AudioBuffer | null }
      sources.push(source)
      return source
    },
  }
  return { context, analyser, sources }
}

afterEach(() => vi.useRealTimers())

describe('PCM playback feedback', () => {
  it('samples the actual analyser signal at 20 Hz and releases it on drain', () => {
    vi.useFakeTimers()
    const { context, analyser, sources } = fixture()
    const onLevel = vi.fn()
    const onIdle = vi.fn()
    const player = createPcmPlayer(context as unknown as AudioContext, onIdle, onLevel)
    player.enqueue(new Uint8Array([0, 0]), format)
    expect(sources[0].connect).toHaveBeenCalledWith(analyser)
    expect(analyser.connect).toHaveBeenCalledWith(context.destination)
    expect(onLevel).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(onLevel.mock.calls).toEqual([[0.25], [0.25]])
    sources[0].onended?.()
    expect(onIdle).toHaveBeenCalledOnce()
    expect(onLevel).toHaveBeenLastCalledWith(0)
    expect(analyser.disconnect).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(200)
    expect(onLevel).toHaveBeenCalledTimes(3)
  })

  it('cancels queued playback and metering on stop and supports later playback', () => {
    vi.useFakeTimers()
    const { context, sources } = fixture()
    const onLevel = vi.fn()
    const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), onLevel)
    player.enqueue(new Uint8Array([0, 0]), format)
    player.stop()
    expect(sources[0].stop).toHaveBeenCalledOnce()
    expect(sources[0].onended).toBeNull()
    vi.advanceTimersByTime(100)
    expect(onLevel.mock.calls).toEqual([[0]])
    player.enqueue(new Uint8Array([0, 0]), format)
    vi.advanceTimersByTime(50)
    expect(onLevel).toHaveBeenLastCalledWith(0.25)
    player.stop()
  })

  it('preserves direct playback when no meter consumer exists', () => {
    const { context, sources } = fixture()
    const player = createPcmPlayer(context as unknown as AudioContext)
    player.enqueue(new Uint8Array([0, 0]), format)
    expect(sources[0].connect).toHaveBeenCalledWith(context.destination)
    expect(context.createAnalyser).not.toHaveBeenCalled()
    player.stop()
  })
})
