import { validateGame } from '@lie/game-core'
import { describe, expect, it } from 'vitest'

import manifest from '../public/appearances/manifest.json'
import medal from '../public/games/empty-medal-box.json'
import duck from '../public/games/duck-finale.json'
import sugar from '../public/games/salt-sugar-mixup.json'
import { readAppearances } from '../src/presentation/appearances'
import { setup } from './helpers'

describe('shipped preset voices', () => {
  it('configures eight distinct nonempty voices while retaining the first case choices', () => {
    const appearances = readAppearances(manifest)
    expect(appearances).toHaveLength(8)
    expect(appearances.every(({ voiceId }) => voiceId != null)).toBe(true)
    expect(new Set(appearances.map(({ voiceId }) => voiceId)).size).toBe(8)
    expect(appearances.slice(0, 3).map(({ voiceId }) => voiceId)).toEqual([
      '535b81a1db504baa99fd726e01afee15', '2e7965636b0d4472ae51e75f419dff41', '29ddb9582ae8481ebf11562f99aeaf95',
    ])
  })

  it.each([medal, duck, sugar])('resolves each character voice through real catalog mappings in $id', async (content) => {
    const appearances = readAppearances(manifest)
    const game = validateGame(content)
    const { controller, turns } = setup(undefined, game, (id) => appearances.find((item) => item.id === id)?.voiceId ?? null)
    await controller.load(game.id); controller.start()
    for (const character of game.characters) {
      controller.selectCharacter(character.id)
      await controller.startConversation()
      const expected = appearances.find((item) => item.id === character.appearanceId)!.voiceId
      expect(turns.at(-1)!.scope.voiceId).toBe(expected)
      expect(expected).not.toBeNull()
    }
    expect(turns.slice(0, -1).every(({ closed }) => closed)).toBe(true)
    controller.dispose()
  })
})
