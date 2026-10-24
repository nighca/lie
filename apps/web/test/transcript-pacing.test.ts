import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'

import App from '../src/App.vue'
import { setup } from './helpers'

const cleanup: (() => void)[] = []
afterEach(() => { cleanup.splice(0).forEach((action) => action()); vi.useRealTimers() })

it('animates a final player transcript while waiting for an answer, then flushes stop and historical revisits', async () => {
  vi.useFakeTimers()
  const { controller, turns } = setup()
  await controller.load('test'); controller.start()
  const wrapper = mount(App, { props: { controller, appearances: [], demo: false } })
  cleanup.push(() => { wrapper.unmount(); controller.dispose() })
  await controller.startConversation()
  await wrapper.vm.$nextTick()
  turns[0].scope.onEvent({ type: 'userText', text: '玩家整句识别结果' })
  await wrapper.vm.$nextTick()
  const question = () => wrapper.get('.lie-transcript__message--mine p').text()
  expect(controller.getView().voiceStatus).toBe('waiting')
  expect(controller.getView().conversationActive).toBe(true)
  expect(question()).toBe('')
  await vi.advanceTimersByTimeAsync(70)
  expect(question()).toBe('玩')
  turns[0].scope.onEvent({ type: 'assistantText', text: '新的角色回答'.repeat(10) })
  await wrapper.vm.$nextTick()
  expect(question()).toBe('玩家整句识别结果')
  await vi.advanceTimersByTimeAsync(100)
  expect(wrapper.findAll('.lie-transcript__bubble p').at(-1)!.text()).toBe('新')
  controller.endConversation()
  await wrapper.vm.$nextTick()
  expect(wrapper.findAll('.lie-transcript__bubble p').at(-1)!.text()).toBe('新的角色回答'.repeat(10))
  controller.selectCharacter('two'); await wrapper.vm.$nextTick()
  controller.selectCharacter('one'); await wrapper.vm.$nextTick()
  expect(question()).toBe('玩家整句识别结果')
  expect(wrapper.findAll('.lie-transcript__bubble p').at(-1)!.text()).toBe('新的角色回答'.repeat(10))
  expect(vi.getTimerCount()).toBe(0)
})
