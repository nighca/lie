import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Transcript from '../src/components/Transcript.vue'
import type { TranscriptMessage } from '../src/components/Transcript.vue'

const wrappers: { unmount(): void }[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

describe('transcript follows the latest visible content', () => {
  it('follows an initial history, new messages and replacement character history', async () => {
    let height = 900
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => height)
    const wrapper = mount(Transcript, { props: { messages: [{ id: 'one', speaker: '甲', text: '初始历史。' }] } })
    wrappers.push(wrapper)
    const log = wrapper.get('[role="log"]').element
    expect(log.scrollTop).toBe(900)
    height = 1100
    await wrapper.setProps({ messages: [{ id: 'one', speaker: '甲', text: '初始历史。' }, { id: 'two', speaker: '你', text: '新问题。' }] })
    expect(log.scrollTop).toBe(1100)
    height = 1600
    await wrapper.setProps({ messages: [{ id: 'other', speaker: '乙', text: '另一个人物的长历史。' }] })
    expect(log.scrollTop).toBe(1600)
  })

  it('follows text growing within the same reactive message without scrolling the page', async () => {
    const messages = reactive<TranscriptMessage[]>([{ id: 'stream', speaker: '甲', text: '刚开始' }])
    const wrapper = mount(Transcript, { props: { messages } })
    wrappers.push(wrapper)
    const log = wrapper.get('[role="log"]').element
    const pageScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const scrollIntoView = vi.fn()
    const previous = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
    try {
      Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 1800 })
      messages[0].text += '，这一条回复持续增长，产生了新的可滚动内容。'
      await nextTick()
      expect(log.scrollTop).toBe(1800)
      expect(pageScroll).not.toHaveBeenCalled()
      expect(scrollIntoView).not.toHaveBeenCalled()
    } finally {
      if (previous != null) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', previous)
      else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
    }
  })

})
