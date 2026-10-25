// @vitest-environment node
import { readFile, readdir } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

import { loadGame, validateGame } from '@lie/game-core'

import { readBundledCase } from '../src/application/bundledCases'
import { caseCatalog } from '../src/application/catalog'

const directory = new URL('../../../content/games/', import.meta.url)

describe('bundled official cases', () => {
  it('ships exactly the catalog identities with complete canonical content', async () => {
    const files = (await readdir(directory)).filter((name) => name.endsWith('.json'))
    const originals = await Promise.all(files.map(async (name) => validateGame(JSON.parse(await readFile(new URL(name, directory), 'utf8')))))
    expect(new Set(originals.map(({ id }) => id)).size).toBe(originals.length)
    expect(caseCatalog.map(({ id }) => id).sort()).toEqual(originals.map(({ id }) => id).sort())
    for (const original of originals) {
      expect(readBundledCase(original.id)).toEqual(original)
      const game = await loadGame(original.id, async (id) => readBundledCase(id))
      expect(game).toEqual(original)
      expect(game).not.toBe(readBundledCase(original.id))
      expect(game.characters[0]).not.toBe(readBundledCase(original.id).characters[0])
    }
  })
  it.each(['', 'missing', 'toString', 'EMPTY-MEDAL-BOX'])('fails unknown identity %s without choosing a default case', async (id) => {
    expect(() => readBundledCase(id)).toThrow('Unknown official case')
    await expect(loadGame(id, async (name) => readBundledCase(name))).rejects.toThrow('Unknown official case')
  })
})
