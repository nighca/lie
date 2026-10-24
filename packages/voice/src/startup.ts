export type VoiceStartupStage =
  | 'startup' | 'status' | 'statusHeaders' | 'playbackResume'
  | 'microphone' | 'worklet' | 'captureResume'
  | 'socket' | 'socketOpen' | 'hello' | 'toolsList' | 'channelReady'
  | 'listenStart' | 'firstForwardedPcm' | 'cleanup'

export type VoiceStartupResult = 'started' | 'completed' | 'cancelled' | 'failed'
export type VoiceStartupObservation = { stage: VoiceStartupStage; result: VoiceStartupResult }
export type VoiceStartupObserver = (event: VoiceStartupObservation) => void

/** Optional local diagnostics must never interrupt the conversation. */
export function observeStartup(observer: VoiceStartupObserver | null | undefined, stage: VoiceStartupStage, result: VoiceStartupResult) {
  if (observer == null) return
  try { observer({ stage, result }) } catch { /* Diagnostics are isolated from voice behavior. */ }
}
