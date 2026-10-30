import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PlaybackObservation } from '../src/player'
import { createPcmPlayer } from '../src/player'

const format = { format: 'pcm' as const, sampleRate: 16000, channels: 1 as const, bitsPerSample: 16 as const, frameDuration: 20 }

function fixture() {
  const sources: { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; onended: (() => void) | null; buffer: AudioBuffer | null }[] = []
  const analyser = { fftSize: 0, connect: vi.fn(), disconnect: vi.fn(), getFloatTimeDomainData: vi.fn((data: Float32Array) => data.fill(0.25)) }
  const context = {
    currentTime: 0, state: 'running', addEventListener: vi.fn(), removeEventListener: vi.fn(), destination: {}, createAnalyser: vi.fn(() => analyser),
    createBuffer: vi.fn((_channels: number, length: number, rate: number) => ({ duration: length / rate, copyToChannel: vi.fn() })),
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


describe('PCM continuous scheduling', () => {
  it('joins a future queue without imposing a new startup delay on each chunk', () => {
    const { context, sources } = fixture()
    const events: PlaybackObservation[] = []
    const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), () => {}, event => events.push(event))
    player.enqueue(new Uint8Array(640), format)
    context.currentTime = 0.03
    player.enqueue(new Uint8Array(640), format)
    expect(sources.map(source => source.start.mock.calls[0][0])).toEqual([0.02, 0.04])
    expect(events.at(-1)).toMatchObject({ type: 'schedule', startTime: 0.04, endTime: 0.06, gap: 0, queueExhausted: false, sampleCount: 320 })
    player.stop()
  })

  it('reanchors an exhausted queue to the actual restart and keeps subsequent chunks adjacent', () => {
    const { context, sources } = fixture()
    const events: PlaybackObservation[] = []
    const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), () => {}, event => events.push(event))
    player.enqueue(new Uint8Array(640), format)
    context.currentTime = 0.1
    player.enqueue(new Uint8Array(640), format)
    expect(events.at(-1)).toMatchObject({ type: 'schedule', queueAheadBefore: 0, queueExhausted: true })
    context.currentTime = 0.11
    player.enqueue(new Uint8Array(640), format)
    expect(sources[1].start.mock.calls[0][0]).toBeCloseTo(0.12)
    expect(sources[2].start.mock.calls[0][0]).toBeCloseTo(0.14)
    expect(events.at(-1)).toMatchObject({ type: 'schedule', queueExhausted: false, gap: 0 })
    player.stop()
  })

  it('resets the timing diagnostic interval on stop and reports an explicit stop reason', () => {
    const { context, sources } = fixture()
    const events: PlaybackObservation[] = []
    const clock = vi.spyOn(performance, 'now').mockReturnValue(100)
    const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), () => {}, event => events.push(event))
    try {
      player.enqueue(new Uint8Array(640), format)
      clock.mockReturnValue(130)
      context.currentTime = 0.03
      player.enqueue(new Uint8Array(640), format)
      expect(events.at(-1)).toMatchObject({ type: 'schedule', arrivalIntervalMs: 30 })
      player.stop('stt')
      expect(events.at(-1)).toMatchObject({ type: 'stop', reason: 'stt', queuedSources: 2 })
      expect(sources.every(source => source.onended === null)).toBe(true)
      context.currentTime = 1
      player.enqueue(new Uint8Array(640), format)
      expect(events.at(-1)).toMatchObject({ type: 'schedule', arrivalIntervalMs: null, queueExhausted: false, gap: null, startTime: 1.02 })
    } finally { player.stop(); clock.mockRestore() }
  })

  it('keeps scheduling, drain and cleanup working when diagnostic callbacks throw', () => {
    const { context, sources } = fixture()
    const idle = vi.fn()
    const observer = vi.fn(() => { throw new Error('Diagnostic consumer failed') })
    const player = createPcmPlayer(context as unknown as AudioContext, idle, () => {}, observer)
    expect(() => player.enqueue(new Uint8Array(640), format)).not.toThrow()
    sources[0].onended?.()
    expect(idle).toHaveBeenCalledOnce()
    const changed = context.addEventListener.mock.calls[0][1] as () => void
    expect(() => changed()).not.toThrow()
    context.state = 'closed'
    changed()
    expect(context.removeEventListener).toHaveBeenCalledWith('statechange', changed)
    expect(() => player.stop()).not.toThrow()
    expect(idle).toHaveBeenCalledTimes(2)
  })
})


it('does not retain a context listener when constructed with an already closed context', () => {
  const { context } = fixture()
  context.state = 'closed'
  const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), () => {}, vi.fn())
  expect(context.addEventListener).not.toHaveBeenCalled()
  player.stop()
})


it('labels queue-overflow cleanup and cancels all scheduled sources', () => {
  const { context, sources } = fixture()
  const events: PlaybackObservation[] = []
  const idle = vi.fn()
  const player = createPcmPlayer(context as unknown as AudioContext, idle, () => {}, event => events.push(event))
  player.enqueue(new Uint8Array(16000 * 31 * 2), format)
  expect(() => player.enqueue(new Uint8Array(640), format)).toThrow('exceeded 30 seconds')
  expect(events.at(-1)).toMatchObject({ type: 'stop', reason: 'overflow', queuedSources: 1 })
  expect(sources[0].stop).toHaveBeenCalledOnce()
  expect(sources[0].onended).toBeNull()
  expect(idle).toHaveBeenCalledOnce()
})
