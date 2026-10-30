import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'

import Transcript from '../src/components/Transcript.vue'

const cleanup: (() => void)[] = []
afterEach(() => { cleanup.splice(0).forEach(action => action()); vi.restoreAllMocks(); vi.useRealTimers() })

it('offers only the revealed text to a custom renderer and follows each visible update', async () => {
  vi.useFakeTimers()
  let height = 100
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => height)
  const render = vi.fn(({ text }: { text: string }) => h('em', text))
  const wrapper = mount(Transcript, { props: { messages: [], animate: true }, slots: { text: render } })
  cleanup.push(() => wrapper.unmount())
  await wrapper.setProps({ messages: [{ id: 'one', speaker: '角色', text: '沈禾在门口', pending: true }] })
  expect(render.mock.lastCall?.[0]).toEqual({ text: '' })
  expect(wrapper.get('article p').attributes('aria-live')).toBe('off')
  height = 300
  await vi.advanceTimersByTimeAsync(100)
  expect(render.mock.lastCall?.[0]).toEqual({ text: '沈' })
  expect(wrapper.get('article p em').text()).toBe('沈')
  expect(wrapper.get('[role="log"]').element.scrollTop).toBe(300)
  await wrapper.setProps({ messages: [{ id: 'one', speaker: '角色', text: '沈禾在门口等顾遥。', pending: true }] })
  expect(render.mock.lastCall?.[0]).toEqual({ text: '沈' })
  await vi.advanceTimersByTimeAsync(100)
  expect(render.mock.lastCall?.[0]).toEqual({ text: '沈禾' })
  await wrapper.setProps({ animate: false })
  expect(render.mock.lastCall?.[0]).toEqual({ text: '沈禾在门口等顾遥。' })
  expect(wrapper.get('article p').attributes('aria-live')).toBe('polite')
  await wrapper.setProps({ animate: true })
  await vi.advanceTimersByTimeAsync(100)
  expect(wrapper.get('article p em').text()).toBe('沈禾在门口等顾遥。')
})
