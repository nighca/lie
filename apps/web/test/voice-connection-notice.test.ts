import { mount, flushPromises } from '@vue/test-utils'
import { expect, it } from 'vitest'

import App from '../src/App.vue'
import { createGameController } from '../src/application/controller'
import type { ConversationScope } from '../src/application/voice'
import { game } from './helpers'

function scene() {
  const attempts: { scope: ConversationScope; ready(): void; fail(): void; closed: boolean }[] = []
  const controller = createGameController({
    readGame: async () => game, now: () => 0, newSessionId: () => 'notice-test',
    voice: { create(scope) {
      let ready = () => {}; let fail = () => {}
      const prepared = new Promise<void>((resolve, reject) => { ready = resolve; fail = () => reject(new Error('Preparation failed')) })
      const attempt = { scope, ready: () => ready(), fail: () => fail(), closed: false }
      attempts.push(attempt)
      return { open: () => prepared, close() { attempt.closed = true } }
    } },
  })
  const wrapper = mount(App, { props: { controller, characterPresets: [], demo: true } })
  return { controller, wrapper, attempts, cleanup() { wrapper.unmount(); controller.dispose() } }
}

it('keeps the global wait-to-speak notice until capture preparation actually resolves', async () => {
  const { controller, wrapper, attempts, cleanup } = scene()
  try {
    await controller.load('test'); controller.start(); await flushPromises()
    await wrapper.get('.lie-voice__actions button').trigger('click')
    expect(wrapper.get('[aria-label="语音连接提示"]').attributes('role')).toBe('status')
    expect(wrapper.get('.voice-connection-notice strong').text()).toBe('正在连接…')
    expect(wrapper.get('.voice-connection-notice p').text()).toBe('连好后再说话')
    expect(wrapper.get('.voice-connection-notice__spinner').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('.voice-connection-notice button').text()).toBe('取消')
    expect(wrapper.get('.voice-connection-notice button').attributes('aria-label')).toBe('取消连接')
    expect(wrapper.get('.lie-voice').attributes('data-conversation')).toBe('inactive')
    attempts[0].scope.onEvent({ type: 'listening' }); await flushPromises()
    expect(wrapper.get('[aria-label="语音连接提示"]').text()).toContain('正在连接…')
    attempts[0].ready(); await flushPromises()
    expect(wrapper.find('[aria-label="语音连接提示"]').exists()).toBe(false)
    expect(wrapper.get('.lie-voice').attributes('data-conversation')).toBe('active')
    expect(wrapper.get('.lie-voice__actions button').text()).toBe('结束对话')
    expect(wrapper.find('[aria-label="玩家声音音量"]').exists()).toBe(true)
  } finally { cleanup() }
})

it('cancels from the global notice without a late ready restoring it', async () => {
  const { controller, wrapper, attempts, cleanup } = scene()
  try {
    await controller.load('test'); controller.start(); await flushPromises()
    await wrapper.get('.lie-voice__actions button').trigger('click')
    await wrapper.get('.voice-connection-notice button').trigger('click')
    expect(attempts[0].closed).toBe(true)
    attempts[0].ready(); await flushPromises()
    expect(wrapper.find('[aria-label="语音连接提示"]').exists()).toBe(false)
    expect(wrapper.get('.lie-voice__actions button').text()).toBe('开启模拟对话')
  } finally { cleanup() }
})

it('replaces the connection notice with the existing failure feedback without retrying', async () => {
  const { controller, wrapper, attempts, cleanup } = scene()
  try {
    await controller.load('test'); controller.start(); await flushPromises()
    await wrapper.get('.lie-voice__actions button').trigger('click')
    attempts[0].fail(); await flushPromises()
    expect(wrapper.find('[aria-label="语音连接提示"]').exists()).toBe(false)
    expect(wrapper.get('.conversation-copy').text()).toContain('语音暂时中断')
    expect(attempts).toHaveLength(1)
    expect(wrapper.get('.lie-voice__actions button').text()).toBe('开启模拟对话')
  } finally { cleanup() }
})

it('keeps the connection card while switching and stops it when background opens', async () => {
  const { controller, wrapper, attempts, cleanup } = scene()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.open = true } })
  try {
    await controller.load('test'); controller.start(); await flushPromises()
    await wrapper.get('.lie-voice__actions button').trigger('click')
    await wrapper.findAll('.character-list button')[1].trigger('click')
    expect(wrapper.get('[aria-label="语音连接提示"]').text()).toContain('连好后再说话')
    expect(controller.getView().currentCharacterId).toBe('two')
    expect(attempts).toHaveLength(2)
    expect(attempts[0].closed).toBe(true)
    await wrapper.get('[aria-label="查看案件背景"]').trigger('click')
    expect(wrapper.find('[aria-label="语音连接提示"]').exists()).toBe(false)
    attempts.forEach(attempt => attempt.ready()); await flushPromises()
    expect(controller.getView().conversationActive).toBe(false)
  } finally { cleanup() }
})
