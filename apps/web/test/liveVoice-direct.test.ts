import { expect, it, vi } from 'vitest'
import type { VoiceChannelOptions } from '@lie/voice'

import { createGameController } from '../src/application/controller'
import { createLiveVoicePort } from '../src/application/liveVoice'
import type { ConversationScope } from '../src/application/voice'
import { game } from './helpers'

const descriptor = { url: 'wss://xrobo-io.qiniuapi.com/v1/ws/', deviceId: '02:00:00:00:00:01', clientId: 'test-client', token: 'fake-ota-token', maxSessionSeconds: 600 }

function fixture(transport: 'relay' | 'direct') {
  const abort = new AbortController()
  const scope: ConversationScope = {
    sessionId: 'test', characterId: 'one', voiceId: null, epoch: 1, signal: abort.signal,
    isCurrent: () => !abort.signal.aborted, readContext: () => ({ background: '', characterId: 'one', characterName: 'A', profile: '', history: [], systemPrompt: '' }), onEvent() {},
  }
  const channel = { open: vi.fn(async () => {}), startInput: vi.fn(), input: vi.fn(), stopInput: vi.fn(), interrupt: vi.fn(), close: vi.fn() }
  const dependencies = {
    fetchStatus: vi.fn(async (_signal: AbortSignal) => new Response(JSON.stringify({ status: 'ready', transport }))),
    prepareDevice: vi.fn(async (_signal: AbortSignal) => transport === 'direct' ? Response.json(descriptor) : new Response(null, { status: 204 })),
    createChannel: vi.fn((_options: VoiceChannelOptions) => channel),
    createPlayer: vi.fn(() => ({ enqueue: vi.fn(), flush: vi.fn(), stop: vi.fn() })),
    createContext: vi.fn(() => ({ resume: async () => {}, close: async () => {}, state: 'running' }) as unknown as AudioContext),
    openMic: vi.fn(async () => ({ stop: async () => {} })),
  }
  const port = createLiveVoicePort(dependencies)
  return { dependencies, port, scope, abort, channel }
}

it('prepares relay connections through the existing 204 path', async () => {
  const f = fixture('relay')
  const connection = f.port.create(f.scope)
  await connection.open()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.createChannel.mock.calls[0][0]).not.toHaveProperty('directConnection')
  connection.close()
})

it('checks only availability during intro and gets a fresh direct descriptor from prepare for each open', async () => {
  const f = fixture('direct')
  await Promise.all([f.port.prepare(), f.port.prepare()])
  expect(f.dependencies.prepareDevice).not.toHaveBeenCalled()
  let sequence = 0
  f.dependencies.prepareDevice.mockImplementation(async () => Response.json({ ...descriptor, token: `fresh-${++sequence}` }))
  for (let i = 0; i < 2; i++) {
    const connection = f.port.create(f.scope)
    await connection.open()
    expect(f.dependencies.createChannel.mock.calls[i][0].directConnection).toEqual({ ...descriptor, token: `fresh-${i + 1}` })
    connection.close()
  }
  expect(f.dependencies.fetchStatus).toHaveBeenCalledOnce()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
})

it('drops a late direct descriptor after cancellation before creating capture or a socket', async () => {
  const f = fixture('direct')
  let complete!: (response: Response) => void
  f.dependencies.prepareDevice.mockImplementation(() => new Promise(resolve => { complete = resolve }))
  const connection = f.port.create(f.scope)
  const opening = connection.open()
  await vi.waitFor(() => expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce())
  f.abort.abort(); connection.close()
  expect(f.dependencies.prepareDevice.mock.calls[0][0].aborted).toBe(true)
  complete(new Response(JSON.stringify(descriptor)))
  await opening
  expect(f.dependencies.createChannel).not.toHaveBeenCalled()
  expect(f.dependencies.createContext).not.toHaveBeenCalled()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
})

it.each(['http', 'endpoint'])('fails %s descriptor acquisition before opening microphone', async failure => {
  const f = fixture('direct')
  f.dependencies.prepareDevice.mockResolvedValue(new Response(JSON.stringify({ ...descriptor, url: 'wss://other.example/ws' }), { status: failure === 'http' ? 502 : 200 }))
  const connection = f.port.create(f.scope)
  await expect(connection.open()).rejects.toMatchObject({ reason: 'check-failed' })
  expect(f.dependencies.createChannel).not.toHaveBeenCalled()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
  connection.close()
})

it('does not create a second transport when the same connection is opened again', async () => {
  const f = fixture('direct')
  const connection = f.port.create(f.scope)
  const opening = connection.open()
  await expect(connection.open()).rejects.toThrow('only be opened once')
  await opening
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.createChannel).toHaveBeenCalledOnce()
  connection.close()
})

it('loads the direct intro with a status check and no device preparation or capture', async () => {
  const f = fixture('direct')
  const controller = createGameController({ readGame: async () => game, voice: f.port, now: () => 0, newSessionId: () => 'test' })
  try {
    await controller.load('test')
    await f.port.prepare()
    expect(controller.getView()).toMatchObject({ phase: 'intro', conversationActive: false })
    expect(f.dependencies.fetchStatus).toHaveBeenCalledOnce()
    expect(f.dependencies.prepareDevice).not.toHaveBeenCalled()
    expect(f.dependencies.createChannel).not.toHaveBeenCalled()
    expect(f.dependencies.openMic).not.toHaveBeenCalled()
  } finally { controller.dispose() }
})

it('recovers an expired direct identity once with status and prepare under one scoped deadline', async () => {
  const f = fixture('direct')
  await f.port.prepare()
  f.dependencies.prepareDevice.mockResolvedValueOnce(Response.json({ error: 'identity-required' }, { status: 409 }))
  const connection = f.port.create(f.scope)
  await connection.open()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  expect(f.dependencies.fetchStatus).toHaveBeenCalledTimes(2)
  const signal = f.dependencies.prepareDevice.mock.calls[0][0]
  expect(f.dependencies.prepareDevice.mock.calls[1][0]).toBe(signal)
  expect(f.dependencies.fetchStatus.mock.calls[1][0]).toBe(signal)
  expect(f.dependencies.createChannel).toHaveBeenCalledOnce()
  expect(f.dependencies.createChannel.mock.calls[0][0].directConnection).toEqual(descriptor)
  connection.close()
})

it('stops a repeated direct identity conflict and waits for a new explicit open', async () => {
  const f = fixture('direct')
  f.dependencies.prepareDevice.mockImplementation(async () => Response.json({ error: 'identity-required' }, { status: 409 }))
  const failed = f.port.create(f.scope)
  await expect(failed.open()).rejects.toMatchObject({ reason: 'check-failed' })
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  expect(f.dependencies.fetchStatus).toHaveBeenCalledTimes(2)
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
  await f.port.prepare()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  f.dependencies.prepareDevice.mockImplementation(async () => Response.json(descriptor))
  const fresh = f.port.create(f.scope)
  await fresh.open()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(3)
  expect(f.dependencies.createChannel).toHaveBeenCalledOnce()
  fresh.close()
})

it('discards a descriptor whose JSON finishes after close', async () => {
  const f = fixture('direct')
  let complete!: (value: unknown) => void
  const response = Response.json(descriptor)
  const json = vi.spyOn(response, 'json').mockImplementation(() => new Promise(resolve => { complete = resolve }))
  f.dependencies.prepareDevice.mockResolvedValue(response)
  const connection = f.port.create(f.scope)
  const opening = connection.open()
  await vi.waitFor(() => expect(json).toHaveBeenCalledOnce())
  connection.close()
  complete(descriptor)
  await opening
  expect(f.dependencies.createChannel).not.toHaveBeenCalled()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
})

it('gets another direct descriptor after a transport failure without redoing relay identity preparation', async () => {
  const f = fixture('direct')
  f.channel.open.mockRejectedValueOnce(new Error('Transport failed'))
  const failed = f.port.create(f.scope)
  await expect(failed.open()).rejects.toThrow('Transport failed')
  const fresh = f.port.create(f.scope)
  await fresh.open()
  expect(f.dependencies.fetchStatus).toHaveBeenCalledOnce()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  expect(f.dependencies.createChannel).toHaveBeenCalledTimes(2)
  fresh.close()
})

it.each([null, 'unknown', 'DIRECT'])('rejects a missing or unknown server-selected transport: %s', async transport => {
  const f = fixture('direct')
  f.dependencies.fetchStatus.mockResolvedValue(Response.json({ status: 'ready', ...(transport == null ? {} : { transport }) }))
  await expect(f.port.prepare()).rejects.toMatchObject({ reason: 'check-failed' })
  expect(f.dependencies.prepareDevice).not.toHaveBeenCalled()
  expect(f.dependencies.createChannel).not.toHaveBeenCalled()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
})

it('does not retry a direct conflict that is not identity-required', async () => {
  const f = fixture('direct')
  f.dependencies.prepareDevice.mockResolvedValue(Response.json({ error: 'provider-failed' }, { status: 409 }))
  const connection = f.port.create(f.scope)
  await expect(connection.open()).rejects.toMatchObject({ reason: 'check-failed' })
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.fetchStatus).toHaveBeenCalledOnce()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
})

it('does not switch transports during direct identity recovery', async () => {
  const f = fixture('direct')
  await f.port.prepare()
  f.dependencies.prepareDevice.mockResolvedValue(Response.json({ error: 'identity-required' }, { status: 409 }))
  f.dependencies.fetchStatus.mockResolvedValue(Response.json({ status: 'ready', transport: 'relay' }))
  const connection = f.port.create(f.scope)
  await expect(connection.open()).rejects.toMatchObject({ reason: 'check-failed' })
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.createChannel).not.toHaveBeenCalled()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
})

it('discards a status recovery finishing after cancellation without issuing the second prepare', async () => {
  const f = fixture('direct')
  await f.port.prepare()
  let complete!: (response: Response) => void
  f.dependencies.prepareDevice.mockResolvedValue(Response.json({ error: 'identity-required' }, { status: 409 }))
  f.dependencies.fetchStatus.mockImplementation(() => new Promise(resolve => { complete = resolve }))
  const connection = f.port.create(f.scope)
  const opening = connection.open()
  await vi.waitFor(() => expect(f.dependencies.fetchStatus).toHaveBeenCalledTimes(2))
  f.abort.abort(); connection.close()
  complete(Response.json({ status: 'ready', transport: 'direct' }))
  await opening
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.createChannel).not.toHaveBeenCalled()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
})

it('uses one twenty-second direct recovery deadline without extending it for the retry', async () => {
  const f = fixture('direct')
  await f.port.prepare()
  const clock = new AbortController()
  const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(clock.signal)
  let attempts = 0
  f.dependencies.prepareDevice.mockImplementation(signal => {
    if (attempts++ === 0) return Promise.resolve(Response.json({ error: 'identity-required' }, { status: 409 }))
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')), { once: true }))
  })
  try {
    const connection = f.port.create(f.scope)
    const opening = connection.open()
    await vi.waitFor(() => expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2))
    expect(timeout).toHaveBeenCalledExactlyOnceWith(20000)
    clock.abort()
    await expect(opening).rejects.toMatchObject({ reason: 'check-failed' })
    expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
    expect(f.dependencies.openMic).not.toHaveBeenCalled()
  } finally { timeout.mockRestore() }
})
