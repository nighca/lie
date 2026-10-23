import type { GameDefinition } from '@lie/game-core'

import type { ControllerOptions, ConversationClock } from '../src/application/controller'
import { createGameController } from '../src/application/controller'
import type { ConversationScope, VoicePort } from '../src/application/voice'

export const game: GameDefinition = {
  interrogationLimitSeconds: 480, id: 'test', title: '测试案件', background: '大家知道的背景。',
  characters: [
    { id: 'one', name: '甲', profile: '只属于甲的秘密。', appearanceId: null },
    { id: 'two', name: '乙', profile: '只属于乙的秘密。', appearanceId: 'blue' },
  ],
  ending: { culpritId: 'one', reveal: '仅在揭晓后显示的结局。' },
}

export function setup(clock: ConversationClock = { now: () => 0, setTimeout, clearTimeout }, content = game, resolveVoiceId?: ControllerOptions['resolveVoiceId']) {
  const turns: { scope: ConversationScope; closed: boolean }[] = []
  let number = 0
  const voice: VoicePort = {
    create(scope) {
      const turn = { scope, closed: false }
      turns.push(turn)
      return { async open() {}, close() { turn.closed = true } }
    },
  }
  const controller = createGameController({ readGame: async () => content, voice, newSessionId: () => `session-${++number}`, now: () => 100, clock, resolveVoiceId })
  return { controller, turns, voice }
}
