import { onActivated, onDeactivated, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

import type { CharacterPreset } from '../presentation/characterPresets'
import { DRAFT_KEY, draftIssues, readDraft, type EditorDraft } from './draft'

export interface EditorTool {
  name: string
  description: string
  inputSchema: object
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }
  execute: (input: Record<string, unknown>) => unknown
}
export interface EditorModelContext {
  registerTool: (tool: EditorTool, options: { signal: AbortSignal }) => Promise<void>
}

const textSchema = { type: 'string' }
const changesSchema = {
  type: 'object', additionalProperties: false, minProperties: 1,
  properties: {
    title: textSchema, summary: textSchema, background: textSchema,
    interrogationLimitSeconds: { type: 'integer', minimum: 1 },
    characters: {
      type: 'array', description: 'Replaces the entire character list. Include every character to keep. Omit this field to preserve the list.',
      items: {
        type: 'object', additionalProperties: false,
        properties: { id: { type: 'string', minLength: 1 }, name: textSchema, profile: textSchema, appearanceId: { type: ['string', 'null'] } },
        required: ['id', 'name', 'profile', 'appearanceId'],
      },
    },
    ending: { type: 'object', additionalProperties: false, minProperties: 1, properties: { culpritId: textSchema, reveal: textSchema } },
  },
}

function readChanges(input: unknown): Record<string, unknown> {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) throw new Error('修改内容必须是对象。')
  return input as Record<string, unknown>
}

/** Page tools edit the same draft as the form; no separate authoring state or model calls. */
export function useEditorTools(options: {
  draft: Ref<EditorDraft>
  presets: () => readonly CharacterPreset[]
  isBusy: () => boolean
  replaceDraft: (draft: EditorDraft) => void
}) {
  const supported = ref(false)
  const status = ref('正在准备网页工具…')
  const session = crypto.randomUUID()
  let generation = 0
  let active = false
  let initialized = false
  let controller: AbortController | null = null
  let stored: string | null = null
  let storageConflict = false
  const revision = () => `${session}:${generation}`

  function readStorage() {
    try { return localStorage.getItem(DRAFT_KEY) }
    catch { throw new Error('浏览器不允许读取本地草稿，请先检查存储权限。') }
  }
  function checkCurrent() {
    if (!active) throw new Error('编辑器已离开，请回到编辑器重新读取版本。')
    if (readStorage() !== stored) { storageConflict = true; generation++ }
    if (storageConflict) throw new Error('其他页面改变了本地草稿。请先保留当前内容并重新打开编辑器，再让助手继续编辑。')
  }
  function externalStorage(event: StorageEvent) {
    if (event.storageArea != null && event.storageArea !== localStorage) return
    if (event.key !== DRAFT_KEY && event.key !== null) return
    storageConflict = true
    generation++
  }
  watch(options.draft, () => {
    if (!supported.value) return
    generation++
    try { stored = readStorage() } catch { /* Existing editor save UI reports storage failures. */ }
  }, { deep: true, flush: 'sync' })

  function tools(signal: AbortSignal): EditorTool[] {
    function available() {
      if (signal.aborted) throw new Error('本轮网页工具已失效，请重新发现工具。')
      checkCurrent()
    }
    return [
      {
        name: 'lie_authoring_guide',
        description: 'Read LIE case authoring rules, editable fields and available appearances. Does not read draft text. Use these page tools to directly edit the current form, not a candidate.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute() {
          available()
          return {
            changesSchema,
            appearances: options.presets().map(({ id, name }) => ({ id, name })),
            rules: [
              '根据作者灵感创作中文语音询问案件，必要时只澄清关键意图。人数可变，不必固定三人。',
              '公共背景只有玩家与所有角色都知道的信息；每份profile是该角色的私有纯文本，明确亲历、知道与不知道、隐瞒及回答方式。',
              '保持真相、时间和角色所知一致，不把全知真相写进所有角色；不要新增搜证、证据组合、条件解锁或规则DSL。',
              'ending.culpritId引用唯一答案人物；它不限于凶手。reveal仅在正确指认后揭晓，程序判断胜负。',
              '先调用lie_editor_state取得revision；lie_update_draft直接修改当前表单并尝试本地保存，不经过候选采纳。',
              '只提交作者要求的字段。ending按字段合并；characters提供时替换整个列表，必须包含全部要保留的人物，省略则保留原列表。人物id非空且唯一。',
              '允许草稿尚未填完，试玩/分享前由现有编辑器检查必填内容。工具不返回原稿正文，不要声称读取了未提供的内容。',
              '不要自动试玩、分享、投稿或开启语音。结构检查不保证剧情一致、可推理或真实角色表现。',
            ],
          }
        },
      },
      {
        name: 'lie_editor_state',
        description: 'Read only the current editor revision and whether it has content. Returns no draft text, profiles or ending. Read before modifying the current form.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute() {
          available()
          const draft = options.draft.value
          return { revision: revision(), hasDraftContent: [draft.title, draft.summary, draft.background, draft.ending.culpritId, draft.ending.reveal, ...draft.characters.flatMap((person) => [person.name, person.profile])].some((text) => text !== '') }
        },
      },
      {
        name: 'lie_update_draft',
        description: 'Directly edit the current LIE form and try to save the current browser draft. Pass the latest editor revision and only requested fields. Ending fields merge; characters replaces the whole list. No candidate/adoption step. Does not share, publish, start voice or return existing draft text.',
        inputSchema: { type: 'object', additionalProperties: false, properties: { revision: { type: 'string' }, changes: changesSchema }, required: ['revision', 'changes'] },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          try {
            available()
            if (options.isBusy()) throw new Error('编辑器正在保存分享，请稍后再修改。')
            if (input.revision !== revision()) throw new Error('表单已改变，请重新读取编辑版本后再修改。')
            const changes = readChanges(input.changes)
            const allowed = Object.keys(changesSchema.properties)
            if (Object.keys(changes).length === 0 || Object.keys(changes).some((key) => !allowed.includes(key))) throw new Error('只能修改编辑器提供的字段。')
            const ending = changes.ending == null ? {} : readChanges(changes.ending)
            if ('ending' in changes && (changes.ending == null || Object.keys(ending).length === 0 || Object.keys(ending).some((key) => !['culpritId', 'reveal'].includes(key)))) throw new Error('结局只能修改答案人物和揭晓内容。')
            if (Array.isArray(changes.characters) && changes.characters.some((person) => Object.keys(readChanges(person)).some((key) => !['id', 'name', 'profile', 'appearanceId'].includes(key)))) throw new Error('人物只能修改标识、姓名、设定和形象。')
            const draft = readDraft({ ...options.draft.value, ...changes, id: options.draft.value.id, ending: { ...options.draft.value.ending, ...ending } })
            if ('interrogationLimitSeconds' in changes && (!Number.isSafeInteger(draft.interrogationLimitSeconds) || draft.interrogationLimitSeconds <= 0)) throw new Error('询问时长必须是正整数秒。')
            const ids = new Set<string>()
            for (const person of draft.characters) {
              if ('characters' in changes && (!person.id.trim() || ids.has(person.id))) throw new Error('人物标识必须非空且唯一。')
              ids.add(person.id)
              if ('characters' in changes && person.appearanceId != null && !options.presets().some((preset) => preset.id === person.appearanceId)) throw new Error('人物形象不可用，请使用当前形象列表。')
            }
            if (('characters' in changes || 'culpritId' in ending) && draft.ending.culpritId !== '' && !ids.has(draft.ending.culpritId)) throw new Error('答案必须引用当前人物；删除答案人物时请同时清空或修改答案。')
            options.replaceDraft(draft)
            let saved = false
            try { saved = readStorage() === JSON.stringify(options.draft.value) } catch { /* The change remains in memory. */ }
            return { status: saved ? 'updated' : 'updated_unsaved', revision: revision(), draftChanged: true, saved, issues: draftIssues(draft, options.presets()).map(({ step, field, characterId }) => ({ step, field, characterId })) }
          } catch (error) { return { status: 'rejected', message: error instanceof Error ? error.message : '无效修改。', draftChanged: false, saved: false } }
        },
      },
    ]
  }
  async function activate() {
    if (active) return
    active = true
    const context = (document as Document & { modelContext?: EditorModelContext }).modelContext
    supported.value = context != null
    if (context == null) return
    try {
      const current = readStorage()
      if (initialized && current !== stored) storageConflict = true
      if (!initialized) { stored = current; initialized = true }
    } catch { status.value = '浏览器不允许读取本地草稿，网页工具暂不可用。请检查存储权限。'; return }
    window.addEventListener('storage', externalStorage)
    const registration = new AbortController()
    controller = registration
    try {
      for (const tool of tools(registration.signal)) {
        if (registration.signal.aborted) return
        await context.registerTool(tool, { signal: registration.signal })
      }
      if (!registration.signal.aborted) status.value = '网页工具已准备好，可在兼容的 AI 助手中提出编辑要求。'
    } catch {
      registration.abort()
      if (controller === registration && active) status.value = '此浏览器提供网页工具接口，但本页工具未能完成注册。请重新打开编辑器后再试。'
    }
  }
  function deactivate() {
    active = false
    generation++
    controller?.abort()
    controller = null
    window.removeEventListener('storage', externalStorage)
  }
  onMounted(activate)
  onActivated(activate)
  onDeactivated(deactivate)
  onUnmounted(deactivate)
  return { supported, status }
}
