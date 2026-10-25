import { readOfficialCases } from './officialCases'

export const officialCases = readOfficialCases(import.meta.glob('../../../../content/games/*.json', { eager: true, import: 'default' }))
export const nextOfficialCaseSequence = (officialCases.at(-1)?.sequence ?? 0) + 1

export function readBundledCase(gameId: string) {
  const entry = officialCases.find(({ game }) => game.id === gameId)
  if (entry == null) throw new Error(`Unknown official case: ${gameId}`)
  return entry.game
}
