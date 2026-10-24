export interface Appearance {
  id: string
  name: string
  avatar: string
  portrait: string
  accent: string
  animation: string | null
  voiceId: string | null
  portraits: { listening: string | null; waiting: string | null; speaking: string | null }
}

export function readAppearances(data: unknown): readonly Appearance[] {
  if (!Array.isArray(data)) throw new Error('Expected appearance array')
  return data.map((value: unknown) => {
    if (value == null || typeof value !== 'object') throw new Error('Invalid appearance')
    const item = value as Record<string, unknown>
    if (typeof item.id !== 'string' || typeof item.avatar !== 'string' || typeof item.portrait !== 'string' || typeof item.accent !== 'string') throw new Error('Invalid appearance fields')
    if (typeof item.name !== 'string' || item.name.trim().length === 0) throw new Error('Invalid appearance name')
    if (item.voiceId != null && (typeof item.voiceId !== 'string' || item.voiceId.trim().length === 0)) throw new Error('Invalid appearance voiceId')
    if (item.animation != null && (typeof item.animation !== 'string' || item.animation !== `/appearances/${item.id}/animation/package.json`)) throw new Error('Invalid appearance animation')
    const portraits: Appearance['portraits'] = { listening: null, waiting: null, speaking: null }
    if (item.portraits != null) {
      if (typeof item.portraits !== 'object' || Array.isArray(item.portraits)) throw new Error('Invalid appearance portraits')
      const values = item.portraits as Record<string, unknown>
      for (const state of ['listening', 'waiting', 'speaking'] as const) {
        const url = values[state]
        if (url != null && (typeof url !== 'string' || url.trim().length === 0)) throw new Error('Invalid appearance portrait')
        portraits[state] = typeof url === 'string' ? url.trim() : null
      }
    }
    return { id: item.id, name: item.name, avatar: item.avatar, portrait: item.portrait, accent: item.accent, portraits, animation: typeof item.animation === 'string' ? item.animation : null, voiceId: typeof item.voiceId === 'string' ? item.voiceId.trim() : null }
  })
}
