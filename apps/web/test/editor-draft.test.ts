// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { createDraft, draftGame, DRAFT_KEY, loadDraft, removeCharacter, saveDraft } from '../src/editor/draft'
import { game as sourceGame } from './helpers'

const appearances = [{ id: 'blue', name: '蓝衣眼镜', avatar: '/a.png', portrait: '/p.png', accent: '#123456', voiceId: null, portraits: { listening: null, waiting: null, speaking: null } }]
const game = { ...sourceGame, characters: sourceGame.characters.map((character) => ({ ...character, appearanceId: 'blue' })) }

function editable() { return JSON.parse(JSON.stringify(game)) }
describe('editor drafts', () => {
  it('saves and restores an incomplete draft without requiring playable fields', () => {
    const draft = createDraft()
    const values = new Map<string, string>()
    const storage = { setItem: (key: string, value: string) => { values.set(key, value) }, getItem: (key: string) => values.get(key) ?? null }
    expect(loadDraft(storage)).toBeNull()
    saveDraft(storage, draft)
    expect(loadDraft(storage)).toEqual(draft)
    expect(storage.getItem(DRAFT_KEY)).toBeTruthy()
    expect(() => draftGame(draft, appearances)).toThrow('标题')
  })
  it('drops the answer selection when that person is deleted, without choosing another answer', () => {
    const draft = editable()
    removeCharacter(draft, game.ending.culpritId)
    expect(draft.characters.map((character: { id: string }) => character.id)).toEqual(['two'])
    expect(draft.ending.culpritId).toBe('')
    expect(() => draftGame(draft, appearances)).toThrow('案件答案')
  })
  it('retains the answer when another person is deleted and supports one person', () => {
    const draft = editable()
    removeCharacter(draft, 'two')
    expect(draftGame(draft, appearances).characters).toHaveLength(1)
  })
  it.each([0, -1, 0.5, NaN])('rejects invalid interrogation seconds %s', (duration) => {
    const draft = editable()
    draft.interrogationLimitSeconds = duration
    expect(() => draftGame(draft, appearances)).toThrow('正整数秒')
  })
  it('requires complete character profiles, a reveal, and known appearances', () => {
    const draft = editable()
    draft.characters[0].profile = ''
    expect(() => draftGame(draft, appearances)).toThrow('人物设定')
    draft.characters[0].profile = '设定'
    draft.ending.reveal = ''
    expect(() => draftGame(draft, appearances)).toThrow('完整经过')
    draft.ending.reveal = '结局'
    draft.characters[0].appearanceId = 'missing'
    expect(() => draftGame(draft, appearances)).toThrow('有效的预置形象')
  })
  it.each(['{', '{}', '{"characters":[null]}'])('reports malformed local drafts %s', (value) => {
    expect(() => loadDraft({ getItem: () => value })).toThrow()
  })
  it('returns a playable copied snapshot without mutating the draft', () => {
    const draft = editable()
    const content = draftGame(draft, appearances)
    draft.characters[0].profile = '后来改了'
    expect(content.characters[0].profile).toBe(game.characters[0].profile)
  })
})
