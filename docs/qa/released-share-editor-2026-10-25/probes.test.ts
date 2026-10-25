import { Blob } from 'node:buffer'
import { writeFileSync } from 'node:fs'
import { TextDecoder, TextEncoder } from 'node:util'
import { flushPromises, mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import Application from '../../../apps/web/src/Application.vue'
import { DRAFT_KEY } from '../../../apps/web/src/editor/draft'
import { decodeSharedGame, encodeGameLink } from '../../../apps/web/src/editor/share'
import { game as original, setup } from '../../../apps/web/test/helpers'

Object.assign(globalThis, { Blob, TextEncoder, TextDecoder })
const preset = { id: 'blue', name: '蓝衣眼镜', avatar: '/a.png', portrait: '/p.png', accent: '#123456', voiceId: null, animation: null, portraits: { listening: null, waiting: null, speaking: null } }
const game = { ...original, id: 'isolated-qa', title: '问号？#百分号% / 中文🙂', background: '第一行\n第二行\r\n第三行\t末尾', characters: original.characters.map(p => ({ ...p, appearanceId: 'blue' })) }
const observations: { scenario: string; result: string }[] = []
const cleanup: (() => void)[] = []
afterAll(() => writeFileSync('docs/qa/released-share-editor-2026-10-25/probe-results.json', JSON.stringify({ source: '48316544ea9fd22afbf1eee8db6f81e326026821', node: process.version, environment: 'jsdom + memory history; not a native browser', observations }, null, 2) + '\n'))
async function settle() { for (let i = 0; i < 6; i++) { await flushPromises(); await new Promise(resolve => setTimeout(resolve, 0)) } }
beforeEach(() => {
  localStorage.clear()
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
  vi.stubGlobal('fetch', vi.fn(() => { throw Error('network forbidden') }))
})
afterEach(() => { cleanup.splice(0).forEach(fn => fn()); expect(fetch).not.toHaveBeenCalled(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
function recorded(scenario: string, result: string) { observations.push({ scenario, result }) }
async function path(content = game) { const url = new URL(await encodeGameLink(content, 'http://localhost:5544')); return url.pathname + url.hash }
async function screen(initial: string) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:all(.*)*', component: Application }] })
  await router.push(initial)
  const sessions: ReturnType<typeof setup>[] = []
  const wrapper = mount(Application, { props: { characterPresets: [preset], catalog: [], demo: true, createController: content => { const session = setup(undefined, content ?? game); sessions.push(session); return session.controller } }, global: { plugins: [router] } })
  cleanup.push(() => wrapper.unmount()); await settle()
  async function click(text: string) {
    const button = wrapper.findAll('button').find(b => (b.attributes('aria-label') ?? b.text()) === text && (b.element.closest('dialog') == null || b.element.closest('dialog')!.open))
    expect(button, text).toBeDefined(); await button!.trigger('click'); await settle()
  }
  return { router, wrapper, sessions, click }
}

it('S1: Unicode, punctuation and mixed newlines survive a fresh decoded snapshot without writing draft', async () => {
  localStorage.setItem(DRAFT_KEY, 'unrelated exact bytes')
  const url = await path()
  const first = await screen(url)
  expect(first.sessions[0].controller.getView().title).toBe(game.title)
  const second = await screen(url)
  expect(second.sessions[0].controller.getView().background).toBe(game.background)
  expect(localStorage.getItem(DRAFT_KEY)).toBe('unrelated exact bytes')
  recorded('S1', 'fresh independent mount preserves text and exact draft bytes; no native reload tested')
})
it('S2: corrupted gzip checksum cannot construct a controller, corrected hash recovers', async () => {
  const url = await path()
  const encoded = url.split('#game=')[1]
  const raw = Buffer.from(encoded, 'base64url'); raw[raw.length - 8] ^= 1
  const result = await screen('/play#game=' + raw.toString('base64url'))
  expect(result.wrapper.text()).toContain('分享案件无法打开'); expect(result.sessions).toHaveLength(0)
  await result.router.push(url); await settle()
  expect(result.sessions).toHaveLength(1); expect(result.sessions[0].controller.getView().title).toBe(game.title)
  recorded('S2', 'bad checksum rejected, replacement valid hash opens exactly one session')
})
it('S3: unsupported preset error is recoverable by replacing the link', async () => {
  const result = await screen(await path({ ...game, characters: game.characters.map(p => ({ ...p, appearanceId: 'unavailable' })) }))
  expect(result.wrapper.text()).toContain('当前不可用的人物形象'); expect(result.sessions).toHaveLength(0)
  await result.router.push(await path()); await settle()
  expect(result.sessions).toHaveLength(1)
  recorded('S3', 'unsupported ID fails closed then valid same-page replacement succeeds')
})
it('S4: absent decompression capability produces a retryable error after capability restoration', async () => {
  const url = await path(); const native = globalThis.DecompressionStream
  vi.stubGlobal('DecompressionStream', undefined)
  const result = await screen(url)
  expect(result.wrapper.text()).toContain('当前浏览器暂不支持打开'); expect(result.sessions).toHaveLength(0)
  vi.stubGlobal('DecompressionStream', native); await result.click('重试')
  expect(result.sessions).toHaveLength(1)
  recorded('S4', 'injected missing capability recovers through actual retry button')
})
it('S5: memory history back/forward across invalid and valid share routes never retains the wrong session', async () => {
  const url = await path(); const result = await screen(url)
  await result.router.push('/play#game=broken'); await settle()
  expect(result.wrapper.text()).toContain('分享案件无法打开')
  result.router.back(); await settle(); expect(result.sessions).toHaveLength(2)
  expect(result.sessions[1].controller.getView().title).toBe(game.title)
  const dispose = vi.spyOn(result.sessions[1].controller, 'dispose')
  result.router.forward(); await settle()
  expect(result.wrapper.text()).toContain('分享案件无法打开'); expect(result.sessions).toHaveLength(2)
  expect(dispose).toHaveBeenCalledTimes(1)
  recorded('S5', 'memory history valid→bad→back→forward selects correct screen; not native popstate/BFCache')
})
it('S6: save failure followed by cached preview history return can save and share the latest text after recovery', async () => {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(game)); const result = await screen('/editor')
  const originalSet = Storage.prototype.setItem
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) { if (key === DRAFT_KEY) throw Error('fixture quota'); originalSet.call(this, key, value) })
  await result.wrapper.get('input[name="title"]').setValue('内存中的新标题')
  await result.click('试玩'); result.router.back(); await settle()
  expect((result.wrapper.get('input[name="title"]').element as HTMLInputElement).value).toBe('内存中的新标题')
  write.mockRestore(); await result.wrapper.get('input[name="title"]').setValue('恢复保存后的最终标题')
  expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).title).toBe('恢复保存后的最终标题')
  await result.click('分享案件')
  await vi.waitFor(() => expect(result.wrapper.find('dialog[open] textarea[readonly]').exists()).toBe(true))
  const shared = new URL((result.wrapper.get('dialog[open] textarea[readonly]').element as HTMLTextAreaElement).value)
  expect((await decodeSharedGame(shared.hash, [preset])).title).toBe('恢复保存后的最终标题')
  recorded('S6', 'DRAFT_KEY-only quota fixture removed; next edit saves and generated link decodes latest content')
})
it('S7: share generation capability failure leaves draft editable and retry generates a valid link', async () => {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(game)); const result = await screen('/editor')
  const native = globalThis.CompressionStream; vi.stubGlobal('CompressionStream', undefined)
  await result.click('分享案件'); expect(result.wrapper.text()).toContain('当前浏览器暂不支持生成')
  expect(result.wrapper.get('input[name="title"]').attributes('disabled')).toBeUndefined()
  vi.stubGlobal('CompressionStream', native); await result.wrapper.get('input[name="title"]').setValue('失败后继续创作')
  await result.click('分享案件'); await vi.waitFor(() => expect(result.wrapper.find('dialog[open] textarea[readonly]').exists()).toBe(true))
  expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).title).toBe('失败后继续创作')
  recorded('S7', 'injected compression failure releases busy state and subsequent share succeeds')
})
it('S8: memory forward to expired preview returns editor, then a new preview uses new edits', async () => {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(game)); const result = await screen('/editor')
  await result.click('试玩'); result.router.back(); await settle()
  await result.wrapper.get('input[name="title"]').setValue('第二次试玩内容')
  result.router.forward(); await settle()
  expect(result.router.currentRoute.value.path).toBe('/editor'); expect(result.sessions).toHaveLength(1)
  await result.click('试玩'); expect(result.sessions).toHaveLength(2)
  expect(result.sessions[1].controller.getView().title).toBe('第二次试玩内容')
  recorded('S8', 'expired ephemeral snapshot redirects editor; subsequent preview uses fresh content')
})
