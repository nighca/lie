import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ShareDemo from './ShareDemo.vue'

const writeText = vi.fn<(text: string) => Promise<void>>()
let wrapper: VueWrapper
function button(text: string) {
  const result = wrapper.findAll('button').find((item) => item.text() === text)
  if (result == null) throw new Error(`Button missing: ${text}`)
  return result
}
async function openShare() {
  await button('分享案件').trigger('click')
  await vi.advanceTimersByTimeAsync(1300)
}
beforeEach(() => {
  vi.useFakeTimers()
  writeText.mockReset()
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  wrapper = mount(ShareDemo, {
    global: { stubs: {
      ProductHeader: { template: '<header><slot name="actions" /></header>' },
      EditorDialog: { template: '<section role="dialog"><button @click="$emit(\'close\')">关闭</button><slot /></section>' },
    } },
  })
})
afterEach(() => { wrapper.unmount(); vi.useRealTimers() })

describe('share dialog clipboard feedback', () => {
  it('reports a successful copy', async () => {
    writeText.mockResolvedValue()
    await openShare()
    await button('复制链接').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(wrapper.get<HTMLInputElement>('input[aria-label="分享链接"]').element.value)
    expect(button('已复制').exists()).toBe(true)
  })

  it('keeps an old copy result out of a reopened dialog', async () => {
    let resolve = () => {}
    const pending = new Promise<void>((done) => { resolve = done })
    writeText.mockReturnValue(pending)
    await openShare()
    await button('复制链接').trigger('click')
    await button('关闭').trigger('click')
    await openShare()
    resolve()
    await flushPromises()
    expect(button('复制链接').exists()).toBe(true)
  })

  it('clears a failed copy message when retrying successfully', async () => {
    writeText.mockRejectedValueOnce(new Error('Clipboard denied')).mockResolvedValueOnce()
    await openShare()
    await button('复制链接').trigger('click')
    await flushPromises()
    expect(wrapper.get('.copy-error').text()).toContain('请选中上方链接手动复制')
    await button('复制链接').trigger('click')
    await flushPromises()
    expect(button('已复制').exists()).toBe(true)
    expect(wrapper.find('.copy-error').exists()).toBe(false)
  })
})
