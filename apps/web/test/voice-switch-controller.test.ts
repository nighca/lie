import { afterEach, describe, expect, it, vi } from 'vitest'

import { createGameController } from '../src/application/controller'
import type { ConversationScope, VoicePort } from '../src/application/voice'
import { VoiceAvailabilityError } from '../src/application/voice'
import { game } from './helpers'

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

async function prepare(seconds = 10) {
  vi.useFakeTimers()
  vi.setSystemTime(0)
  const turns: { scope: ConversationScope; ready: ReturnType<typeof deferred>; closed: boolean }[] = []
  let live = 0
  let peak = 0
  let sequence = 0
  const voice: VoicePort = {
    create(scope) {
      const ready = deferred()
      const turn = { scope, ready, closed: false }
      turns.push(turn)
      live++
      peak = Math.max(peak, live)
      return { open: () => ready.promise, close() { if (!turn.closed) { turn.closed = true; live-- } } }
    },
  }
  const content = {
    ...game,
    interrogationLimitSeconds: seconds,
    characters: [...game.characters, { id: 'three', name: '丙', profile: '丙的设定', appearanceId: null }],
  }
  const controller = createGameController({
    readGame: async () => content, voice, newSessionId: () => `session-${++sequence}`, now: Date.now,
    clock: { now: Date.now, setTimeout, clearTimeout },
  })
  await controller.load('test')
  controller.start()
  return { controller, turns, voice, peak: () => peak }
}

afterEach(() => { vi.useRealTimers() })

describe('voice switching and readiness', () => {
  it('starts the new person automatically, preserving histories and the shared budget', async () => {
    const { controller, turns, peak } = await prepare()
    const starting = controller.startConversation()
    turns[0].ready.resolve(); await starting
    turns[0].scope.onEvent({ type: 'userText', text: '甲的问题' })
    turns[0].scope.onEvent({ type: 'assistantText', text: '甲的半句' })
    vi.advanceTimersByTime(400)
    controller.selectCharacter('two')
    expect(turns[0].closed).toBe(true)
    expect(turns[0].scope.signal.aborted).toBe(true)
    expect(controller.getView()).toMatchObject({ currentCharacterId: 'two', busy: true, conversationActive: true, history: [], interrogationRemainingMs: 9600 })
    vi.advanceTimersByTime(2000)
    expect(controller.getView().interrogationRemainingMs).toBe(9600)
    turns[1].ready.resolve(); await Promise.resolve()
    turns[1].scope.onEvent({ type: 'userText', text: '乙的问题' })
    vi.advanceTimersByTime(200)
    controller.selectCharacter('one')
    expect(controller.getView().history).toMatchObject([{ text: '甲的问题' }, { text: '甲的半句', interrupted: true }])
    expect(turns[2].scope.readContext().history.map(entry => entry.text)).toEqual(['甲的问题', '甲的半句'])
    expect(controller.getView().interrogationRemainingMs).toBe(9400)
    expect(peak()).toBe(1)
    controller.dispose()
    turns[2].ready.resolve(); await Promise.resolve()
  })

  it('does not connect when switching before a conversation or after ending it, and same-person clicks do nothing', async () => {
    const { controller, turns } = await prepare()
    controller.selectCharacter('two')
    expect(turns).toHaveLength(0)
    const starting = controller.startConversation()
    controller.selectCharacter('two')
    expect(turns).toHaveLength(1)
    turns[0].ready.resolve(); await starting
    controller.selectCharacter('two')
    expect(turns).toHaveLength(1)
    controller.endConversation()
    controller.selectCharacter('three')
    expect(controller.getView()).toMatchObject({ currentCharacterId: 'three', conversationActive: false, busy: false })
    expect(turns).toHaveLength(1)
    controller.dispose()
  })

  it('keeps only the last intent during rapid switches, rejecting old events, errors and late readiness', async () => {
    const { controller, turns, peak } = await prepare()
    const starting = controller.startConversation()
    controller.selectCharacter('two')
    controller.selectCharacter('three')
    expect(turns.map(turn => turn.scope.characterId)).toEqual(['one', 'two', 'three'])
    expect(turns.slice(0, 2).every(turn => turn.closed && turn.scope.signal.aborted)).toBe(true)
    turns[2].ready.resolve(); await Promise.resolve()
    turns[0].scope.onEvent({ type: 'assistantText', text: '旧甲' })
    turns[1].scope.onEvent({ type: 'error' })
    expect(() => turns[1].scope.readContext()).toThrow('no longer active')
    turns[0].ready.resolve(); turns[1].ready.reject(new Error('迟到失败')); await starting
    await Promise.resolve()
    expect(controller.getView()).toMatchObject({ currentCharacterId: 'three', conversationActive: true, busy: false, voiceStatus: 'recording', history: [], notice: null })
    expect(peak()).toBe(1)
    controller.dispose()
  })

  it('ignores early meter, transcript and listening events until capture is ready, without charging preparation', async () => {
    const { controller, turns } = await prepare()
    const starting = controller.startConversation()
    const early = turns[0].scope
    early.onEvent({ type: 'listening' })
    early.onEvent({ type: 'userText', text: '准备中' })
    early.onEvent({ type: 'assistantText', text: '准备中' })
    early.onEvent({ type: 'audioLevel', inputLevel: 1, outputLevel: 1, inputActive: true })
    vi.advanceTimersByTime(30000)
    expect(controller.getView()).toMatchObject({ busy: true, conversationActive: true, history: [], interrogationRemainingMs: 10000 })
    expect(controller.getVoiceFeedback()).toEqual({ inputLevel: 0, outputLevel: 0, inputActive: false })
    turns[0].ready.resolve(); await starting
    early.onEvent({ type: 'userText', text: '已收音' })
    vi.advanceTimersByTime(100)
    expect(controller.getView()).toMatchObject({ busy: false, history: [{ text: '已收音' }], interrogationRemainingMs: 9900 })
    controller.dispose()
  })

  it.each(['endConversation', 'openAccusation', 'end', 'restart', 'dispose', 'load'] as const)('revokes a switched pending connection on %s with no late resume', async (action) => {
    const { controller, turns } = await prepare()
    const starting = controller.startConversation()
    controller.selectCharacter('two')
    if (action === 'load') await controller.load('test')
    else controller[action]()
    expect(turns[1].closed).toBe(true)
    turns[0].ready.resolve(); turns[1].ready.resolve(); await starting
    await Promise.resolve()
    expect(controller.getView()).toMatchObject({ conversationActive: false, busy: false, history: [] })
    expect(turns).toHaveLength(2)
    controller.dispose()
  })

  it.each(['closed', 'error'] as const)('exits preparation immediately on %s and ignores late success', async (type) => {
    const { controller, turns } = await prepare()
    const starting = controller.startConversation()
    turns[0].scope.onEvent({ type })
    expect(controller.getView()).toMatchObject({ busy: false, conversationActive: false, voiceStatus: 'error' })
    turns[0].ready.resolve(); await starting
    controller.selectCharacter('two')
    expect(turns).toHaveLength(1)
    controller.dispose()
  })

  it.each(['create', 'open', 'unavailable'] as const)('ends a failed auto-connect at %s without retrying or losing the selected person', async (failure) => {
    const { controller, turns, voice } = await prepare()
    const starting = controller.startConversation()
    turns[0].ready.resolve(); await starting
    if (failure === 'create') voice.create = () => { throw new Error('create failed') }
    controller.selectCharacter('two')
    if (failure !== 'create') turns[1].ready.reject(failure === 'unavailable' ? new VoiceAvailabilityError('unavailable') : new Error('open failed'))
    await Promise.resolve(); await Promise.resolve()
    expect(controller.getView()).toMatchObject({ currentCharacterId: 'two', busy: false, conversationActive: false, interrogationRemainingMs: 10000 })
    expect(controller.getView().notice).not.toBeNull()
    vi.advanceTimersByTime(30000)
    expect(turns).toHaveLength(failure === 'create' ? 1 : 2)
    controller.selectCharacter('three')
    expect(controller.getView().conversationActive).toBe(false)
    controller.dispose()
  })

  it('does not auto-connect after expiry even if the budget timer has not fired', async () => {
    const { controller, turns } = await prepare(1)
    const starting = controller.startConversation()
    turns[0].ready.resolve(); await starting
    vi.setSystemTime(1001)
    controller.selectCharacter('two')
    expect(controller.getView()).toMatchObject({ currentCharacterId: 'two', accusationOpen: true, interrogationRemainingMs: 0, conversationActive: false, busy: false })
    expect(turns).toHaveLength(1)
    controller.dispose()
  })
})
