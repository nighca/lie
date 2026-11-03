import { describe, expect, it, vi } from 'vitest'

import { createGameController } from '../src/application/controller'
import { createLiveVoicePort } from '../src/application/liveVoice'
import type { ConversationScope } from '../src/application/voice'
import { game } from './helpers'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
function fixture() {
  const channels: { open: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }[] = []
  const dependencies = {
    fetchStatus: vi.fn(async (_signal: AbortSignal) => Response.json({ status: 'ready', transport: 'relay' })),
    prepareDevice: vi.fn(async (_signal: AbortSignal) => new Response(null, { status: 204 })),
    createChannel: vi.fn(() => {
      const channel = { open: vi.fn(async () => {}), close: vi.fn(), startInput: vi.fn(), input: vi.fn(), stopInput: vi.fn(), interrupt: vi.fn() }
      channels.push(channel)
      return channel
    }),
    createContext: vi.fn(() => ({ state: 'running', resume: async () => {}, close: async () => {} }) as unknown as AudioContext),
    createPlayer: vi.fn(() => ({ enqueue: vi.fn(), flush: vi.fn(), stop: vi.fn() })),
    openMic: vi.fn(async () => ({ stop: vi.fn(async () => {}) })),
  }
  const voice = createLiveVoicePort(dependencies)
  function conversation() {
    const abort = new AbortController()
    const scope: ConversationScope = { sessionId: crypto.randomUUID(), characterId: 'one', voiceId: null, epoch: 1, signal: abort.signal,
      isCurrent: () => !abort.signal.aborted, readContext: () => ({ background: '', characterId: 'one', characterName: 'A', profile: '', history: [], systemPrompt: '' }), onEvent() {} }
    return { connection: voice.create(scope), expire: () => abort.abort() }
  }
  return { voice, dependencies, channels, conversation }
}

describe('app-owned browser device preparation', () => {
  it('prepares in the background once and opens no capture or transport until requested', async () => {
    const f = fixture(), ready = deferred<Response>()
    f.dependencies.prepareDevice.mockImplementation(() => ready.promise)
    const first = f.voice.prepare(), second = f.voice.prepare()
    await vi.waitFor(() => expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce())
    expect(f.dependencies.fetchStatus).toHaveBeenCalledOnce()
    expect(f.dependencies.createContext).not.toHaveBeenCalled()
    expect(f.dependencies.openMic).not.toHaveBeenCalled()
    expect(f.dependencies.createChannel).not.toHaveBeenCalled()
    ready.resolve(new Response(null, { status: 204 }))
    await Promise.all([first, second])
    await f.voice.prepare()
    const turn = f.conversation()
    await turn.connection.open()
    expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
    expect(f.channels[0].open).toHaveBeenCalledOnce()
    expect(f.dependencies.openMic).toHaveBeenCalledOnce()
    turn.connection.close()
  })

  it('lets a new conversation await shared preparation after the earlier scope is cancelled', async () => {
    const f = fixture(), ready = deferred<Response>()
    f.dependencies.prepareDevice.mockImplementation(() => ready.promise)
    const first = f.conversation(), oldOpen = first.connection.open()
    await vi.waitFor(() => expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce())
    const preparationSignal = f.dependencies.prepareDevice.mock.calls[0][0]
    first.expire(); first.connection.close()
    const second = f.conversation(), newOpen = second.connection.open()
    expect(preparationSignal.aborted).toBe(false)
    expect(f.dependencies.openMic).not.toHaveBeenCalled()
    ready.resolve(new Response(null, { status: 204 }))
    await Promise.all([oldOpen, newOpen])
    expect(f.channels).toHaveLength(1)
    expect(f.channels[0].open).toHaveBeenCalledOnce()
    expect(f.dependencies.fetchStatus).toHaveBeenCalledOnce()
    expect(f.dependencies.openMic).toHaveBeenCalledOnce()
    second.connection.close()
  })

  it('retries failed preparation only on a later explicit action', async () => {
    const f = fixture()
    f.dependencies.prepareDevice.mockResolvedValueOnce(new Response(null, { status: 502 }))
    await expect(f.voice.prepare()).rejects.toMatchObject({ reason: 'check-failed' })
    expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
    const turn = f.conversation()
    await turn.connection.open()
    expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
    expect(f.dependencies.fetchStatus).toHaveBeenCalledTimes(2)
    turn.connection.close()
  })

  it('bootstraps at most once more for a missing identity and stops a repeated conflict', async () => {
    const f = fixture()
    f.dependencies.prepareDevice.mockImplementation(async () => Response.json({ error: 'identity-required' }, { status: 409 }))
    await expect(f.voice.prepare()).rejects.toMatchObject({ reason: 'check-failed' })
    expect(f.dependencies.fetchStatus).toHaveBeenCalledTimes(2)
    expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
    expect(f.dependencies.openMic).not.toHaveBeenCalled()
  })

  it('does not let an older opening failure invalidate a newer prepared generation', async () => {
    const f = fixture()
    await f.voice.prepare()
    const old = f.conversation(), late = deferred<void>()
    const makeChannel = f.dependencies.createChannel.getMockImplementation()!
    f.dependencies.createChannel.mockImplementationOnce(() => { const channel = makeChannel(); channel.open.mockImplementation(() => late.promise); return channel })
    const oldOpening = old.connection.open().catch(() => {})
    await vi.waitFor(() => expect(f.channels[0].open).toHaveBeenCalledOnce())
    const failed = f.conversation()
    f.dependencies.createChannel.mockImplementationOnce(() => { const channel = makeChannel(); channel.open.mockRejectedValue(new Error('new connection failed')); return channel })
    await expect(failed.connection.open()).rejects.toThrow('new connection failed')
    await f.voice.prepare()
    expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
    late.reject(new Error('older delayed failure'))
    await oldOpening
    await f.voice.prepare()
    expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
    old.connection.close(); failed.connection.close()
  })

  it('prepares when the background is loaded, sharing work across controllers and restart without charging play time', async () => {
    const f = fixture(), ready = deferred<Response>()
    f.dependencies.prepareDevice.mockImplementation(() => ready.promise)
    const controller = createGameController({ readGame: async () => game, voice: f.voice, now: () => 0, newSessionId: () => 'game' })
    await controller.load('test')
    expect(controller.getView()).toMatchObject({ phase: 'intro', conversationActive: false, busy: false, interrogationRemainingMs: 480000 })
    await vi.waitFor(() => expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce())
    const second = createGameController({ readGame: async () => game, voice: f.voice, now: () => 0, newSessionId: () => 'other' })
    await second.load('test')
    controller.start()
    expect(controller.getView()).toMatchObject({ phase: 'interrogating', conversationActive: false, busy: false, interrogationRemainingMs: 480000 })
    controller.restart()
    expect(controller.getView().phase).toBe('intro')
    expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
    expect(f.dependencies.openMic).not.toHaveBeenCalled()
    expect(f.dependencies.createChannel).not.toHaveBeenCalled()
    controller.dispose(); second.dispose()
    ready.resolve(new Response(null, { status: 204 }))
    await f.voice.prepare()
    expect(f.dependencies.openMic).not.toHaveBeenCalled()
  })

  it('does not prepare for failed, superseded or disposed loads', async () => {
    const f = fixture(), stale = deferred<unknown>(), disposed = deferred<unknown>()
    const readGame = vi.fn().mockImplementationOnce(() => stale.promise).mockRejectedValueOnce(new Error('failed')).mockImplementationOnce(() => disposed.promise)
    const controller = createGameController({ readGame, voice: f.voice, now: () => 0, newSessionId: () => 'game' })
    const oldLoad = controller.load('old')
    await controller.load('failed')
    stale.resolve(game)
    await oldLoad
    expect(controller.getView().phase).toBe('failed')
    const lastLoad = controller.load('disposed')
    controller.dispose()
    disposed.resolve(game)
    await lastLoad
    expect(f.dependencies.fetchStatus).not.toHaveBeenCalled()
    expect(f.dependencies.prepareDevice).not.toHaveBeenCalled()
  })
})

it('shares one twenty-second preparation deadline through identity recovery without looping', async () => {
  const f = fixture(), clock = new AbortController()
  const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(clock.signal)
  let attempts = 0
  f.dependencies.prepareDevice.mockImplementation(signal => {
    if (attempts++ === 0) return Promise.resolve(Response.json({ error: 'identity-required' }, { status: 409 }))
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')), { once: true }))
  })
  try {
    const preparation = f.voice.prepare()
    await vi.waitFor(() => expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2))
    expect(timeout).toHaveBeenCalledExactlyOnceWith(20000)
    expect(f.dependencies.fetchStatus.mock.calls.map(([signal]) => signal)).toEqual([clock.signal, clock.signal])
    expect(f.dependencies.prepareDevice.mock.calls.map(([signal]) => signal)).toEqual([clock.signal, clock.signal])
    clock.abort()
    await expect(preparation).rejects.toMatchObject({ reason: 'check-failed' })
    expect(f.dependencies.fetchStatus).toHaveBeenCalledTimes(2)
    expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
    expect(f.dependencies.openMic).not.toHaveBeenCalled()
  } finally { timeout.mockRestore() }
})
