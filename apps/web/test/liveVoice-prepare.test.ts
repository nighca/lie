import { expect, it, vi } from 'vitest'

import { createGameController } from '../src/application/controller'
import { descriptor, voiceFixture } from './liveVoice-fixture'
import { game } from './helpers'

function controller(f = voiceFixture()) {
  let number = 0
  const controller = createGameController({ readGame: async id => ({ ...game, id }), voice: f.port, now: () => 0, newSessionId: () => `case-${++number}` })
  return { ...f, controller }
}

it('starts prepare on the background page and opens by waiting for that same request', async () => {
  const f = controller()
  let complete!: (response: Response) => void
  f.dependencies.prepareDevice.mockImplementation(() => new Promise(resolve => { complete = resolve }))
  await f.controller.load('test')
  expect(f.controller.getView()).toMatchObject({ phase: 'intro', conversationActive: false, interrogationRemainingMs: 480000 })
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
  f.controller.start()
  const opening = f.controller.startConversation()
  expect(f.controller.getView().busy).toBe(true)
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  complete(Response.json(descriptor))
  await opening
  expect(f.dependencies.openMic).toHaveBeenCalledOnce()
  expect(f.controller.getView()).toMatchObject({ busy: false, conversationActive: true, voiceStatus: 'recording' })
  f.controller.selectCharacter('two')
  await vi.waitFor(() => expect(f.dependencies.createChannel).toHaveBeenCalledTimes(2))
  f.controller.endConversation()
  await f.controller.startConversation()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.createChannel.mock.calls.map(([options]) => options.directConnection?.token)).toEqual([descriptor.token, descriptor.token, descriptor.token])
  f.controller.dispose()
})

it('clears preparation on restart, another loaded case and disposal', async () => {
  const f = controller()
  let number = 0
  f.dependencies.prepareDevice.mockImplementation(async () => Response.json({ ...descriptor, token: `case-${++number}` }))
  await f.controller.load('first')
  const firstSignal = f.dependencies.prepareDevice.mock.calls[0][0]
  f.controller.restart()
  expect(firstSignal.aborted).toBe(true)
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  await f.controller.load('second')
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(3)
  f.controller.start()
  await f.controller.startConversation()
  expect(f.dependencies.createChannel.mock.calls[0][0].directConnection?.token).toBe('case-3')
  const currentSignal = f.dependencies.prepareDevice.mock.calls[2][0]
  f.controller.dispose()
  expect(currentSignal.aborted).toBe(true)
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(3)
})

it('does not use an old case descriptor finishing after restart', async () => {
  const f = controller()
  let complete!: (response: Response) => void
  f.dependencies.prepareDevice.mockImplementationOnce(() => new Promise(resolve => { complete = resolve }))
  await f.controller.load('test')
  f.controller.start()
  const oldOpening = f.controller.startConversation()
  f.dependencies.prepareDevice.mockResolvedValue(Response.json({ ...descriptor, token: 'restart-token' }))
  f.controller.restart()
  complete(Response.json({ ...descriptor, token: 'old-token' }))
  await oldOpening
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
  f.controller.start()
  await f.controller.startConversation()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  expect(f.dependencies.createChannel).toHaveBeenCalledOnce()
  expect(f.dependencies.createChannel.mock.calls[0][0].directConnection?.token).toBe('restart-token')
  f.controller.dispose()
})

it('cancels intro preparation when leaving and ignores its late JSON', async () => {
  const f = controller(), response = Response.json(descriptor)
  let complete!: (value: unknown) => void
  const json = vi.spyOn(response, 'json').mockImplementation(() => new Promise(resolve => { complete = resolve }))
  f.dependencies.prepareDevice.mockResolvedValue(response)
  await f.controller.load('test')
  await vi.waitFor(() => expect(json).toHaveBeenCalledOnce())
  const signal = f.dependencies.prepareDevice.mock.calls[0][0]
  const preparation = f.port.prepare()
  f.controller.dispose()
  expect(signal.aborted).toBe(true)
  complete(descriptor)
  await expect(preparation).rejects.toMatchObject({ reason: 'check-failed' })
  expect(f.dependencies.createChannel).not.toHaveBeenCalled()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
})

it('shows a cached background failure before the player explicitly retries preparation', async () => {
  const f = controller()
  f.dependencies.prepareDevice.mockResolvedValueOnce(new Response(null, { status: 502 }))
  await f.controller.load('test')
  f.controller.start()
  await f.controller.startConversation()
  expect(f.controller.getView()).toMatchObject({ voiceStatus: 'error', conversationActive: false, busy: false })
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
  await f.controller.startConversation()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  expect(f.controller.getView()).toMatchObject({ voiceStatus: 'recording', conversationActive: true })
  f.controller.dispose()
})

it('prepares again only when the player retries a failed transport', async () => {
  const f = controller()
  f.channel.open.mockRejectedValueOnce(new Error('Connection failed'))
  await f.controller.load('test')
  f.controller.start()
  await f.controller.startConversation()
  expect(f.controller.getView().voiceStatus).toBe('error')
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  await f.controller.startConversation()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  expect(f.controller.getView().voiceStatus).toBe('recording')
  f.controller.dispose()
})

it('keeps separate controller-owned preparations independent when the old controller is disposed late', async () => {
  const old = controller(), fresh = controller()
  let oldComplete!: (response: Response) => void
  old.dependencies.prepareDevice.mockImplementation(() => new Promise(resolve => { oldComplete = resolve }))
  await old.controller.load('old')
  await fresh.controller.load('new')
  const signal = fresh.dependencies.prepareDevice.mock.calls[0][0]
  old.controller.dispose()
  oldComplete(Response.json({ ...descriptor, token: 'old-token' }))
  expect(signal.aborted).toBe(false)
  fresh.controller.start()
  await fresh.controller.startConversation()
  expect(fresh.dependencies.createChannel.mock.calls[0][0].directConnection?.token).toBe(descriptor.token)
  expect(fresh.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(old.dependencies.openMic).not.toHaveBeenCalled()
  fresh.controller.dispose()
})

it('does not prepare for failed, superseded or disposed loads', async () => {
  const f = voiceFixture()
  let stale!: (value: unknown) => void, disposed!: (value: unknown) => void
  const readGame = vi.fn().mockImplementationOnce(() => new Promise(resolve => { stale = resolve })).mockRejectedValueOnce(new Error('failed')).mockImplementationOnce(() => new Promise(resolve => { disposed = resolve }))
  const c = createGameController({ readGame, voice: f.port, now: () => 0, newSessionId: () => 'test' })
  const oldLoad = c.load('old')
  await c.load('failed')
  stale(game)
  await oldLoad
  const lastLoad = c.load('disposed')
  c.dispose(); disposed(game)
  await lastLoad
  expect(f.dependencies.prepareDevice).not.toHaveBeenCalled()
})

it.each(['character', 'accusation'])('preserves the visible preparation error through %s controls until one explicit retry', async action => {
  const f = controller()
  f.dependencies.prepareDevice.mockResolvedValueOnce(new Response(null, { status: 502 }))
  await f.controller.load('test')
  f.controller.start()
  await f.controller.startConversation()
  if (action === 'character') f.controller.selectCharacter('two')
  else { f.controller.openAccusation(); f.controller.closeAccusation() }
  expect(f.controller.getView().voiceStatus).toBe('error')
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  await f.controller.startConversation()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  expect(f.controller.getView().voiceStatus).toBe('recording')
  f.controller.dispose()
})

it('switches a pending conversation onto the same failed preparation without an automatic retry', async () => {
  const f = controller()
  let complete!: (response: Response) => void
  f.dependencies.prepareDevice.mockImplementationOnce(() => new Promise(resolve => { complete = resolve }))
  await f.controller.load('test')
  f.controller.start()
  const opening = f.controller.startConversation()
  f.controller.selectCharacter('two')
  complete(new Response(null, { status: 502 }))
  await opening
  await vi.waitFor(() => expect(f.controller.getView().voiceStatus).toBe('error'))
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
  f.controller.dispose()
})

it('shows an unseen failure on the next open without retrying, then retries only on the following explicit action', async () => {
  const f = controller()
  let complete!: (response: Response) => void
  f.dependencies.prepareDevice.mockImplementationOnce(() => new Promise(resolve => { complete = resolve }))
  await f.controller.load('test')
  f.controller.start()
  const opening = f.controller.startConversation()
  f.controller.endConversation()
  complete(new Response(null, { status: 502 }))
  await opening
  expect(f.controller.getView().voiceStatus).toBe('idle')
  await f.controller.startConversation()
  expect(f.controller.getView().voiceStatus).toBe('error')
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  await f.controller.startConversation()
  expect(f.dependencies.prepareDevice).toHaveBeenCalledTimes(2)
  expect(f.controller.getView().voiceStatus).toBe('recording')
  f.controller.dispose()
})

it.each([[503, '当前环境尚未开放语音体验'], [502, '语音准备失败']] as const)('keeps configuration/provider failure %i messages distinct', async (status, message) => {
  const f = controller()
  f.dependencies.prepareDevice.mockResolvedValue(new Response(null, { status }))
  await f.controller.load('test')
  f.controller.start()
  await f.controller.startConversation()
  expect(f.controller.getView().notice).toContain(message)
  expect(f.dependencies.prepareDevice).toHaveBeenCalledOnce()
  expect(f.dependencies.openMic).not.toHaveBeenCalled()
  f.controller.dispose()
})
