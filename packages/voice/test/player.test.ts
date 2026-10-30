import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PlaybackObservation } from '../src/player'
import { createPcmPlayer } from '../src/player'

const renderLead = 256 / 48000
const format = { format: 'pcm' as const, sampleRate: 16000, channels: 1 as const, bitsPerSample: 16 as const, frameDuration: 20 }

function fixture() {
  const sources: { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; onended: (() => void) | null; buffer: AudioBuffer | null }[] = []
  const analyser = { fftSize: 0, connect: vi.fn(), disconnect: vi.fn(), getFloatTimeDomainData: vi.fn((data: Float32Array) => data.fill(0.25)) }
  const context = {
    currentTime: 0, sampleRate: 48000, state: 'running', addEventListener: vi.fn(), removeEventListener: vi.fn(), destination: {}, createAnalyser: vi.fn(() => analyser),
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
    player.flush()
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
    player.flush()
    player.stop()
    expect(sources[0].stop).toHaveBeenCalledOnce()
    expect(sources[0].onended).toBeNull()
    vi.advanceTimersByTime(100)
    expect(onLevel.mock.calls).toEqual([[0]])
    player.enqueue(new Uint8Array([0, 0]), format)
    player.flush()
    vi.advanceTimersByTime(50)
    expect(onLevel).toHaveBeenLastCalledWith(0.25)
    player.stop()
  })

  it('preserves direct playback when no meter consumer exists', () => {
    const { context, sources } = fixture()
    const player = createPcmPlayer(context as unknown as AudioContext)
    player.enqueue(new Uint8Array([0, 0]), format)
    player.flush()
    expect(sources[0].connect).toHaveBeenCalledWith(context.destination)
    expect(context.createAnalyser).not.toHaveBeenCalled()
    player.stop()
  })
})


describe('PCM startup buffer and continuous scheduling', () => {
  it('starts on the fifth 20ms packet and keeps subsequent packets adjacent near the queue end', () => {
    vi.useFakeTimers()
    const { context, sources } = fixture()
    const events: PlaybackObservation[] = []
    const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), () => {}, event => events.push(event))
    for (let packet = 0; packet < 4; packet++) {
      context.currentTime = packet * .02
      player.enqueue(new Uint8Array(640), format)
      expect(sources).toHaveLength(0)
      vi.advanceTimersByTime(20)
    }
    context.currentTime = .08
    player.enqueue(new Uint8Array(640), format)
    expect(sources).toHaveLength(5)
    for (let packet = 0; packet < 5; packet++) expect(sources[packet].start.mock.calls[0][0]).toBeCloseTo(.08 + renderLead + packet * .02)
    expect(events).toContainEqual(expect.objectContaining({ type: 'buffer', state: 'threshold', pendingSamples: 1600 }))
    context.currentTime = .17
    player.enqueue(new Uint8Array(640), format)
    expect(sources[5].start.mock.calls[0][0]).toBeCloseTo(.18 + renderLead)
    player.stop()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('flushes a short answer immediately and reports idle only after the scheduled audio ends', () => {
    vi.useFakeTimers()
    const { context, sources } = fixture()
    const idle = vi.fn()
    const player = createPcmPlayer(context as unknown as AudioContext, idle)
    player.enqueue(new Uint8Array(640), format)
    expect(sources).toHaveLength(0)
    expect(idle).not.toHaveBeenCalled()
    context.currentTime = .035
    player.flush(); player.flush()
    expect(sources).toHaveLength(1)
    expect(sources[0].start).toHaveBeenCalledExactlyOnceWith(.035 + renderLead)
    expect(vi.getTimerCount()).toBe(0)
    expect(idle).not.toHaveBeenCalled()
    const ended = sources[0].onended!
    ended(); ended()
    expect(idle).toHaveBeenCalledOnce()
  })

  it('starts a partial buffer at the first-pending 100ms deadline without extending it for later packets', () => {
    vi.useFakeTimers()
    const { context, sources } = fixture()
    const events: PlaybackObservation[] = []
    const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), () => {}, event => events.push(event))
    player.enqueue(new Uint8Array(640), format)
    vi.advanceTimersByTime(70)
    context.currentTime = .07
    player.enqueue(new Uint8Array(640), format)
    vi.advanceTimersByTime(29)
    expect(sources).toHaveLength(0)
    context.currentTime = .1
    vi.advanceTimersByTime(1)
    expect(sources[0].start).toHaveBeenCalledExactlyOnceWith(.1 + renderLead)
    expect(sources[1].start.mock.calls[0][0]).toBeCloseTo(.12 + renderLead)
    expect(events).toContainEqual(expect.objectContaining({ type: 'buffer', state: 'timeout', pendingSamples: 640 }))
    player.stop()
  })

  it('buffers again after exhaustion, suppresses premature idle, and reanchors the resumed queue', () => {
    vi.useFakeTimers()
    const { context, sources } = fixture()
    const idle = vi.fn()
    const events: PlaybackObservation[] = []
    const player = createPcmPlayer(context as unknown as AudioContext, idle, () => {}, event => events.push(event))
    player.enqueue(new Uint8Array(3200), format)
    expect(sources[0].start).toHaveBeenCalledExactlyOnceWith(renderLead)
    context.currentTime = .11
    player.enqueue(new Uint8Array(640), format)
    sources[0].onended?.()
    expect(idle).not.toHaveBeenCalled()
    expect(sources).toHaveLength(1)
    context.currentTime = .21
    vi.advanceTimersByTime(100)
    expect(sources[1].start).toHaveBeenCalledExactlyOnceWith(.21 + renderLead)
    expect(events.at(-1)).toMatchObject({ type: 'schedule', queueExhausted: true, queueAheadBefore: 0 })
    context.currentTime = .22
    player.enqueue(new Uint8Array(640), format)
    expect(sources[2].start.mock.calls[0][0]).toBeCloseTo(.23 + renderLead)
    sources[1].onended?.(); sources[2].onended?.()
    expect(idle).toHaveBeenCalledOnce()
    player.stop()
  })

  it('clears pending audio and ignores an old timeout after stop and a new answer', () => {
    vi.useFakeTimers()
    const timers = vi.spyOn(globalThis, 'setTimeout')
    const { context, sources } = fixture()
    const idle = vi.fn()
    const player = createPcmPlayer(context as unknown as AudioContext, idle)
    player.enqueue(new Uint8Array(640), format)
    const oldTimeout = timers.mock.calls[0][0] as () => void
    player.stop('stt')
    player.enqueue(new Uint8Array(640), format)
    oldTimeout()
    expect(sources).toHaveLength(0)
    expect(idle).toHaveBeenCalledOnce()
    context.currentTime = .1
    vi.advanceTimersByTime(100)
    expect(sources).toHaveLength(1)
    sources[0].onended?.()
    expect(idle).toHaveBeenCalledTimes(2)
    player.stop()
    timers.mockRestore()
  })

  it('ignores an old ended callback while a new answer is buffering', () => {
    vi.useFakeTimers()
    const { context, sources } = fixture()
    const idle = vi.fn()
    const player = createPcmPlayer(context as unknown as AudioContext, idle)
    player.enqueue(new Uint8Array(3200), format)
    const oldEnded = sources[0].onended!
    player.stop('new-answer')
    player.enqueue(new Uint8Array(640), format)
    oldEnded()
    expect(idle).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(1)
    player.stop()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('preserves enqueue timing while chunks wait and resets it on stop', () => {
    vi.useFakeTimers()
    const { context, sources } = fixture()
    const events: PlaybackObservation[] = []
    const clock = vi.spyOn(performance, 'now').mockReturnValue(100)
    const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), () => {}, event => events.push(event))
    try {
      player.enqueue(new Uint8Array(640), format)
      clock.mockReturnValue(130)
      player.enqueue(new Uint8Array(640), format)
      clock.mockReturnValue(150)
      player.flush()
      expect(events.at(-1)).toMatchObject({ type: 'schedule', arrivalIntervalMs: 30 })
      player.stop('stt')
      expect(events.at(-1)).toMatchObject({ type: 'stop', reason: 'stt', queuedSources: 2, pendingSamples: 0 })
      expect(sources.every(source => source.onended === null)).toBe(true)
      context.currentTime = 1
      player.enqueue(new Uint8Array(640), format)
      player.flush()
      expect(events.at(-1)).toMatchObject({ type: 'schedule', arrivalIntervalMs: null, queueExhausted: false, gap: null, startTime: 1 + renderLead })
    } finally { player.stop(); clock.mockRestore() }
  })

  it('isolates throwing diagnostics through buffering, flush, context closure and cleanup', () => {
    vi.useFakeTimers()
    const { context, sources } = fixture()
    const idle = vi.fn()
    const observer = vi.fn(() => { throw new Error('Diagnostic consumer failed') })
    const player = createPcmPlayer(context as unknown as AudioContext, idle, () => {}, observer)
    expect(() => player.enqueue(new Uint8Array(640), format)).not.toThrow()
    expect(() => player.flush()).not.toThrow()
    sources[0].onended?.()
    expect(idle).toHaveBeenCalledOnce()
    const changed = context.addEventListener.mock.calls[0][1] as () => void
    expect(() => changed()).not.toThrow()
    context.state = 'closed'
    changed()
    expect(context.removeEventListener).toHaveBeenCalledWith('statechange', changed)
    expect(() => player.stop()).not.toThrow()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not retain a context listener when constructed with an already closed context', () => {
    const { context } = fixture()
    context.state = 'closed'
    const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), () => {}, vi.fn())
    expect(context.addEventListener).not.toHaveBeenCalled()
    player.stop()
  })

  it('allows exactly 30 seconds then labels overflow cleanup and cancels all scheduled sources', () => {
    const { context, sources } = fixture()
    const events: PlaybackObservation[] = []
    const idle = vi.fn()
    const player = createPcmPlayer(context as unknown as AudioContext, idle, () => {}, event => events.push(event))
    player.enqueue(new Uint8Array(16000 * 30 * 2), format)
    expect(() => player.enqueue(new Uint8Array(2), format)).toThrow('exceeded 30 seconds')
    expect(events.at(-1)).toMatchObject({ type: 'stop', reason: 'overflow', queuedSources: 1, pendingSamples: 0 })
    expect(sources[0].stop).toHaveBeenCalledOnce()
    expect(sources[0].onended).toBeNull()
    expect(idle).toHaveBeenCalledOnce()
  })

  it('includes pending samples in the 30-second limit before allocating playback sources', () => {
    vi.useFakeTimers()
    const { context, sources } = fixture()
    const events: PlaybackObservation[] = []
    const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), () => {}, event => events.push(event))
    player.enqueue(new Uint8Array(640), format)
    expect(() => player.enqueue(new Uint8Array(16000 * 30 * 2), format)).toThrow('exceeded 30 seconds')
    expect(sources).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(events.at(-1)).toMatchObject({ type: 'stop', reason: 'overflow', pendingSamples: 320 })
  })
})


it.each(['prepare', 'start'])('cleans an asynchronous %s failure without reporting a successful drain', failure => {
  vi.useFakeTimers()
  const { context, sources } = fixture()
  const idle = vi.fn()
  const error = vi.fn(() => { throw new Error('Error consumer failed') })
  const player = createPcmPlayer(context as unknown as AudioContext, idle, () => {}, vi.fn(), error)
  player.enqueue(new Uint8Array(640), format)
  player.enqueue(new Uint8Array(640), format)
  if (failure === 'prepare') context.createBuffer.mockImplementationOnce(() => { throw new Error('Buffer allocation failed') })
  else {
    const create = context.createBufferSource.bind(context)
    let count = 0
    vi.spyOn(context, 'createBufferSource').mockImplementation(() => {
      const source = create()
      if (++count === 2) source.start.mockImplementation(() => { throw new Error('Start failed') })
      return source
    })
  }
  expect(() => vi.advanceTimersByTime(100)).not.toThrow()
  expect(error).toHaveBeenCalledOnce()
  expect(idle).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
  if (failure === 'start') {
    expect(sources[0].stop).toHaveBeenCalledOnce()
    expect(sources[1].stop).not.toHaveBeenCalled()
    expect(sources.every(source => source.disconnect.mock.calls.length > 0 && source.onended === null)).toBe(true)
  }
  context.createBuffer.mockImplementation((_channels: number, length: number, rate: number) => ({ duration: length / rate, copyToChannel: vi.fn() }))
  player.stop()
})

it('disconnects partially prepared sources when a later connection fails before playback starts', () => {
  vi.useFakeTimers()
  const { context, sources } = fixture()
  const error = vi.fn()
  const player = createPcmPlayer(context as unknown as AudioContext, vi.fn(), () => {}, vi.fn(), error)
  const create = context.createBufferSource.bind(context)
  vi.spyOn(context, 'createBufferSource').mockImplementation(() => {
    const source = create()
    if (sources.length === 2) source.connect.mockImplementation(() => { throw new Error('Connect failed') })
    return source
  })
  player.enqueue(new Uint8Array(640), format)
  player.enqueue(new Uint8Array(640), format)
  vi.advanceTimersByTime(100)
  expect(error).toHaveBeenCalledOnce()
  expect(sources.every(source => source.stop.mock.calls.length === 0 && source.disconnect.mock.calls.length > 0 && source.onended === null)).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
  player.stop()
})
