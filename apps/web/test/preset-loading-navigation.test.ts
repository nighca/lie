import { Blob } from 'node:buffer'
import { TextDecoder, TextEncoder } from 'node:util'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Application from '../src/Application.vue'
import Editor from '../src/editor/Editor.vue'
import { DRAFT_KEY } from '../src/editor/draft'
import { encodeGameLink } from '../src/editor/share'
import { createCharacterPresetLoader } from '../src/presentation/characterPresetLoader'
import { game as sourceGame, setup } from './helpers'

const preset = { id: 'blue', name: '蓝衣眼镜', avatar: '/a.png', portrait: '/p.png', accent: '#123456', voiceId: 'same-voice' }
const game = { ...sourceGame, characters: sourceGame.characters.map((person) => ({ ...person, appearanceId: 'blue' })) }
const cleanup: (() => void)[] = []
beforeEach(() => { vi.stubGlobal('Blob', Blob); vi.stubGlobal('TextDecoder', TextDecoder); vi.stubGlobal('TextEncoder', TextEncoder); Object.defineProperties(HTMLDialogElement.prototype, { showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } }, close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } } }) })
afterEach(() => { cleanup.splice(0).forEach((action) => action()); localStorage.clear(); vi.useRealTimers(); vi.unstubAllGlobals() })
async function page(fetcher: typeof fetch, path = '/') {
  const loader = createCharacterPresetLoader(fetcher)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: Application }] })
  await router.push(path); await router.isReady()
  const sessions: ReturnType<typeof setup>[] = []
  const root = defineComponent(() => () => h(Application, {
    createController: (content) => {
      const session = setup(undefined, content ?? game, (id) => loader.state.presets.find((entry) => entry.id === id)?.voiceId ?? null)
      sessions.push(session)
      return session.controller
    },
    loadCatalog: async () => [], characterPresets: loader.state.presets, presetStatus: loader.state.status, loadCharacterPresets: loader.load, demo: true,
  }))
  const wrapper = mount(root, { global: { plugins: [router] }, attachTo: document.body })
  cleanup.push(() => { wrapper.unmount(); loader.cancel() })
  void loader.load()
  await flushPromises()
  return { wrapper, router, loader, sessions }
}

describe('preset loading recovery without navigation or draft loss', () => {
  it('keeps the homepage usable while the optional request remains pending', async () => {
    const { wrapper } = await page(() => new Promise(() => {}))
    expect(wrapper.text()).toContain('有人在说谎')
    expect(wrapper.findAll('button').some((button) => button.text() === '创作案件')).toBe(true)
  })
  it('retries on reopening the editor, preserves the saved selection, and can preview after recovery', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(game))
    const before = localStorage.getItem(DRAFT_KEY)
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(new Response(JSON.stringify([preset])))
    const { wrapper, router, loader } = await page(fetcher)
    expect(loader.state.status).toBe('failed')
    await router.push('/editor'); await flushPromises()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(loader.state.status).toBe('ready')
    expect(localStorage.getItem(DRAFT_KEY)).toBe(before)
    await wrapper.getComponent(Editor).findAll('.editor-steps button')[1].trigger('click')
    expect(wrapper.get('[data-field=name]').element).toHaveProperty('value', '甲')
    await wrapper.findAll('button').find((button) => button.text() === '更换预设')!.trigger('click')
    expect(wrapper.get('.editor-preset').attributes('aria-pressed')).toBe('true')
    await wrapper.get('[aria-label=关闭]').trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === '试玩')!.trigger('click'); await flushPromises()
    expect(router.currentRoute.value.path).toBe('/editor/preview')
    expect(wrapper.text()).toContain(game.title)
    expect(localStorage.getItem(DRAFT_KEY)).toBe(before)
  })
  it('explicitly retries in the open selector without changing an existing draft', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(game))
    const before = localStorage.getItem(DRAFT_KEY)
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(new Response(JSON.stringify([preset])))
    const { wrapper, loader } = await page(fetcher, '/editor')
    await wrapper.getComponent(Editor).findAll('.editor-steps button')[1].trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === '选择预设')!.trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === '重新加载预设')!.trigger('click'); await flushPromises()
    expect(loader.state.status).toBe('ready')
    expect(wrapper.get('.editor-preset').attributes('aria-pressed')).toBe('true')
    expect(localStorage.getItem(DRAFT_KEY)).toBe(before)
  })
  it('keeps an existing game session and resolves its voice from the recovered catalog', async () => {
    let finish: (value: Response) => void = () => {}
    const { wrapper, loader, sessions } = await page(() => new Promise((resolve) => { finish = resolve }), '/?game=test')
    const controller = sessions[0].controller
    controller.start()
    finish(new Response(JSON.stringify([preset]))); await flushPromises()
    expect(loader.state.status).toBe('ready')
    expect(sessions).toHaveLength(1)
    expect(controller.getView().phase).toBe('interrogating')
    await controller.startConversation()
    expect(sessions[0].turns[0].scope.voiceId).toBe('same-voice')
    expect(wrapper.text()).toContain(game.title)
  })
  it('waits for a shared-link catalog then decodes against the loaded references', async () => {
    const link = new URL(await encodeGameLink(game, window.location.origin))
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([preset])))
    const { wrapper, loader } = await page(fetcher, link.pathname + link.hash)
    expect(loader.state.status).toBe('ready')
    await vi.waitFor(() => expect(wrapper.text()).toContain(game.title))
    expect(wrapper.text()).not.toContain('分享案件无法打开')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('does not return to an abandoned shared link after its request finishes', async () => {
    const link = new URL(await encodeGameLink(game, window.location.origin))
    let finish: (value: Response) => void = () => {}
    const { wrapper, router } = await page(() => new Promise((resolve) => { finish = resolve }), link.pathname + link.hash)
    await router.push('/editor'); await flushPromises()
    finish(new Response(JSON.stringify([preset]))); await flushPromises()
    expect(router.currentRoute.value.path).toBe('/editor')
    expect(wrapper.findComponent(Editor).exists()).toBe(true)
  })
})
