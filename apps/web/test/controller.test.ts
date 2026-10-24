import { afterEach, describe, expect, it, vi } from 'vitest'

import { createGameController } from '../src/application/controller'
import { VoiceAvailabilityError } from '../src/application/voice'
import { observePageLifecycle } from '../src/application/pageLifecycle'
import { game, setup } from './helpers'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

describe('browser orchestration', () => {
  it('projects only public fields and gives a tool only its own character context', async () => {
    const { controller, turns } = setup()
    await controller.load('test')
    expect(controller.getView().characters[0]).toEqual({ id: 'one', name: '甲', appearanceId: null })
    expect(controller.getView().reveal).toBeNull()
    controller.start()
    await controller.startConversation()
    const context = turns[0].scope.readContext()
    expect(context.profile).toBe(game.characters[0].profile)
    expect(context.history).toEqual([])
    expect(JSON.stringify(context)).not.toContain(game.characters[1].profile)
    expect(JSON.stringify(context)).not.toContain(game.ending.reveal)
    turns[0].scope.onEvent({ type: 'userText', text: '我说乙已经认罪。' })
    expect(turns[0].scope.readContext().history[0].text).toBe('我说乙已经认罪。')
    expect(turns[0].scope.readContext().profile).toBe(game.characters[0].profile)
    controller.dispose()
  })

  it('flushes visible partial text before switching and rejects stale events and tools', async () => {
    const { controller, turns } = setup()
    await controller.load('test'); controller.start(); await controller.startConversation()
    const old = turns[0]
    old.scope.onEvent({ type: 'assistantText', text: '尚未播完的一句。' })
    expect(controller.getView().history[0].text).toBe('尚未播完的一句。')
    controller.selectCharacter('two')
    expect(old.closed).toBe(true)
    expect(old.scope.signal.aborted).toBe(true)
    expect(() => old.scope.readContext()).toThrow('no longer active')
    old.scope.onEvent({ type: 'assistantText', text: '迟到回包。' })
    old.scope.onEvent({ type: 'error' })
    expect(controller.getView().history).toEqual([])
    expect(controller.getView().voiceStatus).toBe('idle')
    await controller.startConversation()
    expect(turns[1].scope.readContext().profile).toBe(game.characters[1].profile)
    controller.selectCharacter('one')
    expect(controller.getView().history).toMatchObject([{ text: '尚未播完的一句。', interrupted: true }])
    controller.dispose()
  })

  it('stops capture on accusation, retains wrong-attempt history, reveals and restarts a fresh session', async () => {
    const { controller, turns } = setup()
    await controller.load('test'); controller.start(); await controller.startConversation()
    const first = turns[0]
    first.scope.onEvent({ type: 'assistantText', text: '已显示的话。' })
    controller.openAccusation()
    expect(first.closed).toBe(true)
    expect(controller.getView().history[0]).toMatchObject({ text: '已显示的话。', interrupted: true })
    controller.accuse('two')
    expect(controller.getView()).toMatchObject({ phase: 'interrogating', accusationOpen: true, reveal: null })
    controller.closeAccusation()
    expect(controller.getView().history).toHaveLength(1)
    controller.openAccusation(); controller.accuse('one')
    expect(controller.getView()).toMatchObject({ phase: 'solved', accusationOpen: false, reveal: game.ending.reveal })
    controller.restart(); controller.start(); await controller.startConversation()
    expect(turns[1].scope.sessionId).not.toBe(first.scope.sessionId)
    expect(controller.getView().history).toEqual([])
    first.scope.onEvent({ type: 'userText', text: '旧局回包。' })
    expect(controller.getView().history).toEqual([])
    controller.dispose()
  })

  it('handles interruption, failure and end without contaminating a later turn', async () => {
    const { controller, turns } = setup()
    await controller.load('test'); controller.start(); await controller.startConversation()
    turns[0].scope.onEvent({ type: 'assistantText', text: '部分回答。' })
    controller.endConversation()
    expect(controller.getView().notice).toContain('已显示转写保留')
    await controller.startConversation()
    turns[0].scope.onEvent({ type: 'listening' })
    expect(controller.getView().voiceStatus).toBe('recording')
    turns[1].scope.onEvent({ type: 'error' })
    expect(controller.getView().voiceStatus).toBe('error')
    expect(turns[1].closed).toBe(true)
    await controller.startConversation()
    turns[2].scope.onEvent({ type: 'assistantText', text: '结束前可见。' })
    controller.end()
    expect(turns[2].closed).toBe(true)
    expect(controller.getView().phase).toBe('ended')
    expect(() => turns[2].scope.readContext()).toThrow()
    controller.restart()
    expect(controller.getView().phase).toBe('intro')
    controller.dispose()
  })

  it('ignores an opening connection that resolves after the character changes', async () => {
    const opening = deferred<void>()
    const { controller, voice, turns } = setup()
    const original = voice.create
    voice.create = (scope) => ({ ...original(scope), open: () => opening.promise })
    await controller.load('test'); controller.start()
    const starting = controller.startConversation()
    controller.selectCharacter('two')
    opening.resolve()
    await starting
    expect(turns[0].closed).toBe(true)
    expect(controller.getView()).toMatchObject({ currentCharacterId: 'two', busy: false, voiceStatus: 'idle' })
    controller.dispose()
  })

  it('reports a failed connection and allows a subsequent attempt', async () => {
    const { controller, voice } = setup()
    const original = voice.create
    voice.create = (scope) => ({ ...original(scope), async open() { throw new Error('Connection failed') } })
    await controller.load('test'); controller.start(); await controller.startConversation()
    expect(controller.getView()).toMatchObject({ voiceStatus: 'error', busy: false })
    voice.create = original
    await controller.startConversation()
    expect(controller.getView().voiceStatus).toBe('recording')
    controller.dispose()
  })

  it.each([
    ['unavailable', '当前环境尚未开放语音体验'],
    ['check-failed', '检查网络'],
  ] as const)('explains %s without consuming interrogation time', async (reason, message) => {
    const { controller, voice } = setup()
    voice.create = () => ({ async open() { throw new VoiceAvailabilityError(reason) }, close() {} })
    await controller.load('test'); controller.start(); await controller.startConversation()
    expect(controller.getView()).toMatchObject({ voiceStatus: 'idle', conversationActive: false, interrogationRemainingMs: 480000 })
    expect(controller.getView().notice).toContain(message)
    controller.selectCharacter('two')
    controller.dispose()
  })

  it('keeps the newest load, including when an older failed request finishes late', async () => {
    const old = deferred<unknown>()
    const controller = createGameController({ readGame: (id) => id === 'old' ? old.promise : Promise.resolve(game), voice: setup().voice, newSessionId: () => 'new', now: () => 0 })
    const first = controller.load('old')
    await controller.load('test')
    old.reject(new Error('Late failure'))
    await first
    expect(controller.getView()).toMatchObject({ phase: 'intro', title: game.title })
    await controller.load('mismatched-id')
    expect(controller.getView().phase).toBe('failed')
    controller.dispose()
  })
})


afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('continuous conversation and shared budget', () => {
  function timedSetup(seconds = 2) {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    return setup({ now: Date.now, setTimeout, clearTimeout }, { ...game, interrogationLimitSeconds: seconds })
  }

  it('keeps the same conversation over multiple answers and preserves interrupted partial text', async () => {
    const { controller, turns } = timedSetup(10)
    await controller.load('test'); controller.start(); await controller.startConversation()
    const turn = turns[0]
    for (const text of ['第一轮。', '第二轮。']) {
      turn.scope.onEvent({ type: 'userText', text: '问题。' })
      expect(controller.getView().voiceStatus).toBe('waiting')
      turn.scope.onEvent({ type: 'assistantText', text })
      turn.scope.onEvent({ type: 'listening' })
      expect(controller.getView()).toMatchObject({ conversationActive: true, voiceStatus: 'recording' })
    }
    turn.scope.onEvent({ type: 'assistantText', text: '未播完。' })
    turn.scope.onEvent({ type: 'interrupted' })
    expect(controller.getView().history.at(-1)).toMatchObject({ text: '未播完。', interrupted: true })
    expect(turns).toHaveLength(1)
    expect(turn.closed).toBe(false)
    controller.dispose()
  })

  it('excludes preparation, pauses on end and shares usage across characters', async () => {
    const { controller, voice, turns } = timedSetup()
    const preparation = deferred<void>()
    const create = voice.create
    voice.create = (scope) => ({ ...create(scope), open: () => preparation.promise })
    await controller.load('test'); controller.start()
    const opening = controller.startConversation()
    vi.advanceTimersByTime(4000)
    expect(controller.getView()).toMatchObject({ busy: true, interrogationRemainingMs: 2000 })
    preparation.resolve(); await opening
    vi.advanceTimersByTime(300)
    turns[0].scope.onEvent({ type: 'userText', text: '等待期间也计时。' })
    vi.advanceTimersByTime(200)
    controller.endConversation()
    expect(controller.getView().interrogationRemainingMs).toBe(1500)
    vi.advanceTimersByTime(3000)
    expect(controller.getView().interrogationRemainingMs).toBe(1500)
    controller.selectCharacter('two')
    voice.create = create
    await controller.startConversation()
    vi.advanceTimersByTime(400)
    turns[1].scope.onEvent({ type: 'speaking' })
    vi.advanceTimersByTime(100)
    controller.selectCharacter('one')
    expect(controller.getView().interrogationRemainingMs).toBe(1000)
    expect(turns[1].closed).toBe(true)
    controller.dispose()
  })

  it('expires into accusation, stops all capture, retains history and permits retry but no more inquiry', async () => {
    const { controller, turns } = timedSetup(1)
    await controller.load('test'); controller.start(); await controller.startConversation()
    turns[0].scope.onEvent({ type: 'assistantText', text: '可回看的回答。' })
    vi.advanceTimersByTime(1000)
    expect(controller.getView()).toMatchObject({ phase: 'interrogating', accusationOpen: true, interrogationRemainingMs: 0, conversationActive: false })
    expect(turns[0].closed).toBe(true)
    expect(turns[0].scope.signal.aborted).toBe(true)
    expect(controller.getView().history[0]).toMatchObject({ text: '可回看的回答。', interrupted: true })
    controller.accuse('two')
    expect(controller.getView().accusationFeedback).toContain('再次指认')
    controller.closeAccusation()
    await controller.startConversation()
    expect(turns).toHaveLength(1)
    controller.openAccusation(); controller.accuse('one')
    expect(controller.getView().phase).toBe('solved')
    controller.restart()
    expect(controller.getView()).toMatchObject({ phase: 'intro', interrogationRemainingMs: 1000, history: [] })
    vi.advanceTimersByTime(3000)
    expect(controller.getView().accusationOpen).toBe(false)
    controller.dispose()
  })

  it('cancels a preparing connection without charge and isolates late readiness from a new session', async () => {
    const { controller, voice, turns } = timedSetup()
    const preparation = deferred<void>()
    const create = voice.create
    voice.create = (scope) => ({ ...create(scope), open: () => preparation.promise })
    await controller.load('test'); controller.start()
    const opening = controller.startConversation()
    vi.advanceTimersByTime(5000)
    controller.endConversation()
    expect(controller.getView()).toMatchObject({ interrogationRemainingMs: 2000, conversationActive: false, busy: false })
    expect(turns[0].closed).toBe(true)
    controller.restart(); controller.start()
    voice.create = create
    await controller.startConversation()
    preparation.resolve(); await opening
    vi.advanceTimersByTime(100)
    controller.endConversation()
    expect(controller.getView().interrogationRemainingMs).toBe(1900)
    controller.dispose()
  })

  it('settles time on disconnect, accusation, hiding and disposal without automatic resume', async () => {
    const { controller, turns } = timedSetup(10)
    const leave = observePageLifecycle(controller, document, window)
    await controller.load('test'); controller.start(); await controller.startConversation()
    vi.advanceTimersByTime(100)
    turns[0].scope.onEvent({ type: 'closed' })
    expect(controller.getView()).toMatchObject({ interrogationRemainingMs: 9900, voiceStatus: 'error', conversationActive: false })
    await controller.startConversation(); vi.advanceTimersByTime(100)
    controller.openAccusation()
    expect(controller.getView().interrogationRemainingMs).toBe(9800)
    controller.closeAccusation(); await controller.startConversation(); vi.advanceTimersByTime(100)
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(controller.getView()).toMatchObject({ interrogationRemainingMs: 9700, conversationActive: false })
    expect(turns[2].closed).toBe(true)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(turns).toHaveLength(3)
    await controller.startConversation(); vi.advanceTimersByTime(100)
    window.dispatchEvent(new Event('pagehide'))
    expect(controller.getView()).toMatchObject({ interrogationRemainingMs: 9600, conversationActive: false })
    expect(turns[3].closed).toBe(true)
    vi.advanceTimersByTime(10000)
    expect(controller.getView().accusationOpen).toBe(false)
    leave()
  })

  it.each(['endConversation', 'selectCharacter', 'openAccusation'] as const)('handles expiry before a delayed timer when %s arrives first', async (action) => {
    const { controller, turns } = timedSetup(1)
    await controller.load('test'); controller.start(); await controller.startConversation()
    vi.setSystemTime(1100)
    if (action === 'selectCharacter') controller.selectCharacter('two')
    else controller[action]()
    expect(controller.getView()).toMatchObject({ interrogationRemainingMs: 0, accusationOpen: true, conversationActive: false })
    expect(controller.getView().notice).toContain('询问时间已用完')
    expect(turns[0].closed).toBe(true)
    controller.restart()
    vi.advanceTimersByTime(5000)
    expect(controller.getView()).toMatchObject({ phase: 'intro', accusationOpen: false, interrogationRemainingMs: 1000 })
    controller.dispose()
  })

})
