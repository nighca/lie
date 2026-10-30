import type { VoicePort } from '../application/voice'

/** Offline connection controls: no microphone, provider, or generated dialogue. */
export function createConnectionDemoVoice(readDelay: () => number) {
  let current: { ready(): void; fail(): void } | null = null
  const voice: VoicePort = {
    create() {
      let timer: ReturnType<typeof setTimeout> | null = null
      let resolveOpen: () => void = () => {}
      let rejectOpen: (error: Error) => void = () => {}
      const opened = new Promise<void>((resolve, reject) => { resolveOpen = resolve; rejectOpen = reject })
      function stopTimer() { if (timer != null) clearTimeout(timer); timer = null }
      const attempt = {
        ready() { stopTimer(); resolveOpen() },
        fail() { stopTimer(); rejectOpen(new Error('Demo connection failed')) },
      }
      current = attempt
      return {
        open() { timer = setTimeout(attempt.ready, readDelay()); return opened },
        close() {
          stopTimer()
          resolveOpen()
          if (current === attempt) current = null
        },
      }
    },
  }
  return { voice, ready() { current?.ready() }, fail() { current?.fail() } }
}
