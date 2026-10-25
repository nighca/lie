import { validateGame } from '@lie/game-core'
import { describe, expect, it } from 'vitest'

import manifest from '../public/appearances/manifest.json'
import { readCharacterPresets } from '../src/presentation/characterPresets'
import { setup } from './helpers'
import { officialCases } from '../src/application/bundledCases'

describe('shipped preset voices', () => {
  it('voices every catalog preset with the approved shared mature voice', () => {
    const characterPresets = readCharacterPresets(manifest)
    expect(characterPresets.every(({ voiceId }) => voiceId != null)).toBe(true)
    expect(['coral-bob', 'sunny-moustache', 'blue-glasses', 'salt-pepper-beard'].map((id) => characterPresets.find((characterPreset) => characterPreset.id === id)?.voiceId)).toEqual([
      '535b81a1db504baa99fd726e01afee15', '2e7965636b0d4472ae51e75f419dff41', '29ddb9582ae8481ebf11562f99aeaf95', '2e7965636b0d4472ae51e75f419dff41',
    ])
  })

  it.each(officialCases.map(({ game }) => game))('resolves each character voice through real catalog mappings in $id', async (content) => {
    const characterPresets = readCharacterPresets(manifest)
    const game = validateGame(content)
    const { controller, turns } = setup(undefined, game, (id) => characterPresets.find((item) => item.id === id)?.voiceId ?? null)
    await controller.load(game.id); controller.start()
    for (const character of game.characters) {
      controller.selectCharacter(character.id)
      await controller.startConversation()
      const expected = characterPresets.find((item) => item.id === character.appearanceId)!.voiceId
      expect(turns.at(-1)!.scope.voiceId).toBe(expected)
      expect(expected).not.toBeNull()
    }
    expect(turns.slice(0, -1).every(({ closed }) => closed)).toBe(true)
    controller.dispose()
  })
})
