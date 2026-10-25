import { Blob } from 'node:buffer'
import { TextDecoder, TextEncoder } from 'node:util'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { GameDefinition } from '@lie/game-core'

import Application from '../src/Application.vue'
import App from '../src/App.vue'
import { DRAFT_KEY } from '../src/editor/draft'
import { encodeGameLink, SHARE_URL_LIMIT } from '../src/editor/share'
import * as sharing from '../src/editor/share'
import { game as officialGame, setup } from './helpers'

const customGame = { ...officialGame, id: 'custom-private-id', title: '玩家创作的谜题', characters: officialGame.characters.map((character) => ({ ...character, appearanceId: 'blue' })) }
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
  const catalog = [{ id: officialGame.id, title: officialGame.title, summary: '官方简介', interrogationLimitSeconds: 480, characters: officialGame.characters.map(({ name, appearanceId }) => ({ name, appearanceId: appearanceId ?? null })) }]
  const wrapper = mount(Application, { props: {
    characterPresets: [{ id: 'blue', name: '蓝衣眼镜', avatar: '/a.png', portrait: '/p.png', accent: '#123456', voiceId: null, animation: null, portraits: { listening: null, waiting: null, speaking: null } }], demo: true,
    catalog,
    createController: (game: GameDefinition | null) => { const next = setup(undefined, game ?? officialGame); sessions.push({ setup: next, source: game }); return next.controller },
  }, global: { plugins: [router] } })
  cleanup.push(() => wrapper.unmount())
  await settle()
  async function click(text: string) {
    const button = wrapper.findAll('button').find((item) => (item.attributes('aria-label') ?? item.text()) === text && (item.element.closest('dialog') == null || item.element.closest('dialog')!.open))
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
    await click('试玩')
    expect(router.currentRoute.value.path).toBe('/editor/preview')
    expect(sessions[0].source).toEqual(customGame)
    expect(wrapper.text()).toContain(customGame.title)
    expect(wrapper.findAll('button').some((button) => button.text() === '返回编辑器')).toBe(true)
    await click('接案，开始调查'); await click('开启模拟对话')
    const leaving = router.push('/editor'); await settle()
    await click('继续调查'); await leaving
    expect(sessions[0].setup.turns[0].closed).toBe(false)
    const confirmed = router.push('/editor'); await settle()
    await click('确认结束'); await confirmed; await settle()
    expect(sessions[0].setup.turns[0].closed).toBe(true)
    expect((wrapper.get('input[name="title"]').element as HTMLInputElement).value).toBe(customGame.title)
  })

  it.each([true, false])('retains in-memory edits, step and selected character across preview (save fails=%s)', async (fails) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(customGame))
    const { wrapper, router, sessions, click } = await screen('/editor')
    const write = fails ? vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') }) : null
    await wrapper.get('input[name="title"]').setValue('尚未丢失的编辑C')
    await wrapper.findAll('.editor-steps button')[1].trigger('click')
    await click('编辑乙')
    await wrapper.get('[data-field="profile"]').setValue('乙的新设定C')
    await click('试玩')
    expect(sessions[0].source).toMatchObject({ title: '尚未丢失的编辑C', characters: [expect.anything(), expect.objectContaining({ profile: '乙的新设定C' })] })
    write?.mockRestore()
    await click('返回编辑器')
    expect(wrapper.get('main h1').text()).toBe('故事人物')
    expect((wrapper.get('[data-field="name"]').element as HTMLInputElement).value).toBe('乙')
    expect((wrapper.get('[data-field="profile"]').element as HTMLTextAreaElement).value).toBe('乙的新设定C')
    await wrapper.findAll('.editor-steps button')[0].trigger('click')
    expect((wrapper.get('input[name="title"]').element as HTMLInputElement).value).toBe('尚未丢失的编辑C')
    if (fails) {
      expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).title).toBe(customGame.title)
      expect(wrapper.text()).toContain('草稿未能保存')
    }
    await router.push('/'); await settle()
    await router.push('/editor'); await settle()
    expect((wrapper.get('input[name="title"]').element as HTMLInputElement).value).toBe(fails ? customGame.title : '尚未丢失的编辑C')
  })

  it('redirects refreshed preview URLs to the editor without loading an official game', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(customGame))
    const { wrapper, router, sessions } = await screen('/editor/preview?game=do-not-fetch')
    expect(router.currentRoute.value.path).toBe('/editor')
    expect(sessions).toHaveLength(0)
    expect(wrapper.get('nav[aria-label="创作步骤"]').text()).toContain('故事设定')
  })

  it('plays a decoded shared snapshot, ends wrong accusation, and only restarts into a fresh attempt', async () => {
    const path = await sharedPath()
    const { wrapper, router, sessions, click } = await screen(path)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].source).toEqual(customGame)
    await click('接案，开始调查'); await click('我有答案了 →'); await click('指认 乙')
    expect(wrapper.text()).toContain('本局结束')
    await click('重新开始一局')
    expect(sessions[0].setup.controller.getView().phase).toBe('intro')
    await click('接案，开始调查'); await click('我有答案了 →'); await click('指认 甲')
    expect(wrapper.text()).toContain(customGame.ending.reveal)
    await click('返回案件列表')
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.findAll('.case-card')).toHaveLength(1)
    expect(wrapper.findAll('.case-card')[0].text()).toContain(officialGame.title)
  })

  it('confirms active hash replacement, ignores old voice results and loads the new shared story', async () => {
    const { router, sessions, click } = await screen(await sharedPath())
    await click('接案，开始调查'); await click('开启模拟对话')
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
    expect(wrapper.get('nav[aria-label="创作步骤"]').text()).toContain('故事设定')
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
    await preview.click('试玩')
    window.dispatchEvent(new Event('pagehide'))
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    await settle()
    expect(preview.router.currentRoute.value.path).toBe('/editor')
    expect(preview.sessions).toHaveLength(1)
  })
})


describe('remixing a completed case', () => {
  async function finish(screen: Awaited<ReturnType<typeof screenFactory>>, correct = true) {
    await screen.click('接案，开始调查')
    await screen.click('我有答案了 →')
    await screen.click(correct ? '指认 甲' : '指认 乙')
  }
  const screenFactory = screen
  it.each([['official', true], ['official', false], ['shared', true], ['shared', false]] as const)('opens an independent editor draft from actual %s snapshot (correct=%s)', async (kind, correct) => {
    const original = { ...customGame, id: officialGame.id }
    const result = await screen(kind === 'official' ? '/?game=test' : await sharedPath(original))
    const source = kind === 'official' ? officialGame : original
    await finish(result, correct)
    await result.click('我要改编')
    expect(result.router.currentRoute.value.path).toBe('/editor')
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY)!)
    expect(draft.id).not.toBe(source.id)
    expect({ ...draft, id: source.id }).toEqual(source)
    expect((result.wrapper.get('input[name="title"]').element as HTMLInputElement).value).toBe(source.title)
    expect(result.sessions).toHaveLength(1)
  })
  it.each([true, false])('returns to the original editor after preview without remixing (correct=%s)', async (correct) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(customGame))
    const result = await screen('/editor')
    await result.wrapper.get('input[name="title"]').setValue('继续编辑的原稿')
    await result.wrapper.findAll('.editor-steps button')[1].trigger('click')
    await result.click('编辑乙')
    await result.wrapper.get('[data-field="profile"]').setValue('乙在试玩前的设定')
    await result.click('试玩')
    const savedDraft = localStorage.getItem(DRAFT_KEY)
    await finish(result, correct)
    expect(result.wrapper.findAll('.result-actions button').map((button) => button.text())).toEqual(['重新开始一局', '返回编辑器'])
    result.wrapper.getComponent(App).vm.$emit('remix')
    await settle()
    expect(result.router.currentRoute.value.path).toBe('/editor/preview')
    expect(localStorage.getItem(DRAFT_KEY)).toBe(savedDraft)
    expect(result.wrapper.findAll('dialog').some((dialog) => dialog.element.open)).toBe(false)
    await result.click('返回编辑器')
    expect(result.wrapper.get('main h1').text()).toBe('故事人物')
    expect((result.wrapper.get('[data-field="name"]').element as HTMLInputElement).value).toBe('乙')
    expect((result.wrapper.get('[data-field="profile"]').element as HTMLTextAreaElement).value).toBe('乙在试玩前的设定')
    await result.wrapper.findAll('.editor-steps button')[0].trigger('click')
    expect((result.wrapper.get('input[name="title"]').element as HTMLInputElement).value).toBe('继续编辑的原稿')
    expect(localStorage.getItem(DRAFT_KEY)).toBe(savedDraft)
    expect(result.sessions).toHaveLength(1)
  })
  it.each(['{broken', '', JSON.stringify({ title: '未完成' })])('preserves exact existing bytes on cancellation: %s', async (raw) => {
    const result = await screen('/?game=test')
    await finish(result)
    localStorage.setItem(DRAFT_KEY, raw)
    await result.click('我要改编')
    expect(result.router.currentRoute.value.path).toBe('/')
    await result.click('保留草稿')
    expect(localStorage.getItem(DRAFT_KEY)).toBe(raw)
    expect(result.sessions[0].setup.controller.getView().phase).toBe('solved')
    await result.click('我要改编')
    await result.wrapper.findAll('dialog').find((dialog) => dialog.element.open)!.trigger('cancel')
    expect(localStorage.getItem(DRAFT_KEY)).toBe(raw)
    await result.click('我要改编')
    await result.click('关闭弹窗')
    expect(localStorage.getItem(DRAFT_KEY)).toBe(raw)
  })
  it.each(['second', null])('reconfirms changed raw draft %s and invalidates pending replacement on navigation', async (next) => {
    const result = await screen('/?game=test')
    await finish(result)
    localStorage.setItem(DRAFT_KEY, 'first')
    await result.click('我要改编')
    if (next == null) localStorage.removeItem(DRAFT_KEY)
    else localStorage.setItem(DRAFT_KEY, next)
    await result.click('替换草稿并改编')
    expect(localStorage.getItem(DRAFT_KEY)).toBe(next)
    expect(result.wrapper.text()).toContain('草稿刚刚发生了变化')
    await result.router.push('/'); await settle()
    expect(result.wrapper.findAll('dialog').some((dialog) => dialog.element.open)).toBe(false)
    expect(localStorage.getItem(DRAFT_KEY)).toBe(next)
  })
  it('fails closed on a read failure and retries only after confirming the existing draft', async () => {
    const result = await screen('/?game=test')
    await finish(result)
    localStorage.setItem(DRAFT_KEY, 'old')
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    await result.click('我要改编')
    expect(result.wrapper.text()).toContain('无法读取')
    expect(result.router.currentRoute.value.path).toBe('/')
    read.mockRestore()
    await result.click('重试')
    expect(localStorage.getItem(DRAFT_KEY)).toBe('old')
    await result.click('替换草稿并改编')
    expect(result.router.currentRoute.value.path).toBe('/editor')
  })
  it.each([null, 'old'])('keeps the old draft and result when writing fails, then allows retry (%s)', async (raw) => {
    const result = await screen('/?game=test')
    await finish(result, false)
    if (raw != null) localStorage.setItem(DRAFT_KEY, raw)
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    await result.click('我要改编')
    if (raw != null) await result.click('替换草稿并改编')
    expect(result.wrapper.text()).toContain('无法保存')
    expect(localStorage.getItem(DRAFT_KEY)).toBe(raw)
    expect(result.router.currentRoute.value.path).toBe('/')
    write.mockRestore()
    await result.click('重试')
    expect(result.router.currentRoute.value.path).toBe('/editor')
  })
})
