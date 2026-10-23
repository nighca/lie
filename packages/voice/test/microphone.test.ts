import { describe, expect, it, vi } from 'vitest'

import { openMicrophone } from '../src/microphone'

function audioFixture() {
  const track = { stop: vi.fn() }
  const stream = { getTracks: () => [track] }
  const source = { connect: vi.fn(), disconnect: vi.fn() }
  const gain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() }
  const worklet = {
    port: { onmessage: null as ((event: { data: Float32Array }) => void) | null, close: vi.fn() },
    connect: vi.fn(), disconnect: vi.fn()
  }
  const context = {
    state: 'running', sampleRate: 48000, destination: {},
    audioWorklet: { addModule: vi.fn(async () => {}) },
    createMediaStreamSource: vi.fn(() => source), createGain: vi.fn(() => gain),
    resume: vi.fn(async () => {}), close: vi.fn(async () => {})
  }
  const onFrame = vi.fn()
  const options = {
    onFrame,
    getUserMedia: vi.fn(async () => stream as unknown as MediaStream),
    createContext: vi.fn(() => context as unknown as AudioContext),
    createWorklet: vi.fn(() => worklet as unknown as AudioWorkletNode)
  }
  return { track, stream, source, gain, worklet, context, onFrame, options }
}

describe('microphone lifecycle', () => {
  it('uses the actual sample rate, never monitors microphone sound, and releases owned resources', async () => {
    const fixture = audioFixture()
    const microphone = await openMicrophone(fixture.options)
    expect(fixture.options.getUserMedia).toHaveBeenCalledWith({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false })
    expect(fixture.gain.gain.value).toBe(0)
    fixture.worklet.port.onmessage?.({ data: new Float32Array(960).fill(0.5) })
    expect(fixture.onFrame).toHaveBeenCalledOnce()
    expect(fixture.onFrame.mock.calls[0]?.[0].byteLength).toBe(640)
    const lateMessage = fixture.worklet.port.onmessage!
    await microphone.stop()
    await microphone.stop()
    lateMessage({ data: new Float32Array(960) })
    expect(fixture.onFrame).toHaveBeenCalledOnce()
    expect(fixture.track.stop).toHaveBeenCalledOnce()
    expect(fixture.context.close).toHaveBeenCalledOnce()
    expect(fixture.worklet.port.close).toHaveBeenCalledOnce()
  })

  it('propagates permission denial without opening an audio context', async () => {
    const fixture = audioFixture()
    fixture.options.getUserMedia.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
    await expect(openMicrophone(fixture.options)).rejects.toMatchObject({ name: 'NotAllowedError' })
    expect(fixture.options.createContext).not.toHaveBeenCalled()
  })

  it('releases a stream granted after cancellation', async () => {
    const fixture = audioFixture()
    let grant: (stream: MediaStream) => void = () => {}
    fixture.options.getUserMedia.mockImplementation(() => new Promise((resolve) => { grant = resolve }))
    const controller = new AbortController()
    const pending = openMicrophone({ ...fixture.options, signal: controller.signal })
    controller.abort()
    grant(fixture.stream as unknown as MediaStream)
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(fixture.track.stop).toHaveBeenCalledOnce()
    expect(fixture.options.createContext).not.toHaveBeenCalled()
  })

  it('cleans up worklet initialization failure and aborts active capture', async () => {
    const failed = audioFixture()
    failed.context.audioWorklet.addModule.mockRejectedValue(new Error('Worklet unavailable'))
    await expect(openMicrophone(failed.options)).rejects.toThrow('Worklet unavailable')
    expect(failed.track.stop).toHaveBeenCalledOnce()
    expect(failed.context.close).toHaveBeenCalledOnce()
    const active = audioFixture()
    const controller = new AbortController()
    const microphone = await openMicrophone({ ...active.options, signal: controller.signal })
    controller.abort()
    await microphone.stop()
    expect(active.track.stop).toHaveBeenCalledOnce()
    expect(active.worklet.disconnect).toHaveBeenCalledOnce()
  })
})
