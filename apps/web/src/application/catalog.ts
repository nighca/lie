import { officialCases } from './bundledCases'

export interface CaseSummary {
  id: string
  title: string
  summary: string
  interrogationLimitSeconds: number
  characters: { name: string; appearanceId: string | null }[]
}

export const caseCatalog: readonly CaseSummary[] = officialCases.map(({ game }) => ({
  id: game.id, title: game.title, summary: game.summary, interrogationLimitSeconds: game.interrogationLimitSeconds,
  characters: game.characters.map(({ name, appearanceId }) => ({ name, appearanceId })),
}))
