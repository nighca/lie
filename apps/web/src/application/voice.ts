import type { CharacterContext } from '@lie/game-core'

/** Linear RMS amplitudes. inputActive is a local estimate, not provider VAD. */
export interface VoiceFeedback {
  inputLevel: number
  outputLevel: number
  inputActive: boolean
}

export type ConversationEvent =
  | ({ type: 'audioLevel' } & VoiceFeedback)
  | { type: 'userText'; text: string }
  | { type: 'assistantText'; text: string }
  | { type: 'speaking' }
  | { type: 'listening' }
  | { type: 'interrupted' }
  | { type: 'closed' }
  | { type: 'error'; reason?: 'context-too-large' }

export interface ConversationScope {
  sessionId: string
  characterId: string
  voiceId: string | null
  epoch: number
  signal: AbortSignal
  isCurrent(): boolean
  readContext(): CharacterContext
  onEvent(event: ConversationEvent): void
}

/** One continuous conversation; open resolves once transport, playback and microphone capture are ready; close releases them. */
export interface Conversation {
  open(): Promise<void>
  close(): void
}

export interface VoicePort {
  create(scope: ConversationScope): Conversation
}

export class VoiceAvailabilityError extends Error {
  constructor(readonly reason: 'unavailable' | 'check-failed') {
    super(reason)
  }
}
