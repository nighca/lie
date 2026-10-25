import catalogData from '../../../../content/case-catalog.json'

export interface CaseSummary {
  id: string
  title: string
  summary: string
  interrogationLimitSeconds: number
  characters: { name: string; appearanceId: string | null }[]
}

export const caseCatalog: readonly CaseSummary[] = catalogData
