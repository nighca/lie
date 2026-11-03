import { mkdirSync, writeFileSync } from 'node:fs'
import { afterAll, expect, it, vi } from 'vitest'
import type { VoiceChannelOptions } from '@lie/voice'

import { readPageBuild } from '../../apps/web/build/page-version'
import { createLiveVoicePort } from '../../apps/web/src/application/liveVoice'
import type { ConversationScope } from '../../apps/web/src/application/voice'

const results: unknown[] = []
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

it.each([
  { name: 'transport-bound', prepare: 80, playback: 20, microphone: 250, channel: 400, expected: 480 },
  { name: 'capture-bound', prepare: 80, playback: 20, microphone: 700, channel: 400, expected: 780 },
  { name: 'playback-bound', prepare: 80, playback: 900, microphone: 250, channel: 400, expected: 980 },
  { name: 'prepare-bound', prepare: 1000, playback: 20, microphone: 250, channel: 400, expected: 1400 },
])('isolates the $name critical path using actual liveVoice orchestration', async sample => {
  vi.useFakeTimers()
  try {
    const events: unknown[] = []
    const abort = new AbortController()
    const scope: ConversationScope = {
      sessionId: 'synthetic', characterId: 'a', voiceId: null, epoch: 1,
      signal: abort.signal, isCurrent: () => !abort.signal.aborted,
      readContext() { throw new Error('No context request expected') }, onEvent() {},
    }
    const base = Date.now()
    let prepareRequests = 0
    let forwarded = 0
    let firstInputAt: number | null = null
    let frame = (_data: Uint8Array) => {}
    const dependencies = {
      now: () => Date.now() - base,
      onStartup: (event: unknown) => events.push(event),
      prepareDevice: async () => { prepareRequests++; await delay(sample.prepare); return Response.json({ transport: 'relay' }) },
      createContext: () => ({ state: 'running', resume: () => delay(sample.playback), close: async () => {} }) as unknown as AudioContext,
      createPlayer: () => ({ enqueue() {}, stop() {} }),
      openMic: async (options: { onFrame(data: Uint8Array): void }) => {
        frame = options.onFrame
        await delay(sample.microphone)
        frame(new Uint8Array(640))
        return { stop: async () => {} }
      },
      createChannel: (_options: VoiceChannelOptions) => ({
        open: () => delay(sample.channel), startInput() { firstInputAt = Date.now() - base },
        input() { forwarded++ }, stopInput() {}, interrupt() {}, close() {},
      }),
    }
    const port = createLiveVoicePort(dependencies)
    const preparation = port.prepare()
    const connection = port.create(scope)
    const opening = connection.open()
    await vi.advanceTimersByTimeAsync(sample.expected - 1)
    expect(firstInputAt).toBe(null)
    expect(forwarded).toBe(0)
    await vi.advanceTimersByTimeAsync(1)
    await opening
    await preparation
    expect(prepareRequests).toBe(1)
    expect(firstInputAt).toBe(sample.expected)
    frame(new Uint8Array(640))
    expect(forwarded).toBe(1)
    connection.close()
    port.reset()
    await vi.advanceTimersByTimeAsync(0)
    results.push({ kind: 'synthetic-case-prepare-clock', prepareRequests, name: sample.name, inputsMs: sample, listenStartMs: firstInputAt, events })
  } finally { vi.useRealTimers() }
})

afterAll(() => {
  const output = new URL('../../tmp/voice-connection-latency-current/', import.meta.url)
  mkdirSync(output, { recursive: true })
  writeFileSync(new URL('critical-path-results.json', output), JSON.stringify({
    source: readPageBuild(new URL('../..', import.meta.url).pathname),
    notice: 'Synthetic clocks and fake devices/transport; no browser, network, provider or speedup measurement.',
    results,
  }, null, 2) + '\n')
})
