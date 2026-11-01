import { describe, expect, it } from 'vitest'

import { serializeSharedGameV1 } from '../src'
import { twoCharacterPlaceholder } from './fixtures'

describe('shared game v1 serialization', () => {
  it('fixes field order, discards unknown fields and normalizes missing appearances', () => {
    const game = twoCharacterPlaceholder()
    const reversed = Object.fromEntries(Object.entries(game).reverse())
    expect(serializeSharedGameV1({ ...reversed, unknown: 'ignored' })).toBe(JSON.stringify(game))
    const { appearanceId, ...first } = game.characters[0]
    expect(serializeSharedGameV1({ ...game, characters: [first, game.characters[1]] })).toBe(JSON.stringify(game))
  })

  it('preserves optional summary, text, array order and internal IDs', () => {
    const game = twoCharacterPlaceholder()
    const original = serializeSharedGameV1(game)
    expect(JSON.parse(original)).toEqual(game)
    for (const changed of [
      { ...game, summary: '' },
      { ...game, background: game.background.trim() },
      { ...game, characters: [...game.characters].reverse() },
      { ...game, id: 'another-draft' },
      { ...game, ending: { ...game.ending, reveal: 'another ending' } }
    ]) expect(serializeSharedGameV1(changed)).not.toBe(original)
  })
})
