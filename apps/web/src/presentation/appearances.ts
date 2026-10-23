export interface Appearance {
  id: string
  avatar: string
  portrait: string
  accent: string
  voiceId: string | null
}

export function readAppearances(data: unknown): readonly Appearance[] {
  if (!Array.isArray(data)) throw new Error('Expected appearance array')
  return data.map((value: unknown) => {
    if (value == null || typeof value !== 'object') throw new Error('Invalid appearance')
    const item = value as Record<string, unknown>
    if (typeof item.id !== 'string' || typeof item.avatar !== 'string' || typeof item.portrait !== 'string' || typeof item.accent !== 'string') throw new Error('Invalid appearance fields')
    if (item.voiceId != null && (typeof item.voiceId !== 'string' || item.voiceId.trim().length === 0)) throw new Error('Invalid appearance voiceId')
    return { id: item.id, avatar: item.avatar, portrait: item.portrait, accent: item.accent, voiceId: typeof item.voiceId === 'string' ? item.voiceId.trim() : null }
  })
}
