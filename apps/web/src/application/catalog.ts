export interface CaseSummary {
  id: string
  title: string
  summary: string
  interrogationLimitSeconds: number
  characters: { name: string; appearanceId: string | null }[]
}

export function readCatalog(value: unknown): CaseSummary[] {
  if (!Array.isArray(value)) throw new Error('Invalid case catalog')
  const ids = new Set<string>()
  return value.map((entry: unknown) => {
    if (entry == null || typeof entry !== 'object') throw new Error('Invalid case summary')
    const item = entry as Record<string, unknown>
    for (const field of ['id', 'title', 'summary']) {
      if (typeof item[field] !== 'string' || !(item[field] as string).trim()) throw new Error(`Invalid ${field}`)
    }
    if (!Number.isSafeInteger(item.interrogationLimitSeconds) || (item.interrogationLimitSeconds as number) <= 0 || ids.has(item.id as string)) throw new Error('Invalid case catalog')
    if (!Array.isArray(item.characters) || item.characters.length === 0) throw new Error('Invalid catalog characters')
    const characters = item.characters.map((character: unknown) => {
      if (character == null || typeof character !== 'object') throw new Error('Invalid catalog character')
      const person = character as Record<string, unknown>
      if (typeof person.name !== 'string' || !person.name.trim() || (person.appearanceId !== null && (typeof person.appearanceId !== 'string' || !person.appearanceId.trim()))) throw new Error('Invalid catalog character')
      return { name: person.name, appearanceId: person.appearanceId }
    })
    ids.add(item.id as string)
    return { id: item.id as string, title: item.title as string, summary: item.summary as string, interrogationLimitSeconds: item.interrogationLimitSeconds as number, characters }
  })
}
