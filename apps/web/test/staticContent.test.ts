import { validateGame } from '@lie/game-core'
import { describe, expect, it } from 'vitest'

import authoredCase from '../../../content/games/empty-medal-box.json'
import caseData from '../public/games/empty-medal-box.json'
import gameConfig from '../src/game-config.json'
import appearanceData from '../public/appearances/manifest.json'
import { readAppearances } from '../src/presentation/appearances'

describe('bundled game content', () => {
  it('validates the actual case and resolves each configured presentation', () => {
    expect(caseData).toEqual(authoredCase)
    expect(gameConfig.defaultGameId).toBe(caseData.id)
    const game = validateGame(caseData)
    const appearances = readAppearances(appearanceData)
    for (const character of game.characters) {
      const appearance = appearances.find((item) => item.id === character.appearanceId)
      expect(appearance).toBeDefined()
      expect(appearance!.avatar).toMatch(/^\/appearances\//)
      expect(appearance!.portrait).toMatch(/^\/appearances\//)
    }
    expect(game.characters).toHaveLength(3)
  })
})
