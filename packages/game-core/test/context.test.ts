import { describe, expect, it } from 'vitest'

import { appendDialogue, buildCharacterContext, createGameSession, selectCharacter, startSession } from '../src'
import { dialogue, freezeDeep, twoCharacterPlaceholder } from './fixtures'

describe('character context', () => {
  it('assembles original public and selected private text without other profiles or ending', () => {
    const game = freezeDeep(twoCharacterPlaceholder())
    const history = freezeDeep([dialogue()])
    const context = buildCharacterContext(game, 'a', history)
    expect(context.background).toBe(game.background)
    expect(context.profile).toBe(game.characters[0].profile)
    expect(context.characterId).toBe('a')
    expect(context.characterName).toBe('甲')
    expect(context.systemPrompt).toContain(game.background)
    expect(context.systemPrompt).toContain(game.characters[0].profile)
    expect(context.systemPrompt).not.toContain(game.characters[1].profile)
    expect(context.systemPrompt).not.toContain(game.ending.reveal)
    expect(context.history).toEqual(history)
    expect(context.history).not.toBe(history)
    expect(context.history[0]).not.toBe(history[0])
    expect(Object.keys(context).sort()).toEqual(['background', 'characterId', 'characterName', 'history', 'profile', 'systemPrompt'])
  })

  it('returns only the explicitly selected history after switching characters', () => {
    const game = twoCharacterPlaceholder()
    const first = appendDialogue(startSession(createGameSession(game, { sessionId: 'run', now: 1 }), 2), 'a', { ...dialogue(), text: '只向甲说的秘密' })
    const second = appendDialogue(selectCharacter(first, 'b'), 'b', { ...dialogue(), text: '只向乙说的话' })
    expect(buildCharacterContext(game, 'a', second.histories.a).history.map((entry) => entry.text)).toEqual(['只向甲说的秘密'])
    expect(buildCharacterContext(game, 'b', second.histories.b).history.map((entry) => entry.text)).toEqual(['只向乙说的话'])
  })

  it('rejects a character that is not part of the story', () => {
    expect(() => buildCharacterContext(twoCharacterPlaceholder(), 'missing', [])).toThrow('unknown-character')
  })
})
