import type { VoiceChannelOptions, VoiceStartupObservation } from '@lie/voice'
import { vi } from 'vitest'

import { createLiveVoicePort } from '../src/application/liveVoice'
import type { ConversationScope } from '../src/application/voice'

export const descriptor = { transport: 'direct', url: 'wss://xrobo-io.qiniuapi.com/v1/ws/', deviceId: '02:00:00:00:00:01', clientId: 'test-client', token: 'fake-ota-token', maxSessionSeconds: 600 }

export function voiceFixture(transport: 'relay' | 'direct' = 'direct', onStartup: (event: VoiceStartupObservation & { elapsedMs: number }) => void = () => {}) {
  const abort = new AbortController()
  const scope: ConversationScope = {
    sessionId: 'test', characterId: 'one', voiceId: null, epoch: 1, signal: abort.signal,
    isCurrent: () => !abort.signal.aborted, readContext: () => ({ background: '', characterId: 'one', characterName: 'A', profile: '', history: [], systemPrompt: '' }), onEvent() {},
  }
  const channel = { open: vi.fn(async () => {}), startInput: vi.fn(), input: vi.fn(), stopInput: vi.fn(), interrupt: vi.fn(), close: vi.fn() }
  const dependencies = {
    onStartup,
    prepareDevice: vi.fn(async (_signal: AbortSignal) => Response.json(transport === 'direct' ? descriptor : { transport })),
    createChannel: vi.fn((_options: VoiceChannelOptions) => channel),
    createPlayer: vi.fn(() => ({ enqueue: vi.fn(), flush: vi.fn(), stop: vi.fn() })),
    createContext: vi.fn(() => ({ resume: async () => {}, close: async () => {}, state: 'running' }) as unknown as AudioContext),
    openMic: vi.fn(async () => ({ stop: async () => {} })),
  }
  return { dependencies, port: createLiveVoicePort(dependencies), scope, abort, channel }
}
