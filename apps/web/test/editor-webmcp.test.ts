import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Editor from '../src/editor/Editor.vue'
import { DRAFT_KEY } from '../src/editor/draft'
import type { EditorModelContext, EditorTool } from '../src/editor/useEditorTools'
import * as sharing from '../src/editor/share'
import { game } from './helpers'

const preset = { id: 'blue', name: '蓝衣人物', avatar: '/avatar.png', portrait: '/portrait.png', accent: '#123456', voiceId: null, animation: null, portraits: { listening: null, waiting: null, speaking: null } }
const story = { ...game, characters: game.characters.map((person) => ({ ...person, appearanceId: preset.id })) }
const cleanup: (() => void)[] = []
let tools: Map<string, EditorTool>
let registrations: { tool: EditorTool; signal: AbortSignal }[]

beforeEach(() => {
  history.replaceState(null, '', '/editor')
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.open = true } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false } })
  tools = new Map()
  registrations = []
  const context: EditorModelContext = {
    async registerTool(tool, { signal }) {
      tools.set(tool.name, tool)
      registrations.push({ tool, signal })
      signal.addEventListener('abort', () => { if (tools.get(tool.name) === tool) tools.delete(tool.name) })
    },
  }
  Object.defineProperty(document, 'modelContext', { configurable: true, value: context })
})
afterEach(() => {
  cleanup.splice(0).forEach((action) => action())
  vi.restoreAllMocks()
  localStorage.clear()
  history.replaceState(null, '', '/')
  Reflect.deleteProperty(document, 'modelContext')
})
async function page(stored: unknown = null) {
  if (stored != null) localStorage.setItem(DRAFT_KEY, JSON.stringify(stored))
  const wrapper = mount(Editor, { props: { characterPresets: [preset] } })
  cleanup.push(() => wrapper.unmount())
  await flushPromises()
  return wrapper
}
function state() { return tools.get('lie_editor_state')!.execute({}) as { revision: string; hasDraftContent: boolean } }
function update(changes: unknown, revision = state().revision) {
  return tools.get('lie_update_draft')!.execute({ revision, changes }) as { status: string; message?: string; saved: boolean; draftChanged: boolean; issues: object[]; revision: string }
}
function saved() { return JSON.parse(localStorage.getItem(DRAFT_KEY)!) }
async function click(wrapper: VueWrapper, text: string) {
  await wrapper.findAll('button').find((button) => button.text() === text || button.attributes('aria-label') === text)!.trigger('click')
  await flushPromises()
}
async function help(wrapper: VueWrapper) {
  await wrapper.get('.editor-ai-help button').trigger('click')
  await flushPromises()
}

describe('editor WebMCP tools', () => {
  it('shows a small support entry without requiring a query, with details only in the dialog', async () => {
    const wrapper = await page(story)
    expect(tools.size).toBe(3)
    expect(wrapper.get('.editor-ai-help').text()).toContain('此浏览器支持 AI 助手协作编辑')
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe(story.title)
    await help(wrapper)
    expect(wrapper.get('dialog').text()).toContain('这不表示已有助手连接')
    expect(wrapper.get('dialog').text()).toContain('修改会直接出现在当前表单')
    await click(wrapper, '关闭')
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('keeps normal editing with no AI entry when the API is absent', async () => {
    Reflect.deleteProperty(document, 'modelContext')
    const wrapper = await page(story)
    expect(wrapper.find('.editor-ai-help').exists()).toBe(false)
    expect(tools.size).toBe(0)
    await wrapper.get('[name=title]').setValue('手写案件')
    expect(saved().title).toBe('手写案件')
  })

  it('directly updates partial fields of an incomplete draft and saves the same editor draft', async () => {
    const wrapper = await page(story)
    const result = update({ title: '', background: '新的公共背景' })
    await flushPromises()
    expect(result).toMatchObject({ status: 'updated', saved: true, draftChanged: true })
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe('')
    expect(saved()).toEqual({ ...story, title: '', background: '新的公共背景' })
    expect(result.issues).toContainEqual({ step: 0, field: 'title', characterId: null })
  })

  it('preserves unrelated unfinished or invalid fields when editing a different field', async () => {
    const unfinished = { ...story, interrogationLimitSeconds: 0, characters: story.characters.map((person) => ({ ...person, appearanceId: 'old-preset' })), ending: { culpritId: 'not-selected-yet', reveal: '' } }
    await page(unfinished)
    expect(update({ title: '先写标题' }).status).toBe('updated')
    expect(saved()).toEqual({ ...unfinished, title: '先写标题' })
  })

  it('writes an entire generated case straight into the form in one save', async () => {
    const wrapper = await page()
    const write = vi.spyOn(Storage.prototype, 'setItem')
    const { id, ...changes } = story
    expect(update(changes)).toMatchObject({ status: 'updated', saved: true, issues: [] })
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe(story.title)
    expect(saved().id).not.toBe(id)
    expect({ ...saved(), id }).toEqual(story)
    expect(write).toHaveBeenCalledTimes(1)
  })

  it('merges ending fields and preserves current step and selected character', async () => {
    const wrapper = await page(story)
    await wrapper.findAll('.editor-steps button')[2].trigger('click')
    update({ ending: { reveal: '新的结局' } }); await flushPromises()
    expect(wrapper.get('h1').text()).toBe('答案揭晓')
    expect(wrapper.get<HTMLTextAreaElement>('[name=reveal]').element.value).toBe('新的结局')
    expect(saved().ending.culpritId).toBe(story.ending.culpritId)
    await wrapper.findAll('.editor-steps button')[1].trigger('click')
    await wrapper.findAll('.character-card')[1].trigger('click')
    update({ characters: story.characters.map((person) => ({ ...person, profile: '新的设定' })) }); await flushPromises()
    expect(wrapper.get('h1').text()).toBe('故事人物')
    expect(wrapper.get<HTMLInputElement>('[data-field=name]').element.value).toBe(story.characters[1].name)
    expect(wrapper.get<HTMLTextAreaElement>('[data-field=profile]').element.value).toBe('新的设定')
  })

  it('rejects malformed or unknown patch fields without modifying the draft', async () => {
    await page(story)
    const original = localStorage.getItem(DRAFT_KEY)
    const variants = [null, {}, { id: 'other' }, { ending: null }, { ending: { id: 'other' } }, { title: 3 }, { characters: [null] }, { characters: story.characters.map((person) => ({ ...person, script: 'extra' })) }, { characters: [story.characters[0], story.characters[0]] }, { characters: story.characters.map((person) => ({ ...person, appearanceId: 'missing' })) }, { interrogationLimitSeconds: 0 }, { ending: { culpritId: 'missing' } }]
    for (const changes of variants) expect(update(changes)).toMatchObject({ status: 'rejected', draftChanged: false, saved: false })
    expect(localStorage.getItem(DRAFT_KEY)).toBe(original)
  })

  it('allows empty author text and an empty character list, with explicit answer clearing', async () => {
    await page(story)
    expect(update({ characters: [] }).status).toBe('rejected')
    expect(update({ characters: [], ending: { culpritId: '', reveal: '' } })).toMatchObject({ status: 'updated', saved: true })
    expect(saved().characters).toEqual([])
    expect(saved().ending).toEqual({ culpritId: '', reveal: '' })
  })

  it('returns only revision/booleans and content-free readiness locations', async () => {
    await page(story)
    expect(state()).toEqual({ revision: expect.any(String), hasDraftContent: true })
    const result = update({ characters: story.characters.map((person) => ({ ...person, name: '私密同名' })) })
    expect(result.status).toBe('updated')
    expect(result.issues).toContainEqual({ step: 1, field: 'name', characterId: 'one' })
    expect(JSON.stringify(result)).not.toContain('私密同名')
    expect(JSON.stringify(result)).not.toContain(story.characters[0].profile)
    expect(JSON.stringify(result)).not.toContain(story.ending.reveal)
  })

  it('rejects old revisions after manual edit and restore, including repeated tool writes', async () => {
    const wrapper = await page(story)
    const old = state().revision
    await wrapper.get('[name=title]').setValue('正在修改')
    await wrapper.get('[name=title]').setValue(story.title)
    expect(update({ title: '过时写入' }, old).status).toBe('rejected')
    const current = state().revision
    expect(update({ title: '新稿' }, current).status).toBe('updated')
    expect(update({ title: '重复旧调用' }, current).status).toBe('rejected')
    expect(saved().title).toBe('新稿')
  })

  it('returns updated_unsaved while retaining form changes if persistence fails', async () => {
    const wrapper = await page(story)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(update({ title: '内存中的稿' })).toMatchObject({ status: 'updated_unsaved', saved: false, draftChanged: true })
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe('内存中的稿')
    expect(wrapper.text()).toContain('草稿未能保存，请勿关闭页面')
    expect(saved().title).toBe(story.title)
  })

  it('allows another field to change while a manual overflowing duration remains unsaved', async () => {
    const wrapper = await page(story)
    await wrapper.get('[name=duration]').setValue('1e308')
    expect(update({ title: '保留未修正时长' })).toMatchObject({ status: 'updated_unsaved', saved: false, draftChanged: true })
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe('保留未修正时长')
    expect(saved()).toEqual(story)
  })

  it('protects the current share dialog while sharing is in flight', async () => {
    let complete: (url: string) => void = () => {}
    vi.spyOn(sharing, 'saveSharedGame').mockImplementation(() => new Promise((resolve) => { complete = resolve }))
    const wrapper = await page(story)
    await click(wrapper, '分享案件')
    expect(wrapper.get('dialog').text()).toContain('正在保存案件')
    expect(wrapper.get('.editor-ai-help button').attributes('disabled')).toBeDefined()
    expect(update({ title: '稍后再改' }).status).toBe('rejected')
    expect(saved().title).toBe(story.title)
    complete('https://lie.example/play?share=v1.test'); await flushPromises()
  })

  it('rejects writes when storage cannot be observed', async () => {
    const wrapper = await page(story)
    const revision = state().revision
    const write = vi.spyOn(Storage.prototype, 'setItem')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(update({ title: '不应写入' }, revision)).toMatchObject({ status: 'rejected', saved: false, draftChanged: false })
    expect(write).not.toHaveBeenCalled()
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe(story.title)
  })

  it('checks storage before writing, even before an external event arrives', async () => {
    await page(story)
    const revision = state().revision
    localStorage.setItem(DRAFT_KEY, 'external')
    expect(update({ title: '不应覆盖' }, revision).status).toBe('rejected')
    expect(localStorage.getItem(DRAFT_KEY)).toBe('external')
  })

  it('permanently invalidates observed cross-tab changes even when the stored bytes are restored', async () => {
    await page(story)
    const revision = state().revision
    window.dispatchEvent(new StorageEvent('storage', { key: DRAFT_KEY, newValue: 'external', storageArea: localStorage }))
    expect(update({ title: '不应覆盖' }, revision).status).toBe('rejected')
    expect(saved()).toEqual(story)
  })

  it('unregisters cached editors and rejects old callbacks after reactivation', async () => {
    const visible = ref(true)
    const wrapper = mount(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => visible.value ? h(Editor, { characterPresets: [preset] }) : null }) }))
    cleanup.push(() => wrapper.unmount())
    await flushPromises()
    expect(registrations).toHaveLength(3)
    const old = tools.get('lie_editor_state')!
    const oldRevision = state().revision
    visible.value = false; await flushPromises()
    expect(tools.size).toBe(0)
    visible.value = true; await flushPromises()
    expect(tools.size).toBe(3)
    expect(() => old.execute({})).toThrow()
    expect(update({ title: '旧调用' }, oldRevision).status).toBe('rejected')
  })

  it('detects an external draft change while the editor was cached', async () => {
    const visible = ref(true)
    const wrapper = mount(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => visible.value ? h(Editor, { characterPresets: [preset] }) : null }) }))
    cleanup.push(() => wrapper.unmount())
    await flushPromises()
    const revision = state().revision
    visible.value = false; await flushPromises()
    localStorage.setItem(DRAFT_KEY, 'external')
    visible.value = true; await flushPromises()
    expect(update({ title: '不应覆盖' }, revision).status).toBe('rejected')
    expect(localStorage.getItem(DRAFT_KEY)).toBe('external')
  })

  it('ignores late registration failures from a previous activation', async () => {
    let rejectOld: (error: Error) => void = () => {}
    const context = (document as Document & { modelContext: EditorModelContext }).modelContext
    const register = context.registerTool
    vi.spyOn(context, 'registerTool').mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectOld = reject })).mockImplementation(register)
    const visible = ref(true)
    const wrapper = mount(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => visible.value ? h(Editor, { characterPresets: [preset] }) : null }) }))
    cleanup.push(() => wrapper.unmount())
    await flushPromises()
    visible.value = false; await flushPromises()
    visible.value = true; await flushPromises()
    rejectOld(new Error('old activation')); await flushPromises()
    await help(wrapper)
    expect(wrapper.get('dialog').text()).toContain('网页工具已准备好')
    expect(tools.size).toBe(3)
  })
})
