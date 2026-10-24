import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import Application from '../src/Application.vue'
import { readCatalog } from '../src/application/catalog'
import { observeNavigationLifecycle } from '../src/application/navigationLifecycle'
import { game, setup } from './helpers'

const cleanup: (() => void)[] = []
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
})
afterEach(() => cleanup.splice(0).forEach((action) => action()))
const catalog = [{ id: game.id, title: game.title, summary: '公开简介', interrogationLimitSeconds: 480 }]
async function screen(path = '/', loadCatalog = async () => catalog) {
  const sessions: ReturnType<typeof setup>[] = []
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Application }] })
  await router.push(path)
  const wrapper = mount(Application, { props: {
    appearances: [], demo: true, loadCatalog,
    createController: () => { const next = setup(); sessions.push(next); return next.controller },
  }, global: { plugins: [router] } })
  cleanup.push(() => wrapper.unmount())
  await flushPromises()
  async function click(text: string) {
    const button = wrapper.findAll('button').find((item) => item.text() === text)
    expect(button, text).toBeDefined()
    await button!.trigger('click'); await flushPromises()
  }
  return { wrapper, router, sessions, click }
}

describe('case catalog', () => {
  it('projects public metadata and rejects duplicate IDs and invalid durations', () => {
    expect(readCatalog([{ ...catalog[0], profile: 'private', ending: 'private' }])).toEqual(catalog)
    expect(() => readCatalog([catalog[0], catalog[0]])).toThrow()
    expect(() => readCatalog([{ ...catalog[0], interrogationLimitSeconds: 0 }])).toThrow()
    expect(() => readCatalog([{ ...catalog[0], title: ' ' }])).toThrow()
  })
})

describe('home and case navigation', () => {
  it('loads public cards without constructing a game or starting voice, and opens an intro by selection', async () => {
    const { wrapper, router, sessions, click } = await screen()
    expect(sessions).toHaveLength(0)
    expect(wrapper.text()).toContain('公开简介')
    expect(wrapper.text()).not.toContain(game.ending.reveal)
    await click('查看案件')
    expect(router.currentRoute.value.query.game).toBe('test')
    expect(sessions).toHaveLength(1)
    expect(sessions[0].controller.getView().phase).toBe('intro')
    expect(sessions[0].turns).toHaveLength(0)
  })

  it('keeps the shared brand link behind the active investigation leave guard', async () => {
    const { wrapper, router, sessions, click } = await screen('/?game=test')
    await click('接案，开始调查')
    const session = sessions[0]
    await wrapper.get('a[aria-label="LIE 首页"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.game).toBe('test')
    expect(wrapper.text()).toContain('结束这次调查？')
    await click('继续调查')
    expect(session.controller.getView().phase).toBe('interrogating')
    await wrapper.get('a[aria-label="LIE 首页"]').trigger('click')
    await flushPromises()
    await click('确认结束')
    expect(router.currentRoute.value.path).toBe('/')
    expect(router.currentRoute.value.query).toEqual({ demo: '1' })
    expect(wrapper.get('.home-intro h1').text()).toBe('有人在说谎')
  })

  it('retries a failed catalog independently of direct case loading', async () => {
    let fail = true
    const { wrapper, router, click } = await screen('/', async () => {
      if (fail) throw new Error('offline')
      return [...catalog, { ...catalog[0], id: 'another-case', title: '另一桩案件' }]
    })
    expect(wrapper.text()).toContain('案件列表暂时无法加载')
    await router.push('/?game=test'); await flushPromises()
    expect(wrapper.text()).toContain('接案，开始调查')
    await click('返回案件列表')
    fail = false
    await click('重试')
    expect(wrapper.findAll('article')).toHaveLength(2)
    expect(wrapper.text()).toContain('另一桩案件')
  })

  it('cancels leaving with URL, session, history and voice intact, then discards on confirmation', async () => {
    const { router, sessions, click } = await screen('/?game=test')
    await click('接案，开始调查')
    await click('开始模拟对话')
    const old = sessions[0]
    old.turns[0].scope.onEvent({ type: 'userText', text: '问题' })
    const before = old.controller.getView()
    const leaving = router.push('/')
    await flushPromises()
    await click('继续调查'); await leaving
    expect(router.currentRoute.value.fullPath).toBe('/?game=test')
    expect(old.controller.getView().history).toEqual(before.history)
    expect(old.turns[0].closed).toBe(false)
    const confirmed = router.push('/')
    await flushPromises(); await click('确认结束'); await confirmed; await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(old.turns[0].closed).toBe(true)
    await click('查看案件')
    expect(sessions).toHaveLength(2)
    expect(sessions[1].controller.getView().history).toEqual([])
    expect(sessions[1].controller.getView().interrogationRemainingMs).toBe(480000)
    old.turns[0].scope.onEvent({ type: 'assistantText', text: '过期回复' })
    expect(sessions[1].controller.getView().history).toEqual([])
  })

  it('closes a preparing voice connection when departure is confirmed', async () => {
    const { sessions, router, click } = await screen('/?game=test')
    let closed = false
    let finish: (() => void) | null = null
    sessions[0].voice.create = () => ({ open: () => new Promise<void>((resolve) => { finish = resolve }), close() { closed = true } })
    await click('接案，开始调查'); await click('开始模拟对话')
    expect(sessions[0].controller.getView().busy).toBe(true)
    const leave = router.push('/')
    await flushPromises(); await click('确认结束'); await leave
    expect(closed).toBe(true)
    const complete = finish as (() => void) | null
    complete?.()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('confirms active end, and permits terminal return without another confirmation', async () => {
    const { wrapper, router, sessions, click } = await screen('/?game=test')
    await click('接案，开始调查')
    await click('结束本局'); await click('继续调查')
    expect(sessions[0].controller.getView().phase).toBe('interrogating')
    await click('结束本局'); await click('确认结束')
    expect(wrapper.text()).toContain('本局已结束')
    await click('返回案件列表')
    expect(router.currentRoute.value.fullPath).toBe('/?demo=1')
    expect(wrapper.findAll('dialog').some((item) => item.element.open)).toBe(false)
  })

  it('cancels back navigation and permits a fresh intro after confirmed back and forward', async () => {
    const { router, sessions, click } = await screen()
    await click('查看案件'); await click('接案，开始调查')
    router.back(); await flushPromises()
    await click('继续调查')
    expect(router.currentRoute.value.fullPath).toBe('/?game=test&demo=1')
    expect(sessions[0].controller.getView().phase).toBe('interrogating')
    router.back(); await flushPromises(); await click('确认结束')
    expect(router.currentRoute.value.fullPath).toBe('/')
    router.forward(); await flushPromises()
    expect(sessions).toHaveLength(2)
    expect(sessions[1].controller.getView().phase).toBe('intro')
  })

  it('leaves failed and solved sessions without confirmation, and restarts with empty history', async () => {
    const { wrapper, router, sessions, click } = await screen('/?game=test')
    await click('接案，开始调查'); await click('最终指认'); await click('指认 乙')
    expect(wrapper.text()).not.toContain(game.ending.reveal)
    await click('重新开始一局')
    expect(sessions[0].controller.getView().history).toEqual([])
    await click('接案，开始调查'); await click('最终指认'); await click('指认 甲')
    expect(wrapper.text()).toContain(game.ending.reveal)
    await click('返回案件列表')
    expect(router.currentRoute.value.query.game).toBeUndefined()
    expect(wrapper.findAll('dialog').some((item) => item.element.open)).toBe(false)
  })

  it('discards hidden-page state only on actual pagehide and returns from bfcache to a fresh intro', async () => {
    const { wrapper, sessions, click } = await screen('/?game=test')
    await click('接案，开始调查'); await click('开始模拟对话')
    const old = sessions[0]
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange')); await flushPromises()
    expect(old.turns[0].closed).toBe(true)
    expect(old.controller.getView().phase).toBe('interrogating')
    expect(sessions).toHaveLength(1)
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    window.dispatchEvent(new Event('pagehide')); await flushPromises()
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); await flushPromises()
    expect(sessions).toHaveLength(2)
    expect(wrapper.text()).toContain('接案，开始调查')
    expect(sessions[1].controller.getView().history).toEqual([])
  })

  it('keeps an unknown direct case as a load error with retry and list access', async () => {
    const { wrapper, router, click, sessions } = await screen('/?game=unknown')
    expect(wrapper.text()).toContain('案件暂时无法加载')
    await click('重试')
    expect(sessions).toHaveLength(2)
    expect(router.currentRoute.value.query.game).toBe('unknown')
    await click('返回案件列表')
    expect(wrapper.text()).toContain('选择案件')
  })
})

describe('navigation lifecycle', () => {
  it('only guards investigation, does not dispose on canceled beforeunload, pauses on hidden, discards on pagehide and resets bfcache', async () => {
    const { controller, turns } = setup()
    await controller.load('test')
    let discarded = 0
    let restored = 0
    const lifecycle = observeNavigationLifecycle(() => controller, () => { discarded++; controller.dispose() }, () => { restored++ }, document, window)
    cleanup.push(() => { lifecycle.dispose(); controller.dispose() })
    controller.subscribe(lifecycle.sync)
    let event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    controller.start(); await controller.startConversation()
    event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(discarded).toBe(0)
    expect(turns[0].closed).toBe(false)
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(turns[0].closed).toBe(true)
    expect(controller.getView().phase).toBe('interrogating')
    expect(discarded).toBe(0)
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    window.dispatchEvent(new Event('pagehide'))
    expect(discarded).toBe(1)
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    expect(restored).toBe(1)
  })
})
