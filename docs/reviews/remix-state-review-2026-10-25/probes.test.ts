import { Blob } from 'node:buffer'
import { writeFileSync } from 'node:fs'
import { TextDecoder, TextEncoder } from 'node:util'
import { flushPromises, mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import Application from '../../../apps/web/src/Application.vue'
import Editor from '../../../apps/web/src/editor/Editor.vue'
import { createRemixDraft, DRAFT_KEY } from '../../../apps/web/src/editor/draft'
import { game as source, setup } from '../../../apps/web/test/helpers'

Object.assign(globalThis, { Blob, TextEncoder, TextDecoder })
const preset = { id: 'blue', name: '蓝衣眼镜', avatar: '/a.png', portrait: '/p.png', accent: '#123456', voiceId: null, animation: null, portraits: { listening: null, waiting: null, speaking: null } }
const game = { ...source, characters: source.characters.map(p => ({ ...p, appearanceId: 'blue' })) }
const observations: Record<string, unknown>[] = []
const cleanup: (() => void)[] = []
afterAll(() => writeFileSync('docs/reviews/remix-state-review-2026-10-25/probe-results.json', JSON.stringify({ base: '29987714c8df1cd85fba88684680d902106ad673', node: process.version, observations }, null, 2) + '\n'))
async function settle() { for (let i = 0; i < 4; i++) await flushPromises() }
beforeEach(() => {
  localStorage.clear()
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
  vi.stubGlobal('fetch', vi.fn(() => { throw Error('network forbidden in review') }))
})
afterEach(() => { cleanup.splice(0).forEach(fn => fn()); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('RSM-01: unsaved edits are lost on normal preview → return, without leaving the app', async () => {
  const original = createRemixDraft(game)
  original.title = '已保存改编稿B'
  localStorage.setItem(DRAFT_KEY, JSON.stringify(original))
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:all(.*)*', component: Application }] })
  await router.push('/editor')
  const sessions: ReturnType<typeof setup>[] = []
  const wrapper = mount(Application, { props: { characterPresets: [preset], catalog: [], demo: true, createController: content => { const session = setup(undefined, content ?? game); sessions.push(session); return session.controller } }, global: { plugins: [router] } })
  cleanup.push(() => wrapper.unmount()); await settle()
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('quota exhausted') })
  await wrapper.get('input[name="title"]').setValue('尚未保存的编辑C')
  expect(wrapper.text()).toContain('草稿未能保存，请勿关闭页面')
  expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).title).toBe('已保存改编稿B')
  await wrapper.findAll('button').find(b => b.text() === '试玩')!.trigger('click'); await settle()
  expect(router.currentRoute.value.path).toBe('/editor/preview')
  expect(sessions[0].controller.getView().title).toBe('尚未保存的编辑C')
  write.mockRestore()
  await wrapper.findAll('button').find(b => b.text() === '返回编辑器')!.trigger('click'); await settle()
  expect(router.currentRoute.value.path).toBe('/editor')
  const actual = (wrapper.get('input[name="title"]').element as HTMLInputElement).value
  expect(actual).toBe('已保存改编稿B')
  expect(wrapper.text()).toContain('已恢复此浏览器的草稿')
  observations.push({ probe:'RSM-01', previewTitle:'尚未保存的编辑C', afterReturnTitle:actual, actual:'unsaved edit lost despite only internal preview/return' })
  expect(fetch).not.toHaveBeenCalled()
})

it('RSM-02: a late old clipboard completion marks a different new link as copied', async () => {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(createRemixDraft(game)))
  let release!: () => void
  const writeText = vi.fn(() => new Promise<void>(resolve => { release = resolve }))
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
  const wrapper = mount(Editor, { props: { characterPresets: [preset] } }); cleanup.push(() => wrapper.unmount())
  async function click(text: string) { await wrapper.findAll('button').find(b => b.text() === text)!.trigger('click'); await settle() }
  await click('分享案件')
  await vi.waitFor(() => expect(wrapper.find('dialog[open] textarea[readonly]').exists()).toBe(true))
  const oldUrl = (wrapper.get('dialog[open] textarea[readonly]').element as HTMLTextAreaElement).value
  await click('复制分享链接')
  await wrapper.get('dialog[open] button[aria-label="关闭"]').trigger('click')
  await wrapper.get('input[name="title"]').setValue('已经修改的新内容')
  await click('分享案件')
  await vi.waitFor(() => expect(wrapper.find('dialog[open] textarea[readonly]').exists()).toBe(true))
  const newUrl = (wrapper.get('dialog[open] textarea[readonly]').element as HTMLTextAreaElement).value
  expect(newUrl).not.toBe(oldUrl)
  expect(wrapper.findAll('button').some(b => b.text() === '已复制')).toBe(false)
  release(); await settle()
  expect(wrapper.findAll('button').some(b => b.text() === '已复制')).toBe(true)
  expect(writeText).toHaveBeenCalledTimes(1); expect(writeText).toHaveBeenCalledWith(oldUrl)
  observations.push({ probe:'RSM-02', oldAndNewUrlsDiffer:true, clipboardCallCount:1, clipboardWasOldUrl:true, newDialogSaysCopied:true })
  expect(fetch).not.toHaveBeenCalled()
})

it('static remix snapshots stay isolated from original content and runtime history', async () => {
  const session = setup(undefined, game); cleanup.push(() => session.controller.dispose())
  await session.controller.load(game.id); session.controller.start()
  await session.controller.startConversation()
  session.turns[0].scope.onEvent({type:'assistantText',text:'仅本局运行记录'})
  session.controller.openAccusation(); session.controller.accuse('one')
  const first = session.controller.getRemixSource()!
  const draft = createRemixDraft(first)
  draft.title = 'changed'; draft.characters[0].profile = 'changed'; draft.ending.reveal = 'changed'
  const second = session.controller.getRemixSource()!
  expect(second).toEqual(game); expect(second).not.toBe(first)
  expect(second.characters).not.toBe(first.characters); expect(second.ending).not.toBe(first.ending)
  expect(draft.id).not.toBe(game.id)
  expect(Object.keys(second).sort()).toEqual(['background','characters','ending','id','interrogationLimitSeconds','title'])
  expect(JSON.stringify(second)).not.toContain('仅本局运行记录')
  observations.push({probe:'static-isolation',independentDraftAndSnapshot:true,runtimeHistoryAbsent:true})
  expect(fetch).not.toHaveBeenCalled()
})
