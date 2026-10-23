import type { VoicePort } from './voice'

/** Explicit development demo only; neither captures nor synthesizes real voice. */
export function createDemoVoicePort(): VoicePort {
  return {
    create(scope) {
      const timers = new Set<ReturnType<typeof setTimeout>>()
      function later(action: () => void, delay: number) {
        const timer = setTimeout(() => { timers.delete(timer); if (scope.isCurrent()) action() }, delay)
        timers.add(timer)
      }
      function round() {
        later(() => scope.onEvent({ type: 'userText', text: '交接之后，你在哪里？（开发演示模拟转写）' }), 1200)
        later(() => scope.onEvent({ type: 'speaking' }), 1600)
        later(() => scope.onEvent({ type: 'assistantText', text: `我是${scope.readContext().characterName}。这段话是开发演示占位回复，不是模型回答。` }), 1900)
        later(() => { scope.onEvent({ type: 'listening' }); round() }, 3000)
      }
      return {
        async open() { round() },
        close() { for (const timer of timers) clearTimeout(timer); timers.clear() },
      }
    },
  }
}
