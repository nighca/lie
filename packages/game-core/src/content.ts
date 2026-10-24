/** One story role; reusable appearance names and resources live outside this contract. */
export interface CharacterDefinition {
  /** 本案内唯一的非空人物标识；历史归属、切人及 ending.culpritId 均引用此值。 */
  readonly id: string
  /** 本案人物的非空显示姓名，不是预置形象库的 name。 */
  readonly name: string
  /** 非空纯文本扮演资料，只加入该人物上下文；推荐「你叫……」，不强制人称。浏览器可查，并非安全隔离。 */
  readonly profile: string
  /** 引用独立预置形象 ID；core 允许 null 且不查询形象库，正式编辑器另要求有效预置。 */
  readonly appearanceId: string | null
}

/** Static story text and deterministic accusation metadata; validation preserves text verbatim. */
export interface GameDefinition {
  /** 非空游戏标识；loadGame 要求其与请求的 gameId 完全相同。 */
  readonly id: string
  /** 非空案件标题，供游戏界面展示。 */
  readonly title: string
  /** 非空公共背景纯文本，展示给玩家，也加入每位人物上下文。 */
  readonly background: string
  /** 每局跨人物共享的正安全整数秒额度；语音启用后含停顿、等待与回答，准备连接不计，结束对话暂停。 */
  readonly interrogationLimitSeconds: number
  /** 非空人物列表，人数不固定；各人物 id 必须在本案内唯一。 */
  readonly characters: readonly CharacterDefinition[]
  /** 由程序判定指认和揭晓，不交由角色模型决定胜负。 */
  readonly ending: {
    /** 唯一正确指认目标，必须精确引用本案人物 id；不限于凶手或凶杀题材。 */
    readonly culpritId: string
    /** 非空真相纯文本，仅正确指认后展示；失败终局不揭晓。 */
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
  const interrogationLimitSeconds = game.interrogationLimitSeconds
  if (typeof interrogationLimitSeconds !== 'number' || !Number.isSafeInteger(interrogationLimitSeconds) || interrogationLimitSeconds <= 0) {
    throw new ContentValidationError('game.interrogationLimitSeconds', 'Expected a positive safe integer')
  }
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
    interrogationLimitSeconds,
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
