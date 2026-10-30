import { describe, expect, it, vi } from 'vitest'

import { createPcmEncoder, decodePcm16 } from '../src/pcm'
import { createPcmPlayer } from '../src/player'

function encode(rate: number, chunks: Float32Array[]) {
  const frames: Uint8Array[] = []
  const encoder = createPcmEncoder(rate, (frame) => frames.push(frame))
  for (const chunk of chunks) encoder.push(chunk)
  encoder.flush()
  return frames
}

describe('PCM audio', () => {
  it.each([16000, 44100, 48000])('resamples %iHz to exact 20ms mono frames without chunk boundary drift', (rate) => {
    const input = Float32Array.from({ length: rate / 10 }, (_, i) => Math.sin(i * 0.03) * 0.5)
    const whole = encode(rate, [input])
    const chunks = []
    for (let i = 0; i < input.length; i += 127) chunks.push(input.slice(i, i + 127))
    const partitioned = encode(rate, chunks)
    expect(partitioned).toEqual(whole)
    expect(whole).toHaveLength(5)
    expect(whole.every((frame) => frame.byteLength === 640)).toBe(true)
  })

  it('clamps signed little-endian PCM and pads the last frame with silence', () => {
    const frames = encode(16000, [new Float32Array([-2, 2, 0, 0.5])])
    const decoded = decodePcm16(frames[0]!)
    expect(Array.from(decoded.slice(0, 4))).toEqual([-1, 32767 / 32768, 0, 0.5])
    expect(decoded.slice(4).every((value) => value === 0)).toBe(true)
    expect(() => decodePcm16(new Uint8Array(1))).toThrow('complete')
  })

  it('schedules consecutive buffers and stops all pending playback on interrupt', () => {
    const sources: { onended: (() => void) | null; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = []
    const context = {
      currentTime: 1, sampleRate: 48000,
      destination: {},
      createBuffer: (_: number, size: number, rate: number) => ({ duration: size / rate, copyToChannel: vi.fn() }),
      createBufferSource: () => {
        const source = { buffer: null, onended: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn() }
        sources.push(source)
        return source
      }
    }
    const onIdle = vi.fn()
    const player = createPcmPlayer(context as unknown as AudioContext, onIdle)
    const format = { format: 'pcm', channels: 1, bitsPerSample: 16, sampleRate: 16000, frameDuration: 20 } as const
    player.enqueue(new Uint8Array(640), format)
    player.enqueue(new Uint8Array(640), format)
    player.flush()
    expect(sources[0]!.start).toHaveBeenCalledWith(1 + 256 / 48000)
    expect(sources[1]!.start).toHaveBeenCalledWith(1.02 + 256 / 48000)
    sources[0]!.onended?.()
    expect(onIdle).not.toHaveBeenCalled()
    player.stop()
    expect(sources[1]!.stop).toHaveBeenCalledOnce()
    expect(sources[1]!.onended).toBe(null)
    expect(onIdle).toHaveBeenCalledOnce()
    player.stop()
    expect(sources[1]!.stop).toHaveBeenCalledOnce()
    player.enqueue(new Uint8Array(640), format)
    player.flush()
    expect(sources[2]!.start).toHaveBeenCalledWith(1 + 256 / 48000)
    sources[2]!.onended?.()
    expect(onIdle).toHaveBeenCalledTimes(3)
  })
})
