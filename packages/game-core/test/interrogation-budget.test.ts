import { describe, expect, it } from 'vitest'

import { accuse, appendDialogue, consumeInterrogationTime, createGameSession, endSession, getInterrogationRemainingMs, restartSession, selectCharacter, startSession } from '../src'
import { dialogue, freezeDeep, threeCharacterPlaceholder, twoCharacterPlaceholder } from './fixtures'

function runningSession() {
  return startSession(createGameSession(twoCharacterPlaceholder(), { sessionId: 'run', now: 1 }), 2)
}

describe('interrogation time budget', () => {
  it('starts with the full content-defined allowance and keeps games independent', () => {
    const first = createGameSession(twoCharacterPlaceholder(), { sessionId: 'first', now: 1 })
    const second = createGameSession(threeCharacterPlaceholder(), { sessionId: 'second', now: 1 })
    expect(first.interrogationUsedMs).toBe(0)
    expect(getInterrogationRemainingMs(first)).toBe(60000)
    expect(getInterrogationRemainingMs(second)).toBe(90000)
    const used = consumeInterrogationTime(startSession(first, 2), 15000)
    expect(getInterrogationRemainingMs(used)).toBe(45000)
    expect(first.interrogationUsedMs).toBe(0)
    expect(second.interrogationUsedMs).toBe(0)
  })

  it('accumulates fractional milliseconds immutably and caps at the allowance', () => {
    const initial = freezeDeep(runningSession())
    const first = freezeDeep(consumeInterrogationTime(initial, 12000.5))
    const second = consumeInterrogationTime(first, 7000.25)
    expect(second.interrogationUsedMs).toBe(19000.75)
    expect(getInterrogationRemainingMs(second)).toBe(40999.25)
    expect(initial.interrogationUsedMs).toBe(0)
    expect(first.interrogationUsedMs).toBe(12000.5)
    expect(consumeInterrogationTime(second, 0)).toEqual(second)
    const exhausted = freezeDeep(consumeInterrogationTime(second, 100000))
    expect(exhausted.interrogationUsedMs).toBe(60000)
    expect(getInterrogationRemainingMs(exhausted)).toBe(0)
    expect(consumeInterrogationTime(exhausted, Number.MAX_VALUE)).toEqual(exhausted)
  })

  it.each([-1, NaN, Infinity, -Infinity])('rejects invalid elapsed time %s', (elapsedMs) => {
    const session = freezeDeep(runningSession())
    expect(() => consumeInterrogationTime(session, elapsedMs)).toThrow(RangeError)
    expect(session.interrogationUsedMs).toBe(0)
  })

  it('only consumes during interrogation and retains readable remaining time afterward', () => {
    const initial = createGameSession(twoCharacterPlaceholder(), { sessionId: 'run', now: 1 })
    const running = consumeInterrogationTime(startSession(initial, 2), 1000)
    const ended = endSession(running, 3)
    const solved = accuse(running, 'a', 3)
    const lost = accuse(running, 'b', 3)
    for (const session of [initial, ended, solved, lost]) {
      expect(() => consumeInterrogationTime(session, 1000)).toThrow('invalid-phase')
    }
    expect(getInterrogationRemainingMs(ended)).toBe(59000)
    expect(getInterrogationRemainingMs(solved)).toBe(59000)
  })

  it('preserves shared usage through a terminal accusation, then resets on restart', () => {
    const spoken = appendDialogue(runningSession(), 'a', dialogue())
    const first = consumeInterrogationTime(spoken, 20000)
    const second = consumeInterrogationTime(selectCharacter(first, 'b'), 40000)
    expect(second.interrogationUsedMs).toBe(60000)
    expect(second.phase).toBe('interrogating')
    expect(second.result).toBeNull()
    const wrong = accuse(second, 'b', 3)
    expect(wrong.result?.correct).toBe(false)
    expect(getInterrogationRemainingMs(wrong)).toBe(0)
    expect(wrong.phase).toBe('lost')
    expect(wrong.histories.a).toEqual([dialogue()])
    expect(() => accuse(wrong, 'a', 4)).toThrow('invalid-phase')
    const restarted = restartSession(wrong, { sessionId: 'new', now: 5 })
    expect(restarted.interrogationUsedMs).toBe(0)
    expect(getInterrogationRemainingMs(restarted)).toBe(60000)
    expect(restarted.histories).toEqual({ a: [], b: [] })
  })
})
