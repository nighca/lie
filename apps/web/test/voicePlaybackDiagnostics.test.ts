import { afterEach, describe, expect, it } from 'vitest'
import type { PlaybackObservation } from '@lie/voice'

import { disableVoicePlaybackDiagnostics, enableVoicePlaybackDiagnostics, observeVoicePlayback, readVoicePlaybackDiagnostics } from '../src/application/voicePlaybackDiagnostics'

afterEach(disableVoicePlaybackDiagnostics)

describe('local development playback diagnostics', () => {
  it('records only after enabling and clears on disable', () => {
    const event: PlaybackObservation = { type: 'context-state', contextState: 'running', audioTime: 1 }
    observeVoicePlayback(event)
    expect(readVoicePlaybackDiagnostics()).toEqual([])
    enableVoicePlaybackDiagnostics()
    observeVoicePlayback(event)
    expect(readVoicePlaybackDiagnostics()).toEqual([event])
    disableVoicePlaybackDiagnostics()
    expect(readVoicePlaybackDiagnostics()).toEqual([])
  })

  it('retains the latest 2000 observations and returns detached snapshots', () => {
    enableVoicePlaybackDiagnostics()
    for (let audioTime = 0; audioTime < 2003; audioTime++) observeVoicePlayback({ type: 'context-state', contextState: 'running', audioTime })
    const snapshot = readVoicePlaybackDiagnostics()
    expect(snapshot).toHaveLength(2000)
    expect(snapshot[0].audioTime).toBe(3)
    expect(snapshot.at(-1)?.audioTime).toBe(2002)
    snapshot[0].audioTime = -1
    expect(readVoicePlaybackDiagnostics()[0].audioTime).toBe(3)
    enableVoicePlaybackDiagnostics()
    expect(readVoicePlaybackDiagnostics()).toEqual([])
  })
})
