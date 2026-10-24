import { describe, expect, it } from 'vitest'

import { accuse, appendDialogue, buildCharacterContext, consumeInterrogationTime, createGameSession, getInterrogationRemainingMs, restartSession, selectCharacter, startSession, validateGame } from '../src'
import { twoCharacterPlaceholder } from './fixtures'

function largerGame(count: number) {
  const original = twoCharacterPlaceholder()
  return validateGame({
    ...original,
    id: `variable-${count}`,
    characters: Array.from({ length: count }, (_, index) => ({
      id: `person-${index + 1}`, name: `人物${index + 1}`, profile: `只属于人物${index + 1}的资料`, appearanceId: null,
    })),
    ending: { culpritId: `person-${count}`, reveal: '人数由内容决定的结局' },
  })
}

describe('content packages beyond three characters', () => {
  it.each([4, 5])('keeps every history and shared budget across a %i-character case through both terminal outcomes', (count) => {
    const game = largerGame(count)
    expect(game.characters).toHaveLength(count)
    let session = startSession(createGameSession(game, { sessionId: 'larger-case', now: 0 }), 1)
    for (const [index, character] of game.characters.entries()) {
      session = selectCharacter(session, character.id)
      session = appendDialogue(session, character.id, { id: `entry-${index}`, role: 'user', text: `独立问题${index}`, at: index + 2, interrupted: false })
      session = consumeInterrogationTime(session, 125)
      expect(getInterrogationRemainingMs(session)).toBe(60000 - (index + 1) * 125)
    }
    for (const [index, character] of game.characters.entries()) {
      const context = buildCharacterContext(game, character.id, session.histories[character.id])
      expect(context.profile).toBe(character.profile)
      expect(context.history.map((entry) => entry.text)).toEqual([`独立问题${index}`])
    }
    const last = selectCharacter(session, game.characters[count - 1].id)
    expect(accuse(last, game.characters[count - 1].id, 20)).toMatchObject({ phase: 'solved', result: { correct: true, reveal: game.ending.reveal } })
    const wrong = accuse(last, game.characters[0].id, 20)
    expect(wrong).toMatchObject({ phase: 'lost', result: { correct: false, reveal: null } })
    expect(() => accuse(wrong, game.ending.culpritId, 21)).toThrow('invalid-phase')
    const restarted = restartSession(wrong, { sessionId: 'fresh-case', now: 22 })
    expect(Object.keys(restarted.histories)).toHaveLength(count)
    expect(Object.values(restarted.histories).every((entries) => entries.length === 0)).toBe(true)
    expect(getInterrogationRemainingMs(restarted)).toBe(60000)
  })
})
