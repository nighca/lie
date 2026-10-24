import { readFile } from 'node:fs/promises'
import { fileURLToPath, URL as NodeURL } from 'node:url'

import { accuse, appendDialogue, buildCharacterContext, consumeInterrogationTime, createGameSession, getInterrogationRemainingMs, selectCharacter, startSession, validateGame } from '@lie/game-core'
import { describe, expect, it } from 'vitest'

import authoredCase from '../../../content/games/salt-sugar-mixup.json'
import shippedCase from '../public/games/salt-sugar-mixup.json'
import characterPresets from '../public/appearances/manifest.json'

describe('third case static integration', () => {
  it('ships the same source text and references existing resources for all four people', async () => {
    expect(shippedCase).toEqual(authoredCase)
    const game = validateGame(shippedCase)
    expect(game.characters).toHaveLength(4)
    expect(game.interrogationLimitSeconds).toBe(540)
    for (const character of game.characters) {
      const characterPreset = characterPresets.find((item) => item.id === character.appearanceId)
      expect(characterPreset).toBeDefined()
      for (const path of [characterPreset!.avatar, characterPreset!.portrait, ...Object.values(characterPreset!.portraits)]) {
        const asset = await readFile(fileURLToPath(new NodeURL(`../public${path}`, import.meta.url)))
        expect(asset.byteLength).toBeGreaterThan(0)
      }
    }
  })

  it('uses each selected character context and one shared nine-minute budget', () => {
    const game = validateGame(shippedCase)
    let session = startSession(createGameSession(game, { sessionId: 'third', now: 1 }), 2)
    expect(getInterrogationRemainingMs(session)).toBe(540_000)
    for (const character of game.characters) {
      session = selectCharacter(session, character.id)
      session = appendDialogue(session, character.id, { id: `question-${character.id}`, role: 'user', text: `请${character.name}说说经过。`, at: 3, interrupted: false })
      const context = buildCharacterContext(game, character.id, session.histories[character.id])
      expect(context.profile).toBe(character.profile)
      expect(context.history.map((item) => item.id)).toEqual([`question-${character.id}`])
      session = consumeInterrogationTime(session, 1_000)
    }
    expect(getInterrogationRemainingMs(session)).toBe(536_000)
    expect(Object.keys(session.histories)).toHaveLength(4)
  })

  it('ends each wrong selection without revealing and reveals only the fixed responsible person', () => {
    const game = validateGame(shippedCase)
    for (const character of game.characters) {
      const running = startSession(createGameSession(game, { sessionId: character.id, now: 1 }), 2)
      const result = accuse(running, character.id, 3)
      const correct = character.id === game.ending.culpritId
      expect(result.phase).toBe(correct ? 'solved' : 'lost')
      expect(result.result!.reveal).toBe(correct ? game.ending.reveal : null)
      expect(() => accuse(result, game.ending.culpritId, 4)).toThrow('invalid-phase')
    }
  })
})
