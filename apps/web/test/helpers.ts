import type { GameDefinition } from '@lie/game-core'

import { createGameController } from '../src/application/controller'
import type { ConversationScope, VoicePort } from '../src/application/voice'

export const game: GameDefinition = {
  id: 'test', title: '测试案件', background: '大家知道的背景。',
  characters: [
    { id: 'one', name: '甲', profile: '只属于甲的秘密。', appearanceId: null },
    { id: 'two', name: '乙', profile: '只属于乙的秘密。', appearanceId: 'blue' },
  ],
  ending: { culpritId: 'one', reveal: '仅在揭晓后显示的结局。' },
}

export function setup() {
  const turns: { scope: ConversationScope; closed: boolean; finished: boolean }[] = []
  let number = 0
  const voice: VoicePort = {
    create(scope) {
      const turn = { scope, closed: false, finished: false }
      turns.push(turn)
      return { async open() {}, async startInput() {}, finishInput() { turn.finished = true }, close() { turn.closed = true } }
    },
  }
  const controller = createGameController({ readGame: async () => game, voice, newSessionId: () => `session-${++number}`, now: () => 100 })
  return { controller, turns, voice }
}
