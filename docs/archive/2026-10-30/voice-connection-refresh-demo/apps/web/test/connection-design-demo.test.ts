import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'

import App from '../src/App.vue'
import { createGameController } from '../src/application/controller'
import ConnectionWaiting from '../src/connection-demo/ConnectionWaiting.vue'
import { createConnectionDemoVoice } from '../src/connection-demo/voice'
import { game } from './helpers'

afterEach(() => { vi.clearAllTimers(); vi.useRealTimers() })

it('moves through the dramatic sequence once and holds the last line', async () => {
  vi.useFakeTimers()
  const wrapper = mount(ConnectionWaiting, { props: { name: '顾遥' } })
  try {
    expect(wrapper.text()).toContain('正在请顾遥过来')
    await vi.advanceTimersByTimeAsync(699)
    expect(wrapper.attributes('data-step')).toBe('0')
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.text()).toContain('搬个椅子')
    await vi.advanceTimersByTimeAsync(700)
    expect(wrapper.text()).toContain('TA 正在入座')
    await vi.advanceTimersByTimeAsync(700)
    expect(wrapper.text()).toContain('等 TA 坐稳')
    await vi.advanceTimersByTimeAsync(20000)
    expect(wrapper.attributes('data-step')).toBe('3')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  } finally { wrapper.unmount() }
})

async function scene() {
  vi.useFakeTimers()
  const voice = createConnectionDemoVoice(() => 16000)
  const controller = createGameController({ readGame: async () => game, voice: voice.voice, now: Date.now, newSessionId: () => 'connection-design' })
  const wrapper = mount(App, {
    props: { controller, characterPresets: [], demo: true },
    slots: { 'connection-notice': ({ character, cancel }) => character == null ? null : h(ConnectionWaiting, { key: character.id, name: character.name, onCancel: cancel }) },
  })
  await controller.load('test'); controller.start(); void controller.startConversation(); await flushPromises()
  return { voice, controller, wrapper, cleanup() { wrapper.unmount(); controller.dispose() } }
}

it('exits immediately on early ready without finishing the sequence', async () => {
  const { voice, controller, wrapper, cleanup } = await scene()
  try {
    await vi.advanceTimersByTimeAsync(500)
    expect(controller.getView().interrogationRemainingMs).toBe(480000)
    expect(wrapper.get('.lie-voice__status').text()).toBe('正在连接')
    voice.ready(); await flushPromises()
    expect(wrapper.find('[aria-label="开聊准备提示"]').exists()).toBe(false)
    expect(controller.getView().busy).toBe(false)
    expect(controller.getView().conversationActive).toBe(true)
  } finally { cleanup() }
})

it('restarts for the latest target and cancellation prevents late return', async () => {
  const { voice, controller, wrapper, cleanup } = await scene()
  try {
    await vi.advanceTimersByTimeAsync(4000)
    controller.selectCharacter('two'); await flushPromises()
    expect(wrapper.get('[aria-label="开聊准备提示"]').text()).toContain('正在请乙过来')
    controller.selectCharacter('one'); controller.selectCharacter('two'); await flushPromises()
    expect(wrapper.get('[aria-label="开聊准备提示"]').attributes('data-step')).toBe('0')
    await wrapper.get('[aria-label="取消连接"]').trigger('click')
    voice.ready(); await vi.advanceTimersByTimeAsync(20000); await flushPromises()
    expect(controller.getView().conversationActive).toBe(false)
    expect(wrapper.find('[aria-label="开聊准备提示"]').exists()).toBe(false)
  } finally { cleanup() }
})

it('leaves the sequence for the existing failure feedback', async () => {
  const { voice, controller, wrapper, cleanup } = await scene()
  try {
    voice.fail(); await flushPromises()
    expect(wrapper.find('[aria-label="开聊准备提示"]').exists()).toBe(false)
    expect(controller.getView().voiceStatus).toBe('error')
    expect(wrapper.get('.conversation-copy').text()).toContain('语音暂时中断')
  } finally { cleanup() }
})
