export interface CharacterDefinition {
  readonly id: string
  readonly name: string
  readonly profile: string
  readonly appearanceId: string | null
}

export interface GameDefinition {
  readonly id: string
  readonly title: string
  readonly background: string
  readonly characters: readonly CharacterDefinition[]
  readonly ending: {
    readonly culpritId: string
    readonly reveal: string
  }
}

export interface ContentIssue {
  readonly path: string
  readonly message: string
}

export class ContentValidationError extends Error {
  readonly issues: readonly ContentIssue[]

  constructor(path: string, message: string) {
    super(`${path}: ${message}`)
    this.name = 'ContentValidationError'
    this.issues = [{ path, message }]
  }
}

function readObject(value: unknown, path: string): Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ContentValidationError(path, 'Expected an object')
  }
  return value as Record<string, unknown>
}

function readText(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ContentValidationError(path, 'Expected non-empty text')
  }
  return value
}

/** Validates static JSON and copies its text verbatim into the normalized contract. */
export function validateGame(data: unknown): GameDefinition {
  const game = readObject(data, 'game')
  const id = readText(game.id, 'game.id')
  const title = readText(game.title, 'game.title')
  const background = readText(game.background, 'game.background')
  if (!Array.isArray(game.characters) || game.characters.length === 0) {
    throw new ContentValidationError('game.characters', 'Expected at least one character')
  }
  const characterIds = new Set<string>()
  const characters = game.characters.map((value: unknown, index: number): CharacterDefinition => {
    const path = `game.characters[${index}]`
    const character = readObject(value, path)
    const characterId = readText(character.id, `${path}.id`)
    if (characterIds.has(characterId)) {
      throw new ContentValidationError(`${path}.id`, 'Duplicate character ID')
    }
    characterIds.add(characterId)
    return {
      id: characterId,
      name: readText(character.name, `${path}.name`),
      profile: readText(character.profile, `${path}.profile`),
      appearanceId: character.appearanceId == null
        ? null
        : readText(character.appearanceId, `${path}.appearanceId`)
    }
  })
  const ending = readObject(game.ending, 'game.ending')
  const culpritId = readText(ending.culpritId, 'game.ending.culpritId')
  if (!characterIds.has(culpritId)) {
    throw new ContentValidationError('game.ending.culpritId', 'Must reference a character in this game')
  }
  return {
    id,
    title,
    background,
    characters,
    ending: { culpritId, reveal: readText(ending.reveal, 'game.ending.reveal') }
  }
}

/** Reading/parsing is supplied by the caller; network and filesystem APIs stay outside core. */
export async function loadGame(
  gameId: string,
  read: (gameId: string) => Promise<unknown>
): Promise<GameDefinition> {
  const game = validateGame(await read(gameId))
  if (game.id !== gameId) {
    throw new ContentValidationError('game.id', 'Loaded game ID does not match the requested game')
  }
  return game
}
