import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App.vue'
import { setup } from './helpers'

const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach((action) => action()))

describe('game screens', () => {
  it('continues after a wrong accusation, reveals only after success, and restarts', async () => {
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
      close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
    })
    const { controller } = setup()
    await controller.load('test')
    const wrapper = mount(App, { props: { controller, appearances: [], demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    async function click(text: string) {
      const button = wrapper.findAll('button').find((item) => item.text() === text)
      expect(button, text).toBeDefined()
      await button!.trigger('click')
    }
    await click('接案，开始调查')
    expect(wrapper.get('[role="log"]').isVisible()).toBe(true)
    await click('最终指认')
    await click('指认 乙')
    expect(wrapper.text()).toContain('这次指认不正确')
    await click('返回调查')
    expect(wrapper.get('dialog').element.open).toBe(false)
    expect(wrapper.text()).toContain('与甲对话')
    await click('最终指认')
    await click('指认 甲')
    expect(wrapper.text()).toContain('仅在揭晓后显示的结局')
    await click('重新开始一局')
    expect(wrapper.text()).toContain('接案，开始调查')
    expect(controller.getView().phase).toBe('intro')
  })

  it('uses one start/end action through listening, waiting and speaking, with a shared time display', async () => {
    const { controller, turns } = setup()
    await controller.load('test'); controller.start()
    const wrapper = mount(App, { props: { controller, appearances: [], demo: false } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    const controls = () => wrapper.get('[aria-label="语音对话控制"]')
    expect(wrapper.get('[aria-label="剩余询问时间"]').text()).toContain('08:00')
    expect(controls().findAll('button')).toHaveLength(1)
    await controls().get('button').trigger('click'); await flushPromises()
    expect(controls().get('button').text()).toBe('结束对话')
    for (const event of [{ type: 'userText', text: '问题' } as const, { type: 'speaking' } as const, { type: 'listening' } as const]) {
      turns[0].scope.onEvent(event)
      await wrapper.vm.$nextTick()
      expect(controls().findAll('button')).toHaveLength(1)
      expect(controls().get('button').text()).toBe('结束对话')
    }
    await controls().get('button').trigger('click')
    expect(turns[0].closed).toBe(true)
    expect(controls().get('button').text()).toBe('开始对话')
  })

  it('offers cancellation while microphone and service preparation is pending', async () => {
    const { controller, voice, turns } = setup()
    let ready!: () => void
    const create = voice.create
    voice.create = (scope) => ({ ...create(scope), open: () => new Promise((resolve) => { ready = resolve }) })
    await controller.load('test'); controller.start()
    const wrapper = mount(App, { props: { controller, appearances: [], demo: false } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    const controls = wrapper.get('[aria-label="语音对话控制"]')
    await controls.get('button').trigger('click')
    expect(controls.get('button').text()).toBe('取消连接')
    expect(controls.get('button').attributes('disabled')).toBeUndefined()
    await controls.get('button').trigger('click')
    expect(turns[0].closed).toBe(true)
    ready(); await flushPromises()
    expect(controls.get('button').text()).toBe('开始对话')
  })

})
