import type { GameDefinition } from '@lie/game-core'

const cases = Object.values(import.meta.glob<GameDefinition>('../../../../content/games/*.json', { eager: true, import: 'default' }))

export function readBundledCase(gameId: string): GameDefinition {
  const game = cases.find((entry) => entry.id === gameId)
  if (game == null) throw new Error(`Unknown official case: ${gameId}`)
  return game
}
