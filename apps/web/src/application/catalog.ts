export interface CaseSummary {
  id: string
  title: string
  summary: string
  interrogationLimitSeconds: number
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
    ids.add(item.id as string)
    return { id: item.id as string, title: item.title as string, summary: item.summary as string, interrogationLimitSeconds: item.interrogationLimitSeconds as number }
  })
}
