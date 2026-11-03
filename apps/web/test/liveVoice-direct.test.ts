import type { VoiceStartupObservation } from '@lie/voice'
import { expect, it, vi } from 'vitest'

import { createLiveVoicePort } from '../src/application/liveVoice'
import { descriptor, voiceFixture } from './liveVoice-fixture'

it.each(['relay', 'direct'] as const)('prepares %s once and shares that case result across opens', async transport => {
  const f = voiceFixture(transport)
  await Promise.all([f.port.prepare(), f.port.prepare()])
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
  for (let index = 0; index < 2; index++) {
    const connection = f.port.create(f.scope)
    await connection.open()
    const options = f.dependencies.createChannel.mock.calls[index][0]
    if (transport === 'direct') expect(options.directConnection).toEqual({ url: descriptor.url, deviceId: descriptor.deviceId, clientId: descriptor.clientId, token: descriptor.token, maxSessionSeconds: descriptor.maxSessionSeconds })
    else expect(options).not.toHaveProperty('directConnection')
    connection.close()
  }
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
})

it.each([null, 'unknown', 'DIRECT'])('rejects missing or unknown preparation transport: %s', async transport => {
  const f = voiceFixture()
  f.dependencies.prepareDevice.mockResolvedValue(Response.json({ ...descriptor, transport }))
  await expect(f.port.prepare()).rejects.toMatchObject({ reason: 'check-failed' })
  expect(f.dependencies.createChannel).not.toHaveBeenCalled()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
})

it.each(['http', 'endpoint', 'legacy-204'])('rejects %s preparation before microphone or socket creation', async failure => {
  const f = voiceFixture()
  f.dependencies.prepareDevice.mockResolvedValue(failure === 'legacy-204' ? new Response(null, { status: 204 })
    : Response.json({ ...descriptor, url: 'wss://other.example/ws' }, { status: failure === 'http' ? 502 : 200 }))
  const connection = f.port.create(f.scope)
  await expect(connection.open()).rejects.toMatchObject({ reason: 'check-failed' })
  expect(f.dependencies.createChannel).not.toHaveBeenCalled()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
})

it('retains a failed preparation until explicit reset, including identity conflicts', async () => {
  const f = voiceFixture()
  f.dependencies.prepareDevice.mockResolvedValue(Response.json({ error: 'identity-required' }, { status: 409 }))
  await expect(f.port.prepare()).rejects.toMatchObject({ reason: 'check-failed' })
  for (let index = 0; index < 2; index++) await expect(f.port.create(f.scope).open()).rejects.toMatchObject({ reason: 'check-failed' })
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  f.port.reset()
  f.dependencies.prepareDevice.mockResolvedValue(Response.json({ ...descriptor, token: 'explicit-retry-token' }))
  const fresh = f.port.create(f.scope)
  await fresh.open()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  expect(f.dependencies.createChannel.mock.calls[0][0].directConnection?.token).toBe('explicit-retry-token')
  fresh.close()
})

it('discards a cancelled conversation while preserving the shared preparation for another turn', async () => {
  const f = voiceFixture()
  let complete!: (response: Response) => void
  f.dependencies.prepareDevice.mockImplementation(() => new Promise(resolve => { complete = resolve }))
  const old = f.port.create(f.scope), opening = old.open()
  await vi.waitFor(() => expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce())
  const signal = f.dependencies.prepareDevice.mock.calls[0][0]
  f.abort.abort(); old.close()
  expect(signal.aborted).toBe(false)
  complete(Response.json(descriptor))
  await opening
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
  const next = f.port.create({ ...f.scope, signal: new AbortController().signal, isCurrent: () => true })
  await next.open()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.createChannel).toHaveBeenCalledOnce()
  next.close()
})

it('never replaces a new case descriptor with an old response after reset', async () => {
  const f = voiceFixture()
  let complete!: (response: Response) => void
  f.dependencies.prepareDevice.mockImplementationOnce(() => new Promise(resolve => { complete = resolve }))
  const old = f.port.create(f.scope), opening = old.open()
  await vi.waitFor(() => expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce())
  const oldSignal = f.dependencies.prepareDevice.mock.calls[0][0]
  f.port.reset()
  expect(oldSignal.aborted).toBe(true)
  f.dependencies.prepareDevice.mockResolvedValue(Response.json({ ...descriptor, token: 'new-case-token' }))
  const fresh = f.port.create(f.scope)
  await fresh.open()
  complete(Response.json({ ...descriptor, token: 'old-case-token' }))
  await opening
  expect(f.dependencies.createChannel).toHaveBeenCalledOnce()
  expect(f.dependencies.createChannel.mock.calls[0][0].directConnection?.token).toBe('new-case-token')
  expect(f.dependencies.openMic).toHaveBeenCalledOnce()
  fresh.close(); old.close()
})

it('does not issue another preparation automatically after transport failure', async () => {
  const f = voiceFixture()
  f.channel.open.mockRejectedValueOnce(new Error('Transport failed'))
  await expect(f.port.create(f.scope).open()).rejects.toThrow('Transport failed')
  const next = f.port.create(f.scope)
  await next.open()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  next.close()
})

it('does not open the same conversation twice', async () => {
  const f = voiceFixture(), connection = f.port.create(f.scope)
  const opening = connection.open()
  await expect(connection.open()).rejects.toThrow('only be opened once')
  await opening
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.createChannel).toHaveBeenCalledOnce()
  connection.close()
})

it.each(['response', 'json'] as const)('reports late preparation %s as failed on timeout and cancelled after reset', async stage => {
  for (const cancellation of ['deadline', 'reset']) {
    const events: VoiceStartupObservation[] = []
    const f = voiceFixture('direct', event => events.push(event))
    const clock = new AbortController()
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(clock.signal)
    let complete!: () => void
    const response = Response.json(descriptor)
    const json = vi.spyOn(response, 'json')
    if (stage === 'response') f.dependencies.prepareDevice.mockImplementation(() => new Promise(resolve => { complete = () => resolve(response) }))
    else {
      json.mockImplementation(() => new Promise(resolve => { complete = () => resolve(descriptor) }))
      f.dependencies.prepareDevice.mockResolvedValue(response)
    }
    try {
      const connection = f.port.create(f.scope), opening = connection.open()
      await vi.waitFor(() => expect(stage === 'response' ? f.dependencies.prepareDevice : json).toHaveBeenCalledOnce())
      if (cancellation === 'reset') { f.port.reset(); connection.close() }
      clock.abort(); complete()
      if (cancellation === 'deadline') await expect(opening).rejects.toMatchObject({ reason: 'check-failed' })
      else await expect(opening).resolves.toBeUndefined()
      expect(events).toContainEqual(expect.objectContaining({ stage: 'startup', result: cancellation === 'deadline' ? 'failed' : 'cancelled' }))
      expect(f.dependencies.openMic).not.toHaveBeenCalled()
      expect(f.dependencies.createChannel).not.toHaveBeenCalled()
      if (cancellation === 'deadline') {
        await expect(f.port.prepare()).rejects.toMatchObject({ reason: 'check-failed' })
        expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
      }
    } finally { timeout.mockRestore() }
  }
})

it('keeps a completed preparation after its request deadline instead of treating it as a token TTL', async () => {
  const f = voiceFixture(), clock = new AbortController()
  const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(clock.signal)
  try {
    await f.port.prepare()
    clock.abort()
    const connection = f.port.create(f.scope)
    await connection.open()
    expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
    connection.close()
  } finally { timeout.mockRestore() }
})

it('uses one same-origin no-store POST prepare with no body for the default adapter', async () => {
  const request = vi.fn(async (_url: string, _options: RequestInit) => Response.json(descriptor))
  vi.stubGlobal('fetch', request)
  try {
    const port = createLiveVoicePort()
    await Promise.all([port.prepare(), port.prepare()])
    expect(request).toHaveBeenCalledExactlyOnceWith('/api/voice/prepare', expect.objectContaining({ method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: expect.any(AbortSignal) }))
    expect(request.mock.calls[0][1]).not.toHaveProperty('body')
    port.reset()
  } finally { vi.unstubAllGlobals() }
})
