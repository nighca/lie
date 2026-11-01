import { describe, expect, it } from 'vitest'

import { accuse, appendDialogue, buildCharacterContext, consumeInterrogationTime, createGameSession, getInterrogationRemainingMs, selectCharacter, startSession, validateGame } from '@lie/game-core'

import authoredCase from '../../../content/games/01-jiangsu-local.json'
import characterPresets from '../public/appearances/manifest.json'
import { readBundledCase } from '../src/application/bundledCases'

const game = validateGame(authoredCase)

describe('Jiangsu podcast starter content', () => {
  it('loads two existing appearances with one two-minute questioning allowance', () => {
    expect(readBundledCase(game.id)).toEqual(game)
    expect(game.characters.map(({ name, appearanceId }) => [name, appearanceId])).toEqual([
      ['小周', 'blue-glasses'], ['小陈', 'plum-crop'],
    ])
    expect(game.interrogationLimitSeconds).toBe(120)
    for (const character of game.characters) {
      expect(characterPresets.find(({ id }) => id === character.appearanceId)).toBeDefined()
    }
  })

  it('keeps the two contexts separate and shares time across character switches', () => {
    let session = startSession(createGameSession(game, { sessionId: 'jiangsu', now: 1 }), 2)
    expect(getInterrogationRemainingMs(session)).toBe(120_000)
    for (const character of game.characters) {
      session = selectCharacter(session, character.id)
      session = appendDialogue(session, character.id, { id: character.id, role: 'user', text: '你哪里人？', at: 3, interrupted: false })
      const context = buildCharacterContext(game, character.id, session.histories[character.id])
      expect(context.profile).toBe(character.profile)
      expect(context.history.map(({ id }) => id)).toEqual([character.id])
      const other = game.characters.find(({ id }) => id !== character.id)!
      expect(context.systemPrompt.includes(other.profile)).toBe(false)
      session = consumeInterrogationTime(session, 30_000)
    }
    expect(getInterrogationRemainingMs(session)).toBe(60_000)
  })

  it.each(['zhou', 'chen'])('selects the real local rather than the impostor when choosing %s', (id) => {
    const session = startSession(createGameSession(game, { sessionId: id, now: 1 }), 2)
    const result = accuse(session, id, 3)
    expect(result.phase).toBe(id === 'chen' ? 'solved' : 'lost')
    expect(result.result!.reveal).toBe(id === 'chen' ? game.ending.reveal : null)
    expect(() => accuse(result, 'chen', 4)).toThrow('invalid-phase')
  })
})
