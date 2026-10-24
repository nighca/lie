import type { VoiceStartupObserver } from './startup'

export type PcmFormat = {
  format: 'pcm'
  sampleRate: number
  channels: 1
  bitsPerSample: 16
  frameDuration: number
}

export type VoiceEvent =
  | { type: 'ready'; format: PcmFormat }
  | { type: 'stt'; text: string }
  | { type: 'tts'; state: 'start' | 'sentence'; text: string | null }
  | { type: 'tts'; state: 'stop'; text: null; aborted: boolean }
  | { type: 'audio'; data: Uint8Array }
  | { type: 'tool'; state: 'start' | 'end'; name: string }
  | { type: 'interrupted' }
  | { type: 'closed'; code: number; reason: string }
  | { type: 'error'; code: 'connection' | 'protocol' | 'timeout' | 'tool'; message: string }

export type VoiceTool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (argumentsValue: unknown, signal: AbortSignal) => Promise<string>
}

export interface VoiceSocket {
  binaryType: BinaryType
  readyState: number
  onopen: (() => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onerror: (() => void) | null
  onclose: ((event: { code: number; reason: string }) => void) | null
  send(data: string | Uint8Array): void
  close(code?: number, reason?: string): void
}

export type VoiceChannelOptions = {
  onStartup?: VoiceStartupObserver
  tools: readonly VoiceTool[]
  onEvent: (event: VoiceEvent) => void
  createSocket?: () => VoiceSocket
  handshakeTimeoutMs?: number
  toolTimeoutMs?: number
  listenMode?: 'manual' | 'realtime'
  voiceId?: string
}

/** One connection lifetime. Create a new channel after closing; no implicit reconnect. */
export interface VoiceChannel {
  open(options?: { signal?: AbortSignal }): Promise<void>
  /** Send listen.start. Default realtime enables provider VAD; manual waits for stopInput. */
  startInput(): void
  /** Exactly 320 signed little-endian mono samples at 16kHz (640 bytes / 20ms). */
  input(data: Uint8Array): void
  /** Send listen.stop once; stop microphone capture separately. */
  stopInput(): void
  /** Request upstream abort and emit interrupted so the caller can clear its player. */
  interrupt(): void
  close(): void
}
