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
      return {
        async open() {},
        async startInput() {},
        finishInput() {
          scope.onEvent({ type: 'userText', text: '闭馆之后，你在哪里？（开发演示模拟转写）' })
          later(() => scope.onEvent({ type: 'speaking' }), 400)
          later(() => scope.onEvent({ type: 'assistantText', text: `我是${scope.readContext().characterName}。这段话是开发演示占位回复，不是模型回答。` }), 700)
          later(() => scope.onEvent({ type: 'idle' }), 1800)
        },
        close() { for (const timer of timers) clearTimeout(timer); timers.clear() },
      }
    },
  }
}
