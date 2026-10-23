import { mount } from '@vue/test-utils'
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
})
