import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath, URL as NodeURL } from 'node:url'

import { accuse, buildCharacterContext, createGameSession, getInterrogationRemainingMs, selectCharacter, startSession, validateGame } from '@lie/game-core'
import { describe, expect, it } from 'vitest'

import designAppearances from '../../../design/appearances/manifest.json'
import authoredCase from '../../../content/games/empty-medal-box.json'
import authoredDuckCase from '../../../content/games/duck-finale.json'
import caseData from '../public/games/empty-medal-box.json'
import duckCaseData from '../public/games/duck-finale.json'
import catalogData from '../public/games/index.json'
import { readCatalog } from '../src/application/catalog'
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

  it('runs the actual four-character second case with its own budget and terminal accusation', () => {
    expect(duckCaseData).toEqual(authoredDuckCase)
    const game = validateGame(duckCaseData)
    expect(game.characters).toHaveLength(4)
    const running = startSession(createGameSession(game, { sessionId: 'duck-case', now: 1 }), 2)
    expect(getInterrogationRemainingMs(running)).toBe(600_000)
    const appearances = readAppearances(appearanceData)
    for (const character of game.characters) {
      expect(appearances.find((appearance) => appearance.id === character.appearanceId)).toBeDefined()
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
    for (const entry of readCatalog(catalogData)) {
      const source = await readFile(fileURLToPath(new NodeURL(`../public/games/${encodeURIComponent(entry.id)}.json`, import.meta.url)), 'utf8')
      const content = validateGame(JSON.parse(source))
      expect({ id: content.id, title: content.title, interrogationLimitSeconds: content.interrogationLimitSeconds }).toEqual({ id: entry.id, title: entry.title, interrogationLimitSeconds: entry.interrogationLimitSeconds })
      expect(Object.keys(catalogData.find((item) => item.id === entry.id)!)).toEqual(['id', 'title', 'summary', 'interrogationLimitSeconds'])
    }
  })

  it('resolves every default and configured state asset from the shipped static resources', async () => {
    for (const appearance of readAppearances(appearanceData)) {
      const paths = new Set([appearance.avatar, appearance.portrait, ...Object.values(appearance.portraits)])
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
    const runtime = readAppearances(appearanceData)
    const completed = readAppearances(designAppearances)
    expect(runtime.map(({ id }) => id)).toEqual(completed.map(({ id }) => id))
    for (const source of completed) {
      const appearance = runtime.find((item) => item.id === source.id)
      expect(appearance, source.id).toBeDefined()
      expect(appearance!.accent).toBe(source.accent)
      expect(appearance!.name).toBe(source.name)
      expect(appearance!.voiceId).toBe(source.voiceId)
      const runtimePaths = { avatar: appearance!.avatar, default: appearance!.portrait, ...appearance!.portraits }
      const sourcePaths = { avatar: source.avatar, default: source.portrait, ...source.portraits }
      let canvas: number[] | null = null
      for (const state of ['avatar', 'default', 'listening', 'waiting', 'speaking'] as const) {
        expect(runtimePaths[state], `${source.id}/${state}`).toBeTypeOf('string')
        expect(sourcePaths[state], `${source.id}/${state} source`).toBeTypeOf('string')
        const output = await readFile(fileURLToPath(new NodeURL(`../public${runtimePaths[state]}`, import.meta.url)))
        const original = await readFile(fileURLToPath(new NodeURL(`../../../design/appearances/${sourcePaths[state]}`, import.meta.url)))
        expect(output.equals(original), `${source.id}/${state} unchanged`).toBe(true)
        const size = [output.readUInt32BE(16), output.readUInt32BE(20)]
        if (canvas == null) canvas = size
        expect(size, `${source.id}/${state} canvas`).toEqual(canvas)
        expect(size[0]).toBe(size[1])
      }
    }
  })

})
