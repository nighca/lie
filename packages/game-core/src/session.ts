import { validateGame } from './content'
import type { CharacterDefinition, GameDefinition } from './content'

export type GamePhase = 'intro' | 'interrogating' | 'ended' | 'solved' | 'lost'

export interface DialogueEntry {
  readonly id: string
  readonly role: 'user' | 'assistant'
  readonly text: string
  readonly at: number
  readonly interrupted: boolean
}

export interface AccusationResult {
  readonly characterId: string
  readonly correct: boolean
  readonly reveal: string | null
}

export interface SessionIdentity {
  readonly sessionId: string
  readonly now: number
}

export interface GameSession {
  readonly sessionId: string
  readonly game: GameDefinition
  readonly phase: GamePhase
  readonly currentCharacterId: string | null
  readonly interrogationUsedMs: number
  readonly histories: Readonly<Record<string, readonly DialogueEntry[]>>
  readonly result: AccusationResult | null
  readonly createdAt: number
  readonly startedAt: number | null
  readonly endedAt: number | null
}

export class GameStateError extends Error {
  constructor(readonly code: 'invalid-phase' | 'unknown-character' | 'inactive-character') {
    super(code)
    this.name = 'GameStateError'
  }
}

export function getCharacter(game: GameDefinition, characterId: string): CharacterDefinition {
  const character = game.characters.find((item) => item.id === characterId)
  if (character == null) throw new GameStateError('unknown-character')
  return character
}

function requirePhase(session: GameSession, phase: GamePhase): void {
  if (session.phase !== phase) throw new GameStateError('invalid-phase')
}

/** Takes a content snapshot; IDs and timestamps are supplied by the application. */
export function createGameSession(game: GameDefinition, identity: SessionIdentity): GameSession {
  const snapshot = validateGame(game)
  return {
    sessionId: identity.sessionId,
    game: snapshot,
    phase: 'intro',
    currentCharacterId: null,
    interrogationUsedMs: 0,
    histories: Object.fromEntries(snapshot.characters.map((character) => [character.id, []])),
    result: null,
    createdAt: identity.now,
    startedAt: null,
    endedAt: null
  }
}

export function startSession(session: GameSession, now: number): GameSession {
  requirePhase(session, 'intro')
  return {
    ...session,
    phase: 'interrogating',
    currentCharacterId: session.game.characters[0].id,
    startedAt: now
  }
}

export function selectCharacter(session: GameSession, characterId: string): GameSession {
  requirePhase(session, 'interrogating')
  getCharacter(session.game, characterId)
  return { ...session, currentCharacterId: characterId }
}

export function endSession(session: GameSession, now: number): GameSession {
  requirePhase(session, 'interrogating')
  return { ...session, phase: 'ended', currentCharacterId: null, endedAt: now }
}

export function accuse(session: GameSession, characterId: string, now: number): GameSession {
  requirePhase(session, 'interrogating')
  getCharacter(session.game, characterId)
  const correct = characterId === session.game.ending.culpritId
  const result = { characterId, correct, reveal: correct ? session.game.ending.reveal : null }
  return { ...session, phase: correct ? 'solved' : 'lost', currentCharacterId: null, endedAt: now, result }
}

/** A restart returns to the opening with a fresh caller-provided session ID and empty history. */
export function restartSession(session: GameSession, identity: SessionIdentity): GameSession {
  return createGameSession(session.game, identity)
}

/** Provider epochs belong to the orchestrator; core validates phase, character and entry deduplication. */
export function appendDialogue(
  session: GameSession,
  characterId: string,
  entry: DialogueEntry
): GameSession {
  requirePhase(session, 'interrogating')
  getCharacter(session.game, characterId)
  if (characterId !== session.currentCharacterId) throw new GameStateError('inactive-character')
  const history = session.histories[characterId]
  if (history.some((item) => item.id === entry.id)) return session
  return {
    ...session,
    histories: { ...session.histories, [characterId]: [...history, { ...entry }] }
  }
}

/** Consumes caller-measured active voice time; reaching the limit leaves accusation available. */
export function consumeInterrogationTime(session: GameSession, elapsedMs: number): GameSession {
  requirePhase(session, 'interrogating')
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError('Elapsed interrogation time must be finite and non-negative')
  }
  return {
    ...session,
    interrogationUsedMs: Math.min(session.game.interrogationLimitSeconds * 1000, session.interrogationUsedMs + elapsedMs)
  }
}

export function getInterrogationRemainingMs(session: GameSession): number {
  return Math.max(0, session.game.interrogationLimitSeconds * 1000 - session.interrogationUsedMs)
}
