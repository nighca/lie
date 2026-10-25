import { Blob } from 'node:buffer'
import { TextDecoder, TextEncoder } from 'node:util'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameDefinition } from '@lie/game-core'

import Application from '../src/Application.vue'
import { createGameController } from '../src/application/controller'
import { BRAND_TITLE } from '../src/application/pageTitle'
import { DRAFT_KEY } from '../src/editor/draft'
import * as sharing from '../src/editor/share'
import { game as source } from './helpers'

Object.assign(globalThis, { Blob, TextEncoder, TextDecoder })
const game = { ...source, characters: source.characters.map((person) => ({ ...person, appearanceId: 'blue' })) }
const preset = { id: 'blue', name: '蓝衣眼镜', avatar: '/a.png', portrait: '/p.png', accent: '#123456', voiceId: null, animation: null, portraits: { listening: null, waiting: null, speaking: null } }
const cleanup: (() => void)[] = []
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
})
afterEach(() => { cleanup.splice(0).forEach((action) => action()); localStorage.clear(); vi.restoreAllMocks() })
async function settle() { for (let i = 0; i < 6; i++) { await flushPromises(); await new Promise((resolve) => setTimeout(resolve, 0)) } }
async function screen(path = '/', readGame = async (id: string): Promise<unknown> => { if (id !== game.id) throw new Error('Unknown game'); return game }) {
  const reads = vi.fn(readGame)
  const voice = vi.fn(() => { throw new Error('Title checks never open voice') })
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:all(.*)*', component: Application }] })
  await router.push(path)
  const wrapper = mount(Application, { props: { characterPresets: [preset], catalog: [], demo: true, createController: (content: GameDefinition | null) => createGameController({ readGame: content == null ? reads : async () => content, voice: { create: voice }, now: () => 0, newSessionId: () => 'title-session' }) }, global: { plugins: [router] } })
  cleanup.push(() => wrapper.unmount())
  await settle()
  async function click(text: string) {
    const button = wrapper.findAll('button').find((item) => (item.attributes('aria-label') ?? item.text()) === text && (item.element.closest('dialog') == null || item.element.closest('dialog')!.open))
    expect(button, text).toBeDefined()
    await button!.trigger('click'); await settle()
  }
  return { wrapper, router, reads, voice, click }
}
function expectTitle(label: string) { expect(document.title).toBe(`${label} · ${BRAND_TITLE}`) }

describe('application page title wiring', () => {
  it('tracks official phases, canceled departure, restart and browser back/forward without extra reads', async () => {
    const { router, reads, voice, click } = await screen('/?game=test')
    expectTitle(`案件介绍 · ${game.title}`)
    await click('接案，开始调查'); expectTitle(`正在调查 · ${game.title}`)
    const leaving = router.push('/editor'); await settle(); await click('继续调查'); await leaving
    expectTitle(`正在调查 · ${game.title}`)
    await click('我有答案了 →'); await click('指认 乙'); expectTitle(`指认不正确 · ${game.title}`)
    await click('重新开始一局'); expectTitle(`案件介绍 · ${game.title}`)
    await click('接案，开始调查'); await click('我有答案了 →'); await click('指认 甲'); expectTitle(`指认正确 · ${game.title}`)
    await click('重新开始一局'); await click('接案，开始调查'); await click('结束本局'); await click('确认结束'); expectTitle(`本局已结束 · ${game.title}`)
    expect(reads).toHaveBeenCalledTimes(1)
    await click('返回案件列表'); expect(document.title).toBe(BRAND_TITLE)
    router.back(); await settle(); expectTitle(`案件介绍 · ${game.title}`)
    router.forward(); await settle(); expect(document.title).toBe(BRAND_TITLE)
    expect(voice).not.toHaveBeenCalled()
  })
  it('covers home, unknown fallback, editor, invalid game and malformed query without reflecting raw input', async () => {
    const { router, voice } = await screen()
    expect(document.title).toBe(BRAND_TITLE)
    await router.push('/unknown-route?title=private'); await settle(); expect(document.title).toBe(BRAND_TITLE)
    await router.push('/editor?game=private'); await settle(); expectTitle('创作案件')
    await router.push('/?game=private-name'); await settle(); expectTitle('案件无法打开')
    await router.push('/?game=test&game=private'); await settle(); expectTitle('案件无法打开')
    expect(document.title).not.toContain('private')
    expect(voice).not.toHaveBeenCalled()
  })
  it('updates loading, failure and retry, then ignores a late read from a departed route', async () => {
    let release!: (value: unknown) => void
    let attempt = 0
    const { click, router } = await screen('/?game=test', () => ++attempt === 1 ? Promise.reject(new Error('unavailable')) : new Promise((resolve) => { release = resolve }))
    expectTitle('案件无法打开')
    await click('重试'); expectTitle('正在加载案件')
    await router.push('/editor'); await settle(); expectTitle('创作案件')
    release(game); await settle(); expectTitle('创作案件')
  })
  it('uses the actual decoded shared public title and never decodes twice for title', async () => {
    const shared = { ...game, title: '分享的公开案件名 🌊' }
    const link = new URL(await sharing.encodeGameLink(shared, window.location.origin))
    const decode = vi.spyOn(sharing, 'decodeSharedGame')
    const { reads, voice, click } = await screen(`${link.pathname}${link.hash}`)
    expectTitle(`分享案件 · 案件介绍 · ${shared.title}`)
    await click('接案，开始调查'); expectTitle(`分享案件 · 正在调查 · ${shared.title}`)
    await click('我有答案了 →'); await click('指认 乙'); expectTitle(`分享案件 · 指认不正确 · ${shared.title}`)
    expect(decode).toHaveBeenCalledTimes(1)
    expect(reads).not.toHaveBeenCalled()
    expect(voice).not.toHaveBeenCalled()
  })
  it('keeps shared decoding pending/failure/route departure titles accurate without fragment contents', async () => {
    let finish!: (value: GameDefinition) => void
    const decode = vi.spyOn(sharing, 'decodeSharedGame').mockImplementationOnce(() => new Promise((resolve) => { finish = resolve })).mockRejectedValue(new Error('private-fragment'))
    const { router, click } = await screen('/play#game=not-a-title')
    expectTitle('正在打开分享案件')
    await router.push('/editor'); await settle(); expectTitle('创作案件')
    finish(game); await settle(); expectTitle('创作案件')
    await router.push('/play#game=private-fragment'); await settle(); expectTitle('分享案件无法打开')
    await click('重试'); expectTitle('分享案件无法打开')
    expect(decode).toHaveBeenCalledTimes(3)
    expect(document.title).not.toContain('private')
  })
  it('refreshes the title after pagehide and persisted pageshow without keeping an old result', async () => {
    const { reads, click } = await screen('/?game=test')
    await click('接案，开始调查'); await click('我有答案了 →'); await click('指认 乙')
    expectTitle(`指认不正确 · ${game.title}`)
    window.dispatchEvent(new Event('pagehide')); await settle()
    expectTitle('正在加载案件')
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); await settle()
    expectTitle(`案件介绍 · ${game.title}`)
    expect(reads).toHaveBeenCalledTimes(2)
  })
  it('covers editor preview phases, return and refreshed preview fallback', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(game))
    const { router, click, reads, voice } = await screen('/editor/preview')
    expect(router.currentRoute.value.path).toBe('/editor'); expectTitle('创作案件')
    await click('试玩'); expectTitle(`试玩 · 案件介绍 · ${game.title}`)
    await click('接案，开始调查'); expectTitle(`试玩 · 正在调查 · ${game.title}`)
    await click('我有答案了 →'); await click('指认 甲'); expectTitle(`试玩 · 指认正确 · ${game.title}`)
    await click('返回编辑器'); expectTitle('创作案件')
    expect(reads).not.toHaveBeenCalled()
    expect(voice).not.toHaveBeenCalled()
  })
})
