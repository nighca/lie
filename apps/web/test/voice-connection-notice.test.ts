import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'

import App from '../src/App.vue'
import { createGameController } from '../src/application/controller'
import type { ConversationScope } from '../src/application/voice'
import VoiceConnectionNotice from '../src/presentation/VoiceConnectionNotice.vue'
import { game } from './helpers'

afterEach(() => { vi.clearAllTimers(); vi.useRealTimers() })

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
    expect(wrapper.get('.voice-connection-notice strong').text()).toBe('正在请甲过来…')
    expect(wrapper.get('.voice-connection-notice footer span').text()).toBe('等 TA 坐定，再开口哦')
    expect(wrapper.get('.voice-connection-notice button').text()).toBe('取消')
    expect(wrapper.get('.voice-connection-notice button').attributes('aria-label')).toBe('取消连接')
    expect(wrapper.get('.lie-voice').attributes('data-conversation')).toBe('inactive')
    attempts[0].scope.onEvent({ type: 'listening' }); await flushPromises()
    expect(wrapper.get('[aria-label="语音连接提示"]').text()).toContain('正在请甲过来…')
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
    expect(wrapper.get('[aria-label="语音连接提示"]').text()).toContain('正在请乙过来…')
    expect(controller.getView().currentCharacterId).toBe('two')
    expect(attempts).toHaveLength(2)
    expect(attempts[0].closed).toBe(true)
    await wrapper.get('[aria-label="查看案件背景"]').trigger('click')
    expect(wrapper.find('[aria-label="语音连接提示"]').exists()).toBe(false)
    attempts.forEach(attempt => attempt.ready()); await flushPromises()
    expect(controller.getView().conversationActive).toBe(false)
  } finally { cleanup() }
})

it('advances the approved lines and holds the last until unmounted', async () => {
  vi.useFakeTimers()
  const wrapper = mount(VoiceConnectionNotice, { props: { name: '顾遥', accent: '#ff665b' } })
  try {
    expect(wrapper.get('strong').text()).toBe('正在请顾遥过来…')
    expect(wrapper.get('mark').text()).toBe('顾遥')
    expect(wrapper.get('mark').attributes('style')).toContain('--character-name-accent: #ff665b')
    await vi.advanceTimersByTimeAsync(999)
    expect(wrapper.attributes('data-step')).toBe('0')
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.get('strong').text()).toBe('搬个椅子…')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.get('strong').text()).toBe('TA 正在入座…')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.get('strong').text()).toBe('等 TA 坐稳…')
    await vi.advanceTimersByTimeAsync(20000)
    expect(wrapper.get('strong').text()).toBe('等 TA 坐稳…')
  } finally { wrapper.unmount() }
})

it('restarts the same character on a new attempt even within one render batch', async () => {
  vi.useFakeTimers()
  const { controller, wrapper, cleanup } = scene()
  try {
    await controller.load('test'); controller.start(); void controller.startConversation(); await flushPromises()
    await vi.advanceTimersByTimeAsync(2500)
    expect(wrapper.get('.voice-connection-notice strong').text()).toBe('TA 正在入座…')
    controller.endConversation(); void controller.startConversation(); await flushPromises()
    expect(wrapper.get('.voice-connection-notice strong').text()).toBe('正在请甲过来…')
    await vi.advanceTimersByTimeAsync(999)
    expect(wrapper.get('.voice-connection-notice').attributes('data-step')).toBe('0')
  } finally { cleanup() }
})

it('uses the selected preset accent for the current target name', async () => {
  const { controller, wrapper, cleanup } = scene()
  try {
    await wrapper.setProps({ characterPresets: [{ id: 'blue', name: '蓝衣眼镜', avatar: '/blue.png', portrait: '/blue.png', accent: '#075bfa', animation: null, voiceId: null, portraits: { listening: null, waiting: null, speaking: null } }] })
    await controller.load('test'); controller.start(); void controller.startConversation()
    controller.selectCharacter('two'); await flushPromises()
    expect(wrapper.get('.voice-connection-notice mark').text()).toBe('乙')
    expect(wrapper.get('.voice-connection-notice mark').attributes('style')).toContain('--character-name-accent: #075bfa')
  } finally { cleanup() }
})
