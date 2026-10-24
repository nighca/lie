import { Blob } from 'node:buffer'
import { TextDecoder, TextEncoder } from 'node:util'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { GameDefinition } from '@lie/game-core'

import Application from '../src/Application.vue'
import { DRAFT_KEY } from '../src/editor/draft'
import { encodeGameLink, SHARE_URL_LIMIT } from '../src/editor/share'
import * as sharing from '../src/editor/share'
import { game as officialGame, setup } from './helpers'

const customGame = { ...officialGame, id: 'custom-private-id', title: '玩家创作的谜题', characters: officialGame.characters.map((character) => ({ ...character, appearanceId: null })) }
const cleanup: (() => void)[] = []
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
})
afterEach(() => { cleanup.splice(0).forEach((action) => action()); localStorage.clear(); vi.restoreAllMocks() })
async function sharedPath(game: GameDefinition = customGame) {
  const link = await encodeGameLink(game, window.location.origin)
  const url = new URL(link)
  return `${url.pathname}${url.hash}`
}
async function settle() {
  for (let attempt = 0; attempt < 8; attempt++) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}
async function screen(path = '/') {
  const sessions: { setup: ReturnType<typeof setup>; source: GameDefinition | null }[] = []
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: Application }] })
  await router.push(path)
  const wrapper = mount(Application, { props: {
    appearances: [], demo: true,
    loadCatalog: async () => [{ id: officialGame.id, title: officialGame.title, summary: '官方简介', interrogationLimitSeconds: 480 }],
    createController: (game: GameDefinition | null) => { const next = setup(undefined, game ?? officialGame); sessions.push({ setup: next, source: game }); return next.controller },
  }, global: { plugins: [router] } })
  cleanup.push(() => wrapper.unmount())
  await settle()
  async function click(text: string) {
    const button = wrapper.findAll('button').find((item) => item.text() === text)
    expect(button, text).toBeDefined()
    await button!.trigger('click'); await settle()
  }
  return { wrapper, router, sessions, click }
}

// jsdom's Blob/TextEncoder lack the streaming browser APIs; use Node's standards implementation.
Object.assign(globalThis, { Blob, TextEncoder, TextDecoder })

describe('editor and shared case application routes', () => {
  it('opens the editor without a session, previews a snapshot and restores the local draft after leaving', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(customGame))
    const { wrapper, router, sessions, click } = await screen()
    await click('创作案件')
    expect(router.currentRoute.value.path).toBe('/editor')
    expect(sessions).toHaveLength(0)
    await click('试玩当前案件')
    expect(router.currentRoute.value.path).toBe('/editor/preview')
    expect(sessions[0].source).toEqual(customGame)
    expect(wrapper.text()).toContain(customGame.title)
    expect(wrapper.findAll('button').some((button) => button.text() === '返回编辑器')).toBe(true)
    await click('接案，开始调查'); await click('开始模拟对话')
    const leaving = router.push('/editor'); await settle()
    await click('继续调查'); await leaving
    expect(sessions[0].setup.turns[0].closed).toBe(false)
    const confirmed = router.push('/editor'); await settle()
    await click('确认结束'); await confirmed; await settle()
    expect(sessions[0].setup.turns[0].closed).toBe(true)
    expect((wrapper.get('input[name="title"]').element as HTMLInputElement).value).toBe(customGame.title)
  })

  it('redirects refreshed preview URLs to the editor without loading an official game', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(customGame))
    const { wrapper, router, sessions } = await screen('/editor/preview?game=do-not-fetch')
    expect(router.currentRoute.value.path).toBe('/editor')
    expect(sessions).toHaveLength(0)
    expect(wrapper.text()).toContain('创作案件')
  })

  it('plays a decoded shared snapshot, ends wrong accusation, and only restarts into a fresh attempt', async () => {
    const path = await sharedPath()
    const { wrapper, router, sessions, click } = await screen(path)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].source).toEqual(customGame)
    await click('接案，开始调查'); await click('最终指认'); await click('指认 乙')
    expect(wrapper.text()).toContain('本局失败')
    await click('重新开始一局')
    expect(sessions[0].setup.controller.getView().phase).toBe('intro')
    await click('接案，开始调查'); await click('最终指认'); await click('指认 甲')
    expect(wrapper.text()).toContain(customGame.ending.reveal)
    await click('返回案件列表')
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.findAll('.case-card')).toHaveLength(1)
    expect(wrapper.findAll('.case-card')[0].text()).toContain(officialGame.title)
  })

  it('confirms active hash replacement, ignores old voice results and loads the new shared story', async () => {
    const { router, sessions, click } = await screen(await sharedPath())
    await click('接案，开始调查'); await click('开始模拟对话')
    const old = sessions[0].setup
    const nextPath = await sharedPath({ ...customGame, id: 'other', title: '另一份分享案' })
    const leaving = router.push(nextPath); await settle(); await click('确认结束'); await leaving; await settle()
    expect(old.turns[0].closed).toBe(true)
    expect(sessions[1].setup.controller.getView().title).toBe('另一份分享案')
    old.turns[0].scope.onEvent({ type: 'assistantText', text: '上一局迟到的回复' })
    expect(sessions[1].setup.controller.getView().history).toEqual([])
  })

  it('keeps corrupt and complete-URL oversize links out of controllers and official fetches', async () => {
    const { wrapper, router, sessions } = await screen('/play#game=broken')
    expect(wrapper.text()).toContain('分享案件无法打开')
    expect(sessions).toHaveLength(0)
    await router.push(`/play?padding=${'a'.repeat(SHARE_URL_LIMIT)}#game=broken`); await settle()
    expect(wrapper.text()).toContain('分享链接过长')
    expect(sessions).toHaveLength(0)
  })

  it('discards an outstanding decode when the route changes before it finishes', async () => {
    let release = () => {}
    vi.spyOn(sharing, 'decodeSharedGame').mockImplementation(async () => {
      await new Promise<void>((resolve) => { release = resolve })
      return customGame
    })
    const { wrapper, router, sessions } = await screen()
    await router.push('/play#game=pending'); await flushPromises()
    expect(wrapper.text()).toContain('正在打开分享案件')
    await router.push('/editor')
    release(); await settle()
    expect(sessions).toHaveLength(0)
    expect(wrapper.text()).toContain('创作案件')
  })

  it('cannot construct a controller from a decoder that completes after unmount', async () => {
    let release = () => {}
    vi.spyOn(sharing, 'decodeSharedGame').mockImplementation(async () => {
      await new Promise<void>((resolve) => { release = resolve })
      return customGame
    })
    const { wrapper, router, sessions } = await screen()
    await router.push('/play#game=pending'); await flushPromises()
    wrapper.unmount()
    release(); await settle()
    expect(sessions).toHaveLength(0)
  })

  it('restores shared links from a fresh page while keeping preview pagehide ephemeral', async () => {
    const path = await sharedPath()
    const shared = await screen(path)
    expect(shared.sessions[0].setup.controller.getView().phase).toBe('intro')
    const refreshed = await screen(path)
    expect(refreshed.sessions[0].source).toEqual(customGame)
    localStorage.setItem(DRAFT_KEY, JSON.stringify(customGame))
    const preview = await screen('/editor')
    await preview.click('试玩当前案件')
    window.dispatchEvent(new Event('pagehide'))
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    await settle()
    expect(preview.router.currentRoute.value.path).toBe('/editor')
    expect(preview.sessions).toHaveLength(1)
  })
})
