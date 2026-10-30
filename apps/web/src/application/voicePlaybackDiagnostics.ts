import type { PlaybackObservation } from '@lie/voice'

let enabled = false
const events: PlaybackObservation[] = []

/** Local development only; enable before opening a conversation. */
export function enableVoicePlaybackDiagnostics() {
  if (!import.meta.env.DEV) return
  events.length = 0
  enabled = true
}

export function disableVoicePlaybackDiagnostics() {
  enabled = false
  events.length = 0
}

export function readVoicePlaybackDiagnostics(): PlaybackObservation[] {
  return events.map(event => ({ ...event }))
}

export function observeVoicePlayback(event: PlaybackObservation) {
  if (!import.meta.env.DEV || !enabled) return
  if (events.length === 2000) events.shift()
  events.push({ ...event })
}
