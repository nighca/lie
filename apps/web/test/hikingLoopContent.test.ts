import { describe, expect, it } from 'vitest'

import { accuse, appendDialogue, buildCharacterContext, consumeInterrogationTime, createGameSession, getInterrogationRemainingMs, selectCharacter, startSession, validateGame } from '@lie/game-core'

import authoredCase from '../../../content/games/02-hiking-loop.json'
import characterPresets from '../public/appearances/manifest.json'
import { readBundledCase } from '../src/application/bundledCases'

const game = validateGame(authoredCase)

describe('hiking loop canonical content', () => {
  it('loads three existing appearances with a six-minute questioning allowance', () => {
    expect(readBundledCase(game.id)).toEqual(game)
    expect(game.characters.map(({ name, appearanceId }) => [name, appearanceId])).toEqual([
      ['小岳', 'ochre-freckles'], ['阿宁', 'coral-bob'], ['老赵', 'salt-pepper-beard'],
    ])
    expect(game.interrogationLimitSeconds).toBe(360)
    for (const character of game.characters) {
      expect(characterPresets.find(({ id }) => id === character.appearanceId)).toBeDefined()
    }
  })

  it('shares time across all three people and isolates their actual contexts and history', () => {
    let session = startSession(createGameSession(game, { sessionId: 'hiking', now: 1 }), 2)
    expect(getInterrogationRemainingMs(session)).toBe(360_000)
    for (const character of game.characters) {
      session = selectCharacter(session, character.id)
      session = appendDialogue(session, character.id, { id: character.id, role: 'user', text: '午饭之后你走了哪儿？', at: 3, interrupted: false })
      const context = buildCharacterContext(game, character.id, session.histories[character.id])
      expect(context.profile).toBe(character.profile)
      expect(context.history.map(({ id }) => id)).toEqual([character.id])
      for (const other of game.characters.filter(({ id }) => id !== character.id)) {
        expect(context.systemPrompt.includes(other.profile)).toBe(false)
      }
      session = consumeInterrogationTime(session, 20_000)
    }
    expect(getInterrogationRemainingMs(session)).toBe(300_000)
    expect(Object.keys(session.histories)).toHaveLength(3)
  })

  it.each(['yue', 'ning', 'xu'])('ends a choice of %s and reveals only the non-finisher', (id) => {
    const running = startSession(createGameSession(game, { sessionId: id, now: 1 }), 2)
    const result = accuse(running, id, 3)
    expect(result.phase).toBe(id === 'yue' ? 'solved' : 'lost')
    expect(result.result!.reveal).toBe(id === 'yue' ? game.ending.reveal : null)
    expect(() => accuse(result, 'yue', 4)).toThrow('invalid-phase')
  })
})
