import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath, URL as NodeURL } from 'node:url'

import { accuse, buildCharacterContext, createGameSession, getInterrogationRemainingMs, selectCharacter, startSession, validateGame } from '@lie/game-core'
import { describe, expect, it } from 'vitest'

import designCharacterPresets from '../../../design/character-presets/manifest.json'
import authoredCase from '../../../content/games/01-empty-medal-box.json'
import authoredDuckCase from '../../../content/games/02-duck-finale.json'
import { readBundledCase } from '../src/application/bundledCases'
import { caseCatalog } from '../src/application/catalog'
import gameConfig from '../src/game-config.json'
import characterPresetData from '../public/appearances/manifest.json'
import { readCharacterPresets } from '../src/presentation/characterPresets'

describe('bundled game content', () => {
  it('validates the actual case and resolves each configured presentation', () => {
    expect(gameConfig.defaultGameId).toBe(authoredCase.id)
    const game = validateGame(authoredCase)
    const characterPresets = readCharacterPresets(characterPresetData)
    for (const character of game.characters) {
      const characterPreset = characterPresets.find((item) => item.id === character.appearanceId)
      expect(characterPreset).toBeDefined()
      expect(characterPreset!.avatar).toMatch(/^\/appearances\//)
      expect(characterPreset!.portrait).toMatch(/^\/appearances\//)
    }
    expect(game.characters).toHaveLength(3)
  })

  it('runs the actual four-character second case with its own budget and terminal accusation', () => {
    const game = validateGame(authoredDuckCase)
    expect(game.characters).toHaveLength(4)
    const running = startSession(createGameSession(game, { sessionId: 'duck-case', now: 1 }), 2)
    expect(getInterrogationRemainingMs(running)).toBe(600_000)
    const characterPresets = readCharacterPresets(characterPresetData)
    for (const character of game.characters) {
      expect(characterPresets.find((characterPreset) => characterPreset.id === character.appearanceId)).toBeDefined()
      const selected = selectCharacter(running, character.id)
      expect(selected.currentCharacterId).toBe(character.id)
      const context = buildCharacterContext(game, character.id, [])
      expect(context.profile).toBe(character.profile)
      expect(game.characters.filter((item) => item.id !== character.id).every((item) => !context.systemPrompt.includes(item.profile))).toBe(true)
      const result = accuse(selected, character.id, 3)
      expect(result.phase).toBe(character.id === game.ending.culpritId ? 'solved' : 'lost')
      expect(result.result!.reveal).toBe(character.id === game.ending.culpritId ? game.ending.reveal : null)
      expect(() => accuse(result, game.ending.culpritId, 4)).toThrow('invalid-phase')
    }
  })

  it('keeps public catalog cards in sync with their actual content packages', async () => {
    expect(new Set(caseCatalog.map(({ id }) => id)).size).toBe(caseCatalog.length)
    for (const entry of caseCatalog) {
      expect(entry.summary.trim()).not.toBe('')
      const content = validateGame(readBundledCase(entry.id))
      expect({ id: content.id, title: content.title, interrogationLimitSeconds: content.interrogationLimitSeconds }).toEqual({ id: entry.id, title: entry.title, interrogationLimitSeconds: entry.interrogationLimitSeconds })
      expect(entry.characters).toEqual(content.characters.map(({ name, appearanceId }) => ({ name, appearanceId: appearanceId ?? null })))
      expect(Object.keys(entry)).toEqual(['id', 'title', 'summary', 'interrogationLimitSeconds', 'characters'])
    }
  })

  it('resolves every default and configured state asset from the shipped static resources', async () => {
    for (const characterPreset of readCharacterPresets(characterPresetData)) {
      const paths = new Set([characterPreset.avatar, characterPreset.portrait, ...Object.values(characterPreset.portraits)])
      for (const path of paths) {
        if (path == null) continue
        expect(path).toMatch(/^\/appearances\//)
        const file = await stat(fileURLToPath(new NodeURL(`../public${path}`, import.meta.url)))
        expect(file.isFile()).toBe(true)
        expect(file.size).toBeGreaterThan(0)
      }
    }
  })

  it('generates every catalog preset with unchanged canonical assets and a shared state canvas', async () => {
    const runtime = readCharacterPresets(characterPresetData)
    const completed = designCharacterPresets
    expect(runtime.map(({ id }) => id)).toEqual(completed.map(({ id }) => id))
    for (const source of completed) {
      const characterPreset = runtime.find((item) => item.id === source.id)
      expect(characterPreset, source.id).toBeDefined()
      expect(characterPreset!.accent).toBe(source.accent)
      expect(characterPreset!.name).toBe(source.name)
      expect(characterPreset!.voiceId).toBe(source.voiceId)
      const runtimePaths = { avatar: characterPreset!.avatar, default: characterPreset!.portrait, ...characterPreset!.portraits }
      const sourcePaths = { avatar: source.avatar, default: source.portrait, ...source.portraits }
      expect(runtimePaths.avatar).toBe(`/appearances/${source.id}/${source.avatar === source.portrait ? 'default' : 'avatar'}.png`)
      expect(runtimePaths.default).toBe(`/appearances/${source.id}/default.png`)
      for (const state of ['listening', 'waiting', 'speaking'] as const) expect(runtimePaths[state]).toBe(`/appearances/${source.id}/${state}.png`)
      let canvas: number[] | null = null
      for (const state of ['avatar', 'default', 'listening', 'waiting', 'speaking'] as const) {
        expect(runtimePaths[state], `${source.id}/${state}`).toBeTypeOf('string')
        expect(sourcePaths[state], `${source.id}/${state} source`).toBeTypeOf('string')
        const output = await readFile(fileURLToPath(new NodeURL(`../public${runtimePaths[state]}`, import.meta.url)))
        const original = await readFile(fileURLToPath(new NodeURL(`../../../design/character-presets/${sourcePaths[state]}`, import.meta.url)))
        expect(output.equals(original), `${source.id}/${state} unchanged`).toBe(true)
        const size = [output.readUInt32BE(16), output.readUInt32BE(20)]
        if (canvas == null) canvas = size
        expect(size, `${source.id}/${state} canvas`).toEqual(canvas)
        expect(size[0]).toBe(size[1])
      }
    }
  })

})
