export interface CharacterPreset {
  id: string
  name: string
  avatar: string
  portrait: string
  accent: string
  animation: string | null
  voiceId: string | null
  portraits: { listening: string | null; waiting: string | null; speaking: string | null }
}

export function readCharacterPresets(data: unknown): readonly CharacterPreset[] {
  if (!Array.isArray(data)) throw new Error('Expected characterPreset array')
  return data.map((value: unknown) => {
    if (value == null || typeof value !== 'object') throw new Error('Invalid characterPreset')
    const item = value as Record<string, unknown>
    if (typeof item.id !== 'string' || typeof item.avatar !== 'string' || typeof item.portrait !== 'string' || typeof item.accent !== 'string') throw new Error('Invalid characterPreset fields')
    if (typeof item.name !== 'string' || item.name.trim().length === 0) throw new Error('Invalid characterPreset name')
    if (item.voiceId != null && (typeof item.voiceId !== 'string' || item.voiceId.trim().length === 0)) throw new Error('Invalid characterPreset voiceId')
    if (item.animation != null) {
      const local = `/appearances/${item.id}/animation/package.json`
      const immutable = typeof item.animation === 'string' ? /^\/static\/[a-f0-9]{64}(\/appearances\/[a-z0-9]+(?:-[a-z0-9]+)*\/animation\/package\.json)$/.exec(item.animation) : null
      if (item.animation !== local && immutable?.[1] !== local) throw new Error('Invalid characterPreset animation')
    }
    const portraits: CharacterPreset['portraits'] = { listening: null, waiting: null, speaking: null }
    if (item.portraits != null) {
      if (typeof item.portraits !== 'object' || Array.isArray(item.portraits)) throw new Error('Invalid characterPreset portraits')
      const values = item.portraits as Record<string, unknown>
      for (const state of ['listening', 'waiting', 'speaking'] as const) {
        const url = values[state]
        if (url != null && (typeof url !== 'string' || url.trim().length === 0)) throw new Error('Invalid characterPreset portrait')
        portraits[state] = typeof url === 'string' ? url.trim() : null
      }
    }
    return { id: item.id, name: item.name, avatar: item.avatar, portrait: item.portrait, accent: item.accent, portraits, animation: typeof item.animation === 'string' ? item.animation : null, voiceId: typeof item.voiceId === 'string' ? item.voiceId.trim() : null }
  })
}
