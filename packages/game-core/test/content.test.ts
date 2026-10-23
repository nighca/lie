import { describe, expect, it } from 'vitest'

import { ContentValidationError, loadGame, validateGame } from '../src'
import { freezeDeep, threeCharacterPlaceholder, twoCharacterPlaceholder } from './fixtures'

describe('static game content', () => {
  it('preserves text verbatim and normalizes omitted appearances to null', () => {
    const fixture = twoCharacterPlaceholder()
    const { appearanceId, ...character } = fixture.characters[0]
    const data = freezeDeep({ ...fixture, characters: [character, fixture.characters[1]] })
    const game = validateGame(data)
    expect(game.background).toBe(fixture.background)
    expect(game.characters[0].profile).toBe(character.profile)
    expect(game.characters[0].appearanceId).toBe(null)
    expect(game.characters[1].appearanceId).toBe('placeholder-b')
    expect(game).not.toBe(data)
    expect(game.characters[0]).not.toBe(character)
  })

  it.each([twoCharacterPlaceholder, threeCharacterPlaceholder])('accepts valid different character counts', (fixture) => {
    const data = fixture()
    expect(validateGame(data)).toEqual(data)
  })

  it.each([
    { data: null, path: 'game' },
    { data: [], path: 'game' },
    { data: { ...twoCharacterPlaceholder(), id: ' ' }, path: 'game.id' },
    { data: { ...twoCharacterPlaceholder(), title: 42 }, path: 'game.title' },
    { data: { ...twoCharacterPlaceholder(), background: '' }, path: 'game.background' },
    { data: { ...twoCharacterPlaceholder(), characters: [] }, path: 'game.characters' },
    { data: { ...twoCharacterPlaceholder(), characters: [null] }, path: 'game.characters[0]' },
    { data: { ...twoCharacterPlaceholder(), characters: [{ id: 'a', name: '甲', profile: '\n' }] }, path: 'game.characters[0].profile' },
    { data: { ...twoCharacterPlaceholder(), characters: [{ id: 'a', name: '甲', profile: '设定', appearanceId: 1 }] }, path: 'game.characters[0].appearanceId' },
    { data: { ...twoCharacterPlaceholder(), ending: { culpritId: 'missing', reveal: '结局' } }, path: 'game.ending.culpritId' },
    { data: { ...twoCharacterPlaceholder(), ending: { culpritId: 'a' } }, path: 'game.ending.reveal' }
  ])('rejects malformed content at $path', ({ data, path }) => {
    try {
      validateGame(data)
      expect.fail('Expected validation to reject content')
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError)
      if (!(error instanceof ContentValidationError)) throw error
      expect(error.issues[0].path).toBe(path)
    }
  })

  it.each([null, 0, -1, 1.5, NaN, Infinity, -Infinity, '60', Number.MAX_SAFE_INTEGER + 1])('rejects an invalid interrogation allowance %s', (limit) => {
    expect(() => validateGame({ ...twoCharacterPlaceholder(), interrogationLimitSeconds: limit }))
      .toThrow('game.interrogationLimitSeconds: Expected a positive safe integer')
  })

  it('requires an interrogation allowance in static content', () => {
    const { interrogationLimitSeconds, ...data } = twoCharacterPlaceholder()
    expect(() => validateGame(data)).toThrow('game.interrogationLimitSeconds')
  })

  it('rejects duplicate character IDs', () => {
    const game = twoCharacterPlaceholder()
    expect(() => validateGame({ ...game, characters: [game.characters[0], game.characters[0]] }))
      .toThrow('game.characters[1].id: Duplicate character ID')
  })

  it('loads through an injected reader and checks the requested identity', async () => {
    const game = twoCharacterPlaceholder()
    const seen: string[] = []
    expect(await loadGame(game.id, async (id) => { seen.push(id); return game })).toEqual(game)
    expect(seen).toEqual([game.id])
    await expect(loadGame('different-game', async () => game)).rejects.toThrow('does not match')
    await expect(loadGame(game.id, async () => ({ id: game.id }))).rejects.toBeInstanceOf(ContentValidationError)
  })

  it('propagates reader failures instead of manufacturing a playable game', async () => {
    const failure = new Error('Missing static file')
    await expect(loadGame('missing', async () => { throw failure })).rejects.toBe(failure)
  })
})
