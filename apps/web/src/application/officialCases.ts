import { validateGame } from '@lie/game-core/content'
import type { GameDefinition } from '@lie/game-core'

export interface OfficialCase {
  sequence: number
  game: GameDefinition & { summary: string }
}

/** One rule for filesystem builds and the browser's eager content bundle. */
export function readOfficialCases(sources: Readonly<Record<string, unknown>>): readonly OfficialCase[] {
  const prefixes = new Set<number>(), ids = new Set<string>()
  return Object.entries(sources).map(([path, raw]) => {
    const filename = path.split('/').at(-1)!
    const match = /^(\d{2,})-([a-zA-Z0-9][a-zA-Z0-9_-]{0,99})\.json$/.exec(filename)
    if (match == null) throw new Error(`${filename}: expected NN-<id>.json`)
    const sequence = Number(match[1])
    if (!Number.isSafeInteger(sequence) || sequence <= 0) throw new Error(`${filename}: invalid numeric prefix`)
    if (prefixes.has(sequence)) throw new Error(`${filename}: duplicate numeric prefix ${sequence}`)
    let game: GameDefinition
    try { game = validateGame(raw) }
    catch (error) { throw new Error(`${filename}: ${error instanceof Error ? error.message : 'invalid case content'}`) }
    if (ids.has(game.id)) throw new Error(`${filename}: duplicate case ID ${game.id}`)
    if (game.id !== match[2]) throw new Error(`${filename}: filename ID must match game.id`)
    if (game.summary == null || game.summary.trim() === '') throw new Error(`${filename}: official case summary is required`)
    prefixes.add(sequence); ids.add(game.id)
    return { sequence, game: { ...game, summary: game.summary } }
  }).sort((a, b) => a.sequence - b.sequence)
}
