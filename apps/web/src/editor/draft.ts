import { validateGame, type GameDefinition } from '@lie/game-core'

import type { Appearance } from '../presentation/appearances'

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
  return { id, title: '', background: '', interrogationLimitSeconds: 600, characters: [{ id: characterId, name: '', profile: '', appearanceId }], ending: { culpritId: characterId, reveal: '' } }
}
export function removeCharacter(draft: EditorDraft, id: string) {
  draft.characters = draft.characters.filter((character) => character.id !== id)
  if (draft.ending.culpritId === id) draft.ending.culpritId = ''
}
export function draftGame(draft: EditorDraft, appearances: readonly Appearance[]): GameDefinition {
  const labels = [
    [draft.title, '请填写案件标题'], [draft.background, '请填写公共背景'],
    [draft.ending.culpritId, '请选择正确指认的人物'], [draft.ending.reveal, '请填写完整经过'],
  ]
  for (const [value, message] of labels) if (value.trim().length === 0) throw new Error(message)
  if (!Number.isSafeInteger(draft.interrogationLimitSeconds) || draft.interrogationLimitSeconds <= 0) throw new Error('询问时长必须是正整数秒')
  if (draft.characters.length === 0) throw new Error('请至少添加一位人物')
  for (const character of draft.characters) {
    if (!character.name.trim()) throw new Error('请填写每位人物的姓名')
    if (!character.profile.trim()) throw new Error(`请填写${character.name}的人物设定`)
    if (character.appearanceId != null && !appearances.some((appearance) => appearance.id === character.appearanceId)) throw new Error('人物形象已不可用，请重新选择')
  }
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
