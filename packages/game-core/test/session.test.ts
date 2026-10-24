import { describe, expect, it } from 'vitest'

import { accuse, appendDialogue, createGameSession, endSession, GameStateError, restartSession, selectCharacter, startSession } from '../src'
import { dialogue, freezeDeep, threeCharacterPlaceholder, twoCharacterPlaceholder } from './fixtures'

describe('pure session lifecycle', () => {
  it('starts at the opening with a private content snapshot', () => {
    const game = twoCharacterPlaceholder()
    const session = createGameSession(game, { sessionId: 'run-a', now: 10 })
    expect(session).toMatchObject({ phase: 'intro', currentCharacterId: null, result: null, createdAt: 10, startedAt: null, endedAt: null })
    expect(session.histories).toEqual({ a: [], b: [] })
    expect(session.game).toEqual(game)
    expect(session.game).not.toBe(game)
    expect(session.game.characters[0]).not.toBe(game.characters[0])
  })

  it.each([twoCharacterPlaceholder, threeCharacterPlaceholder])('supports the content-defined character collection', (fixture) => {
    const game = fixture()
    const initial = freezeDeep(createGameSession(game, { sessionId: game.id, now: 1 }))
    const running = startSession(initial, 2)
    expect(running).toMatchObject({ phase: 'interrogating', currentCharacterId: 'a', startedAt: 2 })
    for (const character of game.characters) {
      expect(selectCharacter(running, character.id).currentCharacterId).toBe(character.id)
    }
    const solved = accuse(running, game.ending.culpritId, 3)
    expect(solved).toMatchObject({ phase: 'solved', currentCharacterId: null, endedAt: 3, result: { correct: true, reveal: game.ending.reveal } })
    expect(initial.phase).toBe('intro')
  })

  it.each([twoCharacterPlaceholder, threeCharacterPlaceholder])('ends the session after a wrong accusation without changing its history or revealing truth', (fixture) => {
    const game = fixture()
    const running = startSession(createGameSession(game, { sessionId: 'run', now: 1 }), 2)
    const spoken = appendDialogue(running, 'a', dialogue())
    const wrongId = game.characters.find((character) => character.id !== game.ending.culpritId)!.id
    const wrong = freezeDeep(accuse(spoken, wrongId, 3))
    expect(wrong).toMatchObject({ phase: 'lost', currentCharacterId: null, endedAt: 3, result: { characterId: wrongId, correct: false, reveal: null } })
    expect(wrong.histories.a).toEqual([dialogue()])
    expect(spoken.phase).toBe('interrogating')
    expect(() => selectCharacter(wrong, 'a')).toThrow('invalid-phase')
    expect(() => accuse(wrong, game.ending.culpritId, 4)).toThrow('invalid-phase')
    expect(() => accuse(wrong, wrongId, 4)).toThrow('invalid-phase')
    const restarted = restartSession(wrong, { sessionId: 'new', now: 4 })
    expect(restarted).toMatchObject({ sessionId: 'new', phase: 'intro', result: null, interrogationUsedMs: 0 })
    expect(Object.values(restarted.histories).every((history) => history.length === 0)).toBe(true)
  })

  it('ends without rewriting the answer or revealing the ending', () => {
    const running = freezeDeep(startSession(createGameSession(twoCharacterPlaceholder(), { sessionId: 'run', now: 1 }), 2))
    const ended = endSession(running, 3)
    expect(ended).toMatchObject({ phase: 'ended', currentCharacterId: null, endedAt: 3, result: null })
    expect(running.phase).toBe('interrogating')
  })

  it('restarts to a clean opening with a caller-provided identity and the same content', () => {
    const running = startSession(createGameSession(threeCharacterPlaceholder(), { sessionId: 'old', now: 1 }), 2)
    const spoken = appendDialogue(running, 'a', dialogue())
    const solved = freezeDeep(accuse(spoken, 'c', 3))
    const restarted = restartSession(solved, { sessionId: 'new', now: 4 })
    expect(restarted).toMatchObject({ sessionId: 'new', phase: 'intro', currentCharacterId: null, result: null, createdAt: 4, startedAt: null, endedAt: null })
    expect(restarted.histories).toEqual({ a: [], b: [], c: [] })
    expect(restarted.game).toEqual(solved.game)
    expect(solved.histories.a).toHaveLength(1)
  })

  it('rejects actions at invalid stages and unknown characters', () => {
    const initial = createGameSession(twoCharacterPlaceholder(), { sessionId: 'run', now: 1 })
    const running = startSession(initial, 2)
    const ended = endSession(running, 3)
    const solved = accuse(running, 'a', 3)
    const lost = accuse(running, 'b', 3)
    for (const session of [initial, ended, solved, lost]) {
      expect(() => selectCharacter(session, 'a')).toThrow('invalid-phase')
      expect(() => accuse(session, 'a', 4)).toThrow('invalid-phase')
      expect(() => endSession(session, 4)).toThrow('invalid-phase')
      expect(() => appendDialogue(session, 'a', dialogue())).toThrow('invalid-phase')
    }
    for (const session of [running, ended, solved, lost]) expect(() => startSession(session, 4)).toThrow('invalid-phase')
    expect(() => selectCharacter(running, 'missing')).toThrow(GameStateError)
    expect(() => accuse(running, 'missing', 4)).toThrow('unknown-character')
    expect(() => appendDialogue(running, 'missing', dialogue())).toThrow('unknown-character')
    expect(() => appendDialogue(running, 'b', dialogue())).toThrow('inactive-character')
  })
})

describe('dialogue ownership and isolation', () => {
  it('preserves each character history and deduplicates an entry without mutating inputs', () => {
    const running = freezeDeep(startSession(createGameSession(twoCharacterPlaceholder(), { sessionId: 'run', now: 1 }), 2))
    const entry = freezeDeep(dialogue())
    const first = appendDialogue(running, 'a', entry)
    expect(first.histories.a).toEqual([entry])
    expect(first.histories.a[0]).not.toBe(entry)
    expect(appendDialogue(first, 'a', { ...entry, text: '重复的修订' })).toBe(first)
    const switched = selectCharacter(first, 'b')
    const second = appendDialogue(switched, 'b', { ...dialogue('entry-2'), role: 'assistant', text: '乙自己的说法', interrupted: true })
    expect(second.histories.b).toEqual([{ id: 'entry-2', role: 'assistant', text: '乙自己的说法', at: 20, interrupted: true }])
    expect(selectCharacter(second, 'a').histories.a).toEqual([entry])
    expect(running.histories).toEqual({ a: [], b: [] })
    expect(second.game.ending).toEqual(running.game.ending)
  })

  it('keeps different games and runs independent even when character and entry IDs overlap', () => {
    const first = startSession(createGameSession(twoCharacterPlaceholder(), { sessionId: 'one', now: 1 }), 2)
    const sameGame = startSession(createGameSession(twoCharacterPlaceholder(), { sessionId: 'two', now: 1 }), 2)
    const otherGame = startSession(createGameSession(threeCharacterPlaceholder(), { sessionId: 'three', now: 1 }), 2)
    const spoken = appendDialogue(first, 'a', dialogue())
    expect(spoken.histories.a).toHaveLength(1)
    expect(sameGame.histories.a).toEqual([])
    expect(otherGame.histories.a).toEqual([])
    expect(accuse(otherGame, 'a', 3).result?.correct).toBe(false)
    expect(accuse(first, 'a', 3).result?.correct).toBe(true)
  })

  it('handles ordinary JSON IDs that coincide with object prototype property names', () => {
    const game = twoCharacterPlaceholder()
    const data = { ...game, characters: [{ ...game.characters[0], id: '__proto__' }, { ...game.characters[1], id: 'constructor' }], ending: { ...game.ending, culpritId: '__proto__' } }
    const session = startSession(createGameSession(data, { sessionId: 'run', now: 1 }), 2)
    expect(appendDialogue(session, '__proto__', dialogue()).histories['__proto__']).toEqual([dialogue()])
    expect(accuse(session, 'constructor', 3).result?.correct).toBe(false)
  })
})
