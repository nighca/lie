import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { CharacterChoice, Transcript, UiButton, UiDialog, VoiceControl } from '../src'

const wrappers: { unmount(): void }[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})

describe('shared controls', () => {
  it('uses native buttons and prevents disabled actions', async () => {
    const wrapper = mount(UiButton, { props: { disabled: true }, slots: { default: '开始对话' } })
    wrappers.push(wrapper)
    expect(wrapper.attributes('type')).toBe('button')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    await wrapper.setProps({ disabled: false })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    await wrapper.setProps({ busy: true })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.get('button').element.disabled).toBe(true)
  })

  it('exposes character selection without owning selection state', async () => {
    const wrapper = mount(CharacterChoice, { props: { name: '名字很长也需要完整显示的人物', description: '夜间值班工作人员', selected: false } })
    wrappers.push(wrapper)
    expect(wrapper.text()).toContain('名字很长也需要完整显示的人物')
    expect(wrapper.attributes('aria-pressed')).toBe('false')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    await wrapper.setProps({ selected: true })
    expect(wrapper.attributes('aria-pressed')).toBe('true')
  })

  it('keeps readonly transcription visible while messages update', async () => {
    const wrapper = mount(Transcript, { props: { messages: [] } })
    wrappers.push(wrapper)
    const log = wrapper.get('[role="log"]')
    expect(log.isVisible()).toBe(true)
    expect(log.text()).toContain('还没有对话')
    await wrapper.setProps({ messages: [{ id: 'one', speaker: '你', text: '闭馆之后，你在哪里？', mine: true }] })
    expect(log.isVisible()).toBe(true)
    expect(log.text()).toContain('你闭馆之后，你在哪里？')
    await wrapper.setProps({ messages: [{ id: 'two', speaker: '人物甲', text: '我在前台。' }] })
    expect(log.isVisible()).toBe(true)
    expect(log.text()).toContain('我在前台。')
  })

  it('emits voice intents without changing the caller-owned state', async () => {
    const wrapper = mount(VoiceControl, { props: { status: 'speaking', label: '对方正在说话', actionLabel: '打断并说话', interruptLabel: '打断说话' } })
    wrappers.push(wrapper)
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('interrupt')).toHaveLength(1)
    expect(wrapper.emitted('start')).toHaveLength(1)
    expect(wrapper.attributes('data-status')).toBe('speaking')
    await wrapper.setProps({ disabled: true })
    expect(wrapper.findAll('button').every((button) => button.element.disabled)).toBe(true)
  })

  it('composes caller-owned voice details without adding another conversation action', async () => {
    const wrapper = mount(VoiceControl, { props: { active: true, status: 'recording', label: '正在聆听', actionLabel: '结束对话' }, slots: { details: '<span>剩余询问时间 02:30</span>' } })
    wrappers.push(wrapper)
    expect(wrapper.get('.lie-voice__details').text()).toBe('剩余询问时间 02:30')
    expect(wrapper.findAll('button')).toHaveLength(1)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('start')).toHaveLength(1)
    await wrapper.setProps({ status: 'waiting', label: '等待回答' })
    expect(wrapper.get('.lie-voice__details').text()).toBe('剩余询问时间 02:30')
    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    await wrapper.setProps({ active: false, status: 'idle', label: '等待你开口' })
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('.lie-voice__waveform').exists()).toBe(false)
  })

  it('keeps the player waveform connected through silence, waiting and answers', async () => {
    const wrapper = mount(VoiceControl, { props: { active: true, status: 'speaking', label: '正在回答', inputLevel: 0 } })
    wrappers.push(wrapper)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.find('.lie-voice__waveform').exists()).toBe(true)
    await wrapper.setProps({ inputLevel: .09, inputActive: true })
    expect(wrapper.get('.lie-voice__waveform').attributes('aria-label')).toBe('玩家声音音量')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.findAll('i').at(-1)!.attributes('style')).toContain('25.5px')
    await wrapper.setProps({ inputActive: false, status: 'recording' })
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.find('.lie-voice__waveform').exists()).toBe(true)
    expect(wrapper.get('meter').element.value).toBe(0)
    expect(wrapper.findAll('i').every((bar) => (bar.attributes('style') ?? '').includes('3px'))).toBe(true)
    await wrapper.setProps({ status: 'waiting', inputLevel: .001 })
    expect(wrapper.get('meter').element.value).toBe(0)
    expect(wrapper.find('.lie-voice__waveform').exists()).toBe(true)
    await wrapper.setProps({ inputLevel: .04, inputActive: true })
    expect(wrapper.findAll('i')[0].attributes('style')).toContain('3px')
    expect(wrapper.findAll('i').at(-1)!.attributes('style')).toContain('17px')
    await wrapper.setProps({ active: false })
    expect(wrapper.find('.lie-voice__waveform').exists()).toBe(false)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    await wrapper.setProps({ preparing: true })
    expect(wrapper.get('[role="status"]').text()).toBe('正在连接')
    expect(wrapper.find('.lie-voice__waveform').exists()).toBe(false)
    await wrapper.setProps({ preparing: false, active: true, status: 'error', label: '语音暂时中断' })
    expect(wrapper.get('[role="status"]').text()).toBe('语音暂时中断')
    expect(wrapper.find('.lie-voice__waveform').exists()).toBe(false)
  })

  it('opens a native modal and requests closure on Escape', async () => {
    // jsdom lacks native modal methods; browser verification covers actual focus behavior.
    Object.defineProperties(HTMLDialogElement.prototype, {
      showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
      close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
    })
    const wrapper = mount(UiDialog, { props: { open: true, title: '确认你的选择' }, slots: { default: '可以返回继续对话。' }, attachTo: document.body })
    wrappers.push(wrapper)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('dialog').element.open).toBe(true)
    expect(wrapper.get('h2').attributes('id')).toBe(wrapper.attributes('aria-labelledby'))
    await wrapper.get('[aria-label=关闭弹窗]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.trigger('cancel')
    expect(wrapper.emitted('close')).toHaveLength(2)
    await wrapper.setProps({ open: false })
    expect(wrapper.get('dialog').element.open).toBe(false)
  })

  it('preserves interrupted answer text and marks only that answer with readable status text', () => {
    const wrapper = mount(Transcript, { props: { messages: [
      { id: 'partial', speaker: '甲', text: '已经显示的一句回答。', interrupted: true },
      { id: 'complete', speaker: '甲', text: '正常完成的回答。', interrupted: false },
    ] } })
    wrappers.push(wrapper)
    const answers = wrapper.findAll('article')
    expect(answers[0].get('p').text()).toBe('已经显示的一句回答。')
    expect(answers[0].get('.lie-transcript__interrupted').text()).toBe('回答被打断')
    expect(answers[1].get('p').text()).toBe('正常完成的回答。')
    expect(answers[1].find('.lie-transcript__interrupted').exists()).toBe(false)
    expect(wrapper.get('[role="log"]').text()).toContain('回答被打断')
  })
})
