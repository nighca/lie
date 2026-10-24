import { validateGame, type GameDefinition } from '@lie/game-core'

import type { CharacterPreset } from '../presentation/characterPresets'

export interface DraftCharacter { id: string; name: string; profile: string; appearanceId: string | null }
export interface EditorDraft {
  id: string
  title: string
  background: string
  interrogationLimitSeconds: number
  characters: DraftCharacter[]
  ending: { culpritId: string; reveal: string }
}
export const DRAFT_KEY = 'lie-editor-draft'
export function createDraft(appearanceId: string | null = null): EditorDraft {
  const id = crypto.randomUUID()
  const characterId = crypto.randomUUID()
  return { id, title: '', background: '', interrogationLimitSeconds: 600, characters: [{ id: characterId, name: '', profile: '', appearanceId }], ending: { culpritId: '', reveal: '' } }
}
export function removeCharacter(draft: EditorDraft, id: string) {
  draft.characters = draft.characters.filter((character) => character.id !== id)
  if (draft.ending.culpritId === id) draft.ending.culpritId = ''
}
export interface DraftIssue {
  step: 0 | 1 | 2
  field: string
  characterId: string | null
  message: string
}
/** Authoring requirements locate incomplete fields without blocking step navigation. */
export function draftIssues(draft: EditorDraft, characterPresets: readonly CharacterPreset[]): DraftIssue[] {
  const issues: DraftIssue[] = []
  const add = (step: DraftIssue['step'], field: string, message: string, characterId: string | null = null) => issues.push({ step, field, message, characterId })
  if (!draft.title.trim()) add(0, 'title', '请填写案件标题')
  if (!draft.background.trim()) add(0, 'background', '请填写公共背景')
  if (!Number.isSafeInteger(draft.interrogationLimitSeconds) || draft.interrogationLimitSeconds <= 0) add(0, 'duration', '询问时长必须是正整数秒')
  if (draft.characters.length === 0) add(1, 'add-character', '请至少添加一位人物')
  for (const [index, character] of draft.characters.entries()) {
    const name = character.name.trim() || `人物 ${index + 1}`
    if (!character.name.trim()) add(1, 'name', `请填写人物 ${index + 1} 的姓名`, character.id)
    if (!character.profile.trim()) add(1, 'profile', `请填写${name}的人物设定`, character.id)
    if (!characterPresets.some((characterPreset) => characterPreset.id === character.appearanceId)) add(1, 'preset', `请为${name}选择有效的人物预设`, character.id)
  }
  if (!draft.characters.some((character) => character.id === draft.ending.culpritId)) add(1, 'answer', '请在人物编辑中选择一位案件答案')
  if (!draft.ending.reveal.trim()) add(2, 'reveal', '请填写完整经过')
  return issues
}
export function draftGame(draft: EditorDraft, characterPresets: readonly CharacterPreset[]): GameDefinition {
  const issue = draftIssues(draft, characterPresets)[0]
  if (issue != null) throw new Error(issue.message)
  return validateGame(draft)
}

export function saveDraft(storage: Pick<Storage, 'setItem'>, draft: EditorDraft) {
  storage.setItem(DRAFT_KEY, JSON.stringify(draft))
}
/** Drafts may be incomplete; validate their editable shape, not playable content. */
export function loadDraft(storage: Pick<Storage, 'getItem'>): EditorDraft | null {
  const text = storage.getItem(DRAFT_KEY)
  if (text == null) return null
  const value = JSON.parse(text)
  if (value == null || typeof value !== 'object' || typeof value.id !== 'string' || typeof value.title !== 'string' || typeof value.background !== 'string' || typeof value.interrogationLimitSeconds !== 'number' || !Array.isArray(value.characters) || value.ending == null || typeof value.ending.culpritId !== 'string' || typeof value.ending.reveal !== 'string') throw new Error('草稿无法读取')
  for (const item of value.characters) {
    if (item == null || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.profile !== 'string' || (item.appearanceId !== null && typeof item.appearanceId !== 'string')) throw new Error('草稿无法读取')
  }
  return { id: value.id, title: value.title, background: value.background, interrogationLimitSeconds: value.interrogationLimitSeconds, characters: value.characters.map((item: DraftCharacter) => ({ ...item })), ending: { culpritId: value.ending.culpritId, reveal: value.ending.reveal } }
}
