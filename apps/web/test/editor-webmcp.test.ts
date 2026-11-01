import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Editor from '../src/editor/Editor.vue'
import { DRAFT_KEY } from '../src/editor/draft'
import type { AuthoringModelContext, AuthoringTool } from '../src/editor/useAuthoringDemo'
import { game } from './helpers'

const demoKey = 'lie-webmcp-demo-draft'
const preset = { id: 'blue', name: '蓝衣人物', avatar: '/avatar.png', portrait: '/portrait.png', accent: '#123456', voiceId: null, animation: null, portraits: { listening: null, waiting: null, speaking: null } }
const proposed = { ...game, title: '午餐之谜', characters: game.characters.map((person) => ({ ...person, appearanceId: preset.id })) }
const cleanup: (() => void)[] = []
let tools: Map<string, AuthoringTool>
let registrations: { tool: AuthoringTool; signal: AbortSignal }[]

beforeEach(() => {
  history.replaceState(null, '', '/editor?webmcp=1')
  tools = new Map()
  registrations = []
  const context: AuthoringModelContext = {
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
  localStorage.clear()
  history.replaceState(null, '', '/')
  Reflect.deleteProperty(document, 'modelContext')
  vi.restoreAllMocks()
})
async function page() {
  const wrapper = mount(Editor, { props: { characterPresets: [preset] } })
  cleanup.push(() => wrapper.unmount())
  await flushPromises()
  return wrapper
}
function read() { return tools.get('lie_editor_state')!.execute({}) as { revision: string; hasDraftContent: boolean } }
function submit(revision = read().revision, value: unknown = proposed) {
  return tools.get('lie_submit_candidate')!.execute({ revision, case: value }) as { status: string; message?: string; saved: boolean }
}
async function click(wrapper: Awaited<ReturnType<typeof page>>, text: string) {
  await wrapper.findAll('button').find((button) => button.text() === text)!.trigger('click')
  await flushPromises()
}

describe('opt-in editor WebMCP demo', () => {
  it('stages, reviews, adopts and undoes a full candidate without touching the original editor draft', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(game))
    const wrapper = await page()
    expect(tools.size).toBe(3)
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe('')
    expect(submit()).toMatchObject({ status: 'awaiting_author_review', saved: false })
    await flushPromises()
    expect(localStorage.getItem(demoKey)).toBeNull()
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe('')
    expect(wrapper.get('.authoring-candidate').text()).toContain(proposed.ending.reveal)
    await click(wrapper, '采用这份整案')
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe(proposed.title)
    expect(JSON.parse(localStorage.getItem(demoKey)!).title).toBe(proposed.title)
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!)).toEqual(game)
    await click(wrapper, '撤销此次整案替换')
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe('')
  })

  it('keeps normal editing unchanged without the demo query', async () => {
    history.replaceState(null, '', '/editor')
    localStorage.setItem(DRAFT_KEY, JSON.stringify(proposed))
    const wrapper = await page()
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe(proposed.title)
    expect(tools.size).toBe(0)
    await wrapper.get('[name=title]').setValue('手写案件')
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).title).toBe('手写案件')
  })

  it('reports a truth-first draft as nonempty without returning any story text', async () => {
    const wrapper = await page()
    await wrapper.findAll('.editor-steps button')[2].trigger('click')
    await wrapper.get('[name=reveal]').setValue('只写在本地的真相')
    expect(read()).toEqual({ revision: expect.any(String), hasDraftContent: true, candidatePending: false })
  })

  it('rejects malformed candidates, duplicate identities or names, missing answers and unavailable presets', async () => {
    const wrapper = await page()
    const variants = [null, { ...proposed, characters: [null] }, { ...proposed, characters: [proposed.characters[0], proposed.characters[0]] }, { ...proposed, characters: proposed.characters.map((person) => ({ ...person, name: '同名' })) }, { ...proposed, ending: { culpritId: 'missing', reveal: '真相' } }, { ...proposed, characters: proposed.characters.map((person) => ({ ...person, appearanceId: 'missing' })) }]
    for (const value of variants) expect(submit(read().revision, value).status).toBe('rejected')
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe('')
    expect(localStorage.getItem(demoKey)).toBeNull()
  })

  it('invalidates old submissions and candidates even after the author restores the original text', async () => {
    const wrapper = await page()
    const old = read().revision
    submit(old)
    await wrapper.get('[name=title]').setValue('正在修改')
    await wrapper.get('[name=title]').setValue('')
    expect(submit(old).status).toBe('rejected')
    expect(wrapper.findAll('button').find((button) => button.text() === '采用这份整案')!.attributes('disabled')).toBeDefined()
    expect(submit().status).toBe('awaiting_author_review')
    await flushPromises()
    await click(wrapper, '采用这份整案')
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe(proposed.title)
  })

  it('invalidates a later candidate when undo changes the draft, and protects later manual edits from undo', async () => {
    const wrapper = await page()
    submit(); await flushPromises(); await click(wrapper, '采用这份整案')
    const beforeUndo = read().revision
    submit(beforeUndo, { ...proposed, title: '下一稿' })
    await flushPromises(); await click(wrapper, '撤销此次整案替换')
    await wrapper.get('[name=title]').setValue(proposed.title)
    expect(submit(beforeUndo).status).toBe('rejected')
    submit(); await flushPromises(); await click(wrapper, '采用这份整案')
    await wrapper.get('[name=title]').setValue('后续人工修改')
    expect(wrapper.findAll('button').find((button) => button.text() === '撤销此次整案替换')!.attributes('disabled')).toBeDefined()
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe('后续人工修改')
  })

  it('retains adopted content in memory with a truthful save failure notice', async () => {
    const wrapper = await page()
    submit(); await flushPromises()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    await click(wrapper, '采用这份整案')
    expect(wrapper.get<HTMLInputElement>('[name=title]').element.value).toBe(proposed.title)
    expect(wrapper.text()).toContain('草稿未能保存，请勿关闭页面')
    expect(localStorage.getItem(demoKey)).toBeNull()
  })

  it('blocks pending adoption on external storage replacement, including observed ABA', async () => {
    const wrapper = await page()
    const revision = read().revision
    submit(revision); await flushPromises()
    localStorage.setItem(demoKey, 'external')
    window.dispatchEvent(new StorageEvent('storage', { key: demoKey, newValue: 'external', storageArea: localStorage }))
    localStorage.removeItem(demoKey)
    await flushPromises()
    expect(submit(revision).status).toBe('rejected')
  })

  it('checks storage immediately before adoption even before a storage event arrives', async () => {
    const wrapper = await page()
    submit(); await flushPromises()
    localStorage.setItem(demoKey, 'external')
    await click(wrapper, '采用这份整案')
    expect(wrapper.text()).toContain('其他页面改变了本地草稿')
    expect(localStorage.getItem(demoKey)).toBe('external')
  })

  it('unregisters while cached and rejects old callbacks after reactivation', async () => {
    const visible = ref(true)
    const wrapper = mount(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => visible.value ? h(Editor, { characterPresets: [preset] }) : null }) }))
    cleanup.push(() => wrapper.unmount())
    await flushPromises()
    expect(registrations).toHaveLength(3)
    const oldRead = tools.get('lie_editor_state')!
    const oldRevision = read().revision
    visible.value = false; await flushPromises()
    expect(tools.size).toBe(0)
    expect(() => oldRead.execute({})).toThrow()
    visible.value = true; await flushPromises()
    expect(tools.size).toBe(3)
    expect(() => oldRead.execute({})).toThrow()
    expect(submit(oldRevision).status).toBe('rejected')
  })

  it('ignores late registration failures from a previous activation', async () => {
    let rejectOld: (error: Error) => void = () => {}
    const context = (document as Document & { modelContext: AuthoringModelContext }).modelContext
    const register = context.registerTool
    vi.spyOn(context, 'registerTool').mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectOld = reject })).mockImplementation(register)
    const visible = ref(true)
    const wrapper = mount(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => visible.value ? h(Editor, { characterPresets: [preset] }) : null }) }))
    cleanup.push(() => wrapper.unmount())
    await flushPromises()
    visible.value = false; await flushPromises()
    visible.value = true; await flushPromises()
    expect(wrapper.text()).toContain('网页工具已就绪')
    rejectOld(new Error('old activation')); await flushPromises()
    expect(wrapper.text()).toContain('网页工具已就绪')
    expect(tools.size).toBe(3)
  })
})
