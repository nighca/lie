import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import Application from '../src/Application.vue'
import { DRAFT_KEY } from '../src/editor/draft'
import { setup } from './helpers'

const cleanup: (() => void)[] = []
beforeEach(() => {
  localStorage.clear()
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
})
afterEach(() => { cleanup.splice(0).forEach(action => action()); localStorage.clear() })

async function screen(path = '/') {
  const session = setup()
  const createController = vi.fn(() => session.controller)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:all(.*)*', component: Application }] })
  await router.push(path)
  const wrapper = mount(Application, { attachTo: document.body, props: { createController, catalog: [], characterPresets: [], demo: true }, global: { plugins: [router] } })
  cleanup.push(() => wrapper.unmount())
  await flushPromises()
  return { wrapper, router, session, createController }
}

it('keeps the home version hidden until the red dot is activated and returns focus on close', async () => {
  const { wrapper, router, createController } = await screen()
  const dialog = wrapper.get<HTMLDialogElement>('dialog.page-version').element
  const dot = wrapper.get<HTMLButtonElement>('[aria-label="查看页面版本"]')
  expect(dialog.open).toBe(false)
  await dot.trigger('click'); await flushPromises()
  expect(dialog.open).toBe(true)
  expect(router.currentRoute.value.fullPath).toBe('/')
  expect(createController).toHaveBeenCalledTimes(0)
  await wrapper.get('.page-version [aria-label="关闭弹窗"]').trigger('click'); await flushPromises()
  expect(dialog.open).toBe(false)
  expect(document.activeElement).toBe(dot.element)
  await dot.trigger('click'); await flushPromises()
  await wrapper.get('.page-version').trigger('cancel'); await flushPromises()
  expect(dialog.open).toBe(false)
  expect(document.activeElement).toBe(dot.element)
})

it('keeps an active game, transcript and voice scope intact while showing the version', async () => {
  const { wrapper, router, session, createController } = await screen('/?game=test')
  session.controller.start()
  await session.controller.startConversation()
  session.turns[0].scope.onEvent({ type: 'userText', text: '正在调查的问题' })
  await flushPromises()
  const before = session.controller.getView()
  const dot = wrapper.get('[aria-label="查看页面版本"]')
  await dot.trigger('click'); await flushPromises()
  expect(wrapper.get<HTMLDialogElement>('dialog.page-version').element.open).toBe(true)
  expect(router.currentRoute.value.fullPath).toBe('/?game=test')
  expect(session.controller.getView()).toEqual(before)
  expect(session.turns[0].closed).toBe(false)
  expect(createController).toHaveBeenCalledTimes(1)
  await wrapper.get('.page-version [aria-label="关闭弹窗"]').trigger('click'); await flushPromises()
  expect(document.activeElement).toBe(dot.element)
  await wrapper.get('a[aria-label="LIE 首页"]').trigger('click'); await flushPromises()
  expect(wrapper.get<HTMLDialogElement>('dialog.leave-confirmation').element.open).toBe(true)
  expect(session.turns[0].closed).toBe(false)
})

it('retains the editor route and draft and leaves ordinary Logo navigation available', async () => {
  const { wrapper, router } = await screen('/editor')
  const title = wrapper.get<HTMLInputElement>('input[name="title"]')
  await title.setValue('保留这份创作草稿')
  const stored = localStorage.getItem(DRAFT_KEY)
  const dot = wrapper.get('[aria-label="查看页面版本"]')
  await dot.trigger('click'); await flushPromises()
  expect(wrapper.get<HTMLDialogElement>('dialog.page-version').element.open).toBe(true)
  expect(router.currentRoute.value.fullPath).toBe('/editor')
  await wrapper.get('.page-version [aria-label="关闭弹窗"]').trigger('click'); await flushPromises()
  expect(title.element.value).toBe('保留这份创作草稿')
  expect(localStorage.getItem(DRAFT_KEY)).toBe(stored)
  expect(document.activeElement).toBe(dot.element)
  await wrapper.get('a[aria-label="LIE 首页"]').trigger('click'); await flushPromises()
  expect(router.currentRoute.value.path).toBe('/')
})
