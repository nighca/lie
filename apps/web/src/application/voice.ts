import type { CharacterContext } from '@lie/game-core'

export type ConversationEvent =
  | { type: 'userText'; text: string }
  | { type: 'assistantText'; text: string }
  | { type: 'speaking' }
  | { type: 'listening' }
  | { type: 'interrupted' }
  | { type: 'closed' }
  | { type: 'error' }

export interface ConversationScope {
  sessionId: string
  characterId: string
  epoch: number
  signal: AbortSignal
  isCurrent(): boolean
  readContext(): CharacterContext
  onEvent(event: ConversationEvent): void
}

/** One continuous conversation; open prepares devices and capture, close releases them. */
export interface Conversation {
  open(): Promise<void>
  close(): void
}

export interface VoicePort {
  create(scope: ConversationScope): Conversation
}
