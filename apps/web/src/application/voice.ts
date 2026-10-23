import type { CharacterContext } from '@lie/game-core'

export type ConversationEvent =
  | { type: 'userText'; text: string }
  | { type: 'assistantText'; text: string }
  | { type: 'speaking' }
  | { type: 'idle' }
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

/** One captured user turn and its spoken answer; close stops every owned device resource. */
export interface Conversation {
  open(): Promise<void>
  startInput(): Promise<void>
  finishInput(): void
  close(): void
}

export interface VoicePort {
  create(scope: ConversationScope): Conversation
}
