import type { DialogueEntry, GameDefinition } from '../src'

// Placeholder stories for module tests only, not the first playable case.
export function twoCharacterPlaceholder(): GameDefinition {
  return {
    id: 'placeholder-two',
    title: '双人测试占位',
    background: '  公共背景原文\n不对它做摘要。  ',
    interrogationLimitSeconds: 60,
    characters: [
      { id: 'a', name: '甲', profile: '  甲的设定原文\n秘密甲。  ', appearanceId: null },
      { id: 'b', name: '乙', profile: '乙独有秘密：提前离开。', appearanceId: 'placeholder-b' }
    ],
    ending: { culpritId: 'a', reveal: '只在成功指认后揭晓的结局。' }
  }
}

export function threeCharacterPlaceholder(): GameDefinition {
  const game = twoCharacterPlaceholder()
  return {
    ...game,
    id: 'placeholder-three',
    title: '三人测试占位',
    interrogationLimitSeconds: 90,
    characters: [...game.characters, { id: 'c', name: '丙', profile: '丙的设定。', appearanceId: null }],
    ending: { culpritId: 'c', reveal: '三人包的独立结局。' }
  }
}

export function dialogue(id = 'entry-1'): DialogueEntry {
  return { id, role: 'user', text: '玩家声称自己已经知道答案。', at: 20, interrupted: false }
}

export function freezeDeep<T>(value: T): T {
  if (value != null && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) freezeDeep(child)
  }
  return value
}
