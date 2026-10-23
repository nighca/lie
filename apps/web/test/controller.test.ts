import { describe, expect, it } from 'vitest'

import { createGameController } from '../src/application/controller'
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
    await controller.startInput()
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
    await controller.load('test'); controller.start(); await controller.startInput()
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
    await controller.startInput()
    expect(turns[1].scope.readContext().profile).toBe(game.characters[1].profile)
    controller.selectCharacter('one')
    expect(controller.getView().history).toMatchObject([{ text: '尚未播完的一句。', interrupted: true }])
    controller.dispose()
  })

  it('stops capture on accusation, retains wrong-attempt history, reveals and restarts a fresh session', async () => {
    const { controller, turns } = setup()
    await controller.load('test'); controller.start(); await controller.startInput()
    const first = turns[0]
    controller.finishInput()
    expect(first.finished).toBe(true)
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
    controller.restart(); controller.start(); await controller.startInput()
    expect(turns[1].scope.sessionId).not.toBe(first.scope.sessionId)
    expect(controller.getView().history).toEqual([])
    first.scope.onEvent({ type: 'userText', text: '旧局回包。' })
    expect(controller.getView().history).toEqual([])
    controller.dispose()
  })

  it('handles interruption, failure and end without contaminating a later turn', async () => {
    const { controller, turns } = setup()
    await controller.load('test'); controller.start(); await controller.startInput()
    turns[0].scope.onEvent({ type: 'assistantText', text: '部分回答。' })
    controller.interrupt()
    expect(controller.getView().notice).toContain('已显示转写保留')
    await controller.startInput()
    turns[0].scope.onEvent({ type: 'idle' })
    expect(controller.getView().voiceStatus).toBe('recording')
    turns[1].scope.onEvent({ type: 'error' })
    expect(controller.getView().voiceStatus).toBe('error')
    expect(turns[1].closed).toBe(true)
    await controller.startInput()
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
    const starting = controller.startInput()
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
    await controller.load('test'); controller.start(); await controller.startInput()
    expect(controller.getView()).toMatchObject({ voiceStatus: 'error', busy: false })
    voice.create = original
    await controller.startInput()
    expect(controller.getView().voiceStatus).toBe('recording')
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
