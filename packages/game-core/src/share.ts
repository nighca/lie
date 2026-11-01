import { validateGame } from './content'

export const SHARED_GAME_BYTES_LIMIT = 1024 * 1024
export const SHARED_GAME_API_PATH = '/api/shared-games/v1'
export const SHARED_GAME_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/

/** V1 field order is fixed independently of future validator output changes. */
export function serializeSharedGameV1(data: unknown): string {
  const game = validateGame(data)
  return JSON.stringify({
    id: game.id,
    title: game.title,
    ...(game.summary == null ? {} : { summary: game.summary }),
    background: game.background,
    interrogationLimitSeconds: game.interrogationLimitSeconds,
    characters: game.characters.map((character) => ({
      id: character.id,
      name: character.name,
      profile: character.profile,
      appearanceId: character.appearanceId
    })),
    ending: { culpritId: game.ending.culpritId, reveal: game.ending.reveal }
  })
}
