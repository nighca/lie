import { describe, expect, it } from 'vitest'

import { createGameController } from '../src/application/controller'
import { game, setup } from './helpers'

describe('accusation result projection', () => {
  it.each([true, false])('projects the accused character instead of the last speaker (correct=%s)', async (correct) => {
    const content = { ...game, ending: { ...game.ending, culpritId: correct ? 'two' : 'one' } }
    const { controller, turns } = setup(undefined, content)
    try {
      expect(controller.getView().result).toBeNull()
      await controller.load('test')
      controller.start()
      await controller.startConversation()
      const previous = turns[0]
      expect(previous.scope.characterId).toBe('one')
      previous.scope.onEvent({ type: 'assistantText', text: '问甲得到的回答。' })
      controller.openAccusation()
      expect(previous.closed).toBe(true)
      expect(previous.scope.signal.aborted).toBe(true)
      expect(controller.getView().result).toBeNull()
      controller.accuse('two')
      const view = controller.getView()
      expect(view.currentCharacterId).toBeNull()
      expect(view.result).toEqual({ characterId: 'two', correct })
      expect(view.phase).toBe(correct ? 'solved' : 'lost')
      expect(view.reveal).toBe(correct ? game.ending.reveal : null)
      expect(Object.keys(view.result!).sort()).toEqual(['characterId', 'correct'])
      expect(JSON.stringify(view)).not.toContain('culpritId')
      expect(JSON.stringify(view)).not.toContain(game.characters[0].profile)
      expect(JSON.stringify(view)).not.toContain(game.characters[1].profile)
      if (!correct) expect(JSON.stringify(view)).not.toContain(game.ending.reveal)
      previous.scope.onEvent({ type: 'assistantText', text: '旧人物的迟到回答。' })
      previous.scope.onEvent({ type: 'error' })
      await controller.startConversation()
      controller.openAccusation()
      controller.accuse('one')
      expect(controller.getView()).toEqual(view)
      expect(turns).toHaveLength(1)
    } finally {
      controller.dispose()
    }
  })

  it('copies the result for every view and keeps old view mutations out of session state', async () => {
    const { controller } = setup()
    try {
      await controller.load('test')
      controller.start()
      controller.openAccusation()
      controller.accuse('two')
      const previous = controller.getView()
      const next = controller.getView()
      expect(previous.result).not.toBe(next.result)
      Object.assign(previous.result!, { characterId: 'forged', correct: true, reveal: 'injected' })
      expect(controller.getView().result).toEqual({ characterId: 'two', correct: false })
      expect(next.result).toEqual({ characterId: 'two', correct: false })
      expect(controller.getView().reveal).toBeNull()
      controller.restart()
      expect(controller.getView().result).toBeNull()
      expect(next.result).toEqual({ characterId: 'two', correct: false })
    } finally {
      controller.dispose()
    }
  })

  it.each([true, false])('clears completed result on restart and does not carry it into a later ended game (correct=%s)', async (correct) => {
    const { controller } = setup()
    try {
      await controller.load('test')
      controller.start()
      controller.openAccusation()
      controller.accuse(correct ? 'one' : 'two')
      expect(controller.getView().result?.correct).toBe(correct)
      expect(() => controller.end()).toThrow('invalid-phase')
      expect(controller.getView().result?.correct).toBe(correct)
      controller.restart()
      expect(controller.getView()).toMatchObject({ phase: 'intro', result: null, reveal: null })
      controller.start()
      controller.end()
      expect(controller.getView()).toMatchObject({ phase: 'ended', result: null, reveal: null })
    } finally {
      controller.dispose()
    }
  })

  it.each([true, false])('clears the old result immediately while loading and after load failure (fail=%s)', async (fail) => {
    let finish!: (value: unknown) => void
    let reject!: (error: Error) => void
    let reads = 0
    const controller = createGameController({
      readGame: () => ++reads === 1 ? Promise.resolve(game) : new Promise((resolve, rejectRead) => { finish = resolve; reject = rejectRead }),
      voice: { create() { throw new Error('This test does not open voice') } },
      newSessionId: () => 'result-session',
      now: () => 100,
    })
    try {
      await controller.load('test')
      controller.start()
      controller.openAccusation()
      controller.accuse('one')
      expect(controller.getView().result).toEqual({ characterId: 'one', correct: true })
      const loading = controller.load('next')
      expect(controller.getView()).toMatchObject({ phase: 'loading', result: null, reveal: null })
      if (fail) reject(new Error('unavailable'))
      else finish({ ...game, id: 'next' })
      await loading
      expect(controller.getView()).toMatchObject({ phase: fail ? 'failed' : 'intro', result: null, reveal: null })
    } finally {
      controller.dispose()
    }
  })
})
