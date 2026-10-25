// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { createDraft, draftGame, draftIssues, DRAFT_KEY, loadDraft, removeCharacter, saveDraft } from '../src/editor/draft'
import { decodeSharedGame, encodeGameLink } from '../src/editor/share'
import { game as sourceGame } from './helpers'

const characterPresets = [{ id: 'blue', name: '蓝衣眼镜', avatar: '/a.png', portrait: '/p.png', accent: '#123456', voiceId: null, animation: null, portraits: { listening: null, waiting: null, speaking: null } }]
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
    expect(() => draftGame(draft, characterPresets)).toThrow('标题')
  })
  it('drops the answer selection when that person is deleted, without choosing another answer', () => {
    const draft = editable()
    removeCharacter(draft, game.ending.culpritId)
    expect(draft.characters.map((character: { id: string }) => character.id)).toEqual(['two'])
    expect(draft.ending.culpritId).toBe('')
    expect(() => draftGame(draft, characterPresets)).toThrow('案件答案')
  })
  it('retains the answer when another person is deleted and supports one person', () => {
    const draft = editable()
    removeCharacter(draft, 'two')
    expect(draftGame(draft, characterPresets).characters).toHaveLength(1)
  })
  it.each([0, -1, 0.5, NaN])('rejects invalid interrogation seconds %s', (duration) => {
    const draft = editable()
    draft.interrogationLimitSeconds = duration
    expect(() => draftGame(draft, characterPresets)).toThrow('正整数秒')
  })
  it('requires complete character profiles, a reveal, and known characterPresets', () => {
    const draft = editable()
    draft.characters[0].profile = ''
    expect(() => draftGame(draft, characterPresets)).toThrow('人物设定')
    draft.characters[0].profile = '设定'
    draft.ending.reveal = ''
    expect(() => draftGame(draft, characterPresets)).toThrow('完整经过')
    draft.ending.reveal = '结局'
    draft.characters[0].appearanceId = 'missing'
    expect(() => draftGame(draft, characterPresets)).toThrow('有效的人物预设')
  })
  it.each(['{', '{}', '{"characters":[null]}'])('reports malformed local drafts %s', (value) => {
    expect(() => loadDraft({ getItem: () => value })).toThrow()
  })
  it('saves duplicate names as an editable draft but rejects them before playing', () => {
    const draft = editable()
    draft.characters[0].name = ' 小林 '
    draft.characters[1].name = '小林'
    let saved: string | null = null
    saveDraft({ setItem: (_key, value) => { saved = value } }, draft)
    expect(loadDraft({ getItem: () => saved })).toEqual(draft)
    expect(draftIssues(draft, characterPresets)).toEqual(draft.characters.map((person: { id: string }) => ({ step: 1, field: 'name', characterId: person.id, message: '人物姓名“小林”重复，请使用不同姓名' })))
    expect(() => draftGame(draft, characterPresets)).toThrow('人物姓名“小林”重复')
    draft.characters[1].name = '小周'
    expect(draftIssues(draft, characterPresets)).toEqual([])
    expect(draftGame(draft, characterPresets).characters.map((person) => person.name)).toEqual([' 小林 ', '小周'])
  })
  it('locates every member of two duplicate groups, excluding blank required names', () => {
    const draft = editable()
    draft.characters = ['小林', ' 小周 ', ' 小林 ', '小周', '', '  '].map((name, index) => ({ ...draft.characters[0], id: `person-${index}`, name }))
    draft.ending.culpritId = 'person-0'
    const issues = draftIssues(draft, characterPresets)
    expect(issues.slice(0, 4).map((issue) => [issue.characterId, issue.field, issue.message])).toEqual([
      ['person-0', 'name', '人物姓名“小林”重复，请使用不同姓名'],
      ['person-1', 'name', '人物姓名“小周”重复，请使用不同姓名'],
      ['person-2', 'name', '人物姓名“小林”重复，请使用不同姓名'],
      ['person-3', 'name', '人物姓名“小周”重复，请使用不同姓名'],
    ])
    expect(issues.slice(4).map((issue) => issue.message)).toEqual(['请填写人物 5 的姓名', '请填写人物 6 的姓名'])
  })
  it('continues opening existing shared cases with duplicate display names', async () => {
    const content = editable()
    content.characters.forEach((person: { name: string }) => { person.name = '小林' })
    const url = await encodeGameLink(content, 'https://lie.example')
    const restored = await decodeSharedGame(new URL(url).hash, characterPresets)
    expect(restored.characters.map((person) => person.name)).toEqual(['小林', '小林'])
    expect(restored.ending).toEqual(content.ending)
  })
  it('returns a playable copied snapshot without mutating the draft', () => {
    const draft = editable()
    const content = draftGame(draft, characterPresets)
    draft.characters[0].profile = '后来改了'
    expect(content.characters[0].profile).toBe(game.characters[0].profile)
  })
})
