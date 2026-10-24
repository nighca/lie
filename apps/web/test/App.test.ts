import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../src/App.vue'
import { VoiceAvailabilityError } from '../src/application/voice'
import { readAppearances } from '../src/presentation/appearances'
import { game, setup } from './helpers'

const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach((action) => action()))

describe('game screens', () => {
  it('ends a wrong accusation in failure and permits only a fresh attempt before a correct result', async () => {
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
    expect(wrapper.text()).toContain('本局失败')
    expect(wrapper.get('main h1').text()).toBe('指认不正确')
    expect(wrapper.get('dialog').element.open).toBe(false)
    expect(wrapper.get('main').findAll('button').map((button) => button.text())).toEqual(['重新开始一局'])
    expect(wrapper.text()).not.toContain(game.ending.reveal)
    await click('重新开始一局')
    expect(controller.getView().phase).toBe('intro')
    await click('接案，开始调查')
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

  it('explains when voice is not enabled in this environment before capture starts', async () => {
    const { controller, voice } = setup()
    voice.create = () => ({ async open() { throw new VoiceAvailabilityError('unavailable') }, close() {} })
    await controller.load('test'); controller.start()
    const wrapper = mount(App, { props: { controller, appearances: [], demo: false } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    await wrapper.get('[aria-label="语音对话控制"] button').trigger('click'); await flushPromises()
    expect(wrapper.text()).toContain('当前环境尚未开放语音体验')
    expect(wrapper.get('[aria-label="语音对话控制"]').text()).toContain('等待你开口')
    expect(wrapper.get('[aria-label="语音对话控制"] button').text()).toBe('开始对话')
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


describe('current character state portraits', () => {
  function createScene() {
    const content = { ...game, characters: game.characters.map((character, index) => ({ ...character, appearanceId: index === 0 ? 'red' : 'blue' })) }
    const appearances = readAppearances([
      { id: 'red', avatar: '/red-avatar.png', portrait: '/red-default.png', accent: '#ff0000', portraits: { listening: '/red-listening.png', waiting: '/red-waiting.png', speaking: '/red-speaking.png' } },
      { id: 'blue', avatar: '/blue-avatar.png', portrait: '/blue-default.png', accent: '#0000ff', portraits: { speaking: '/blue-speaking.png' } },
    ])
    return { ...setup(undefined, content), appearances }
  }

  it('uses the default while preparing, then follows listening, waiting and speaking until the conversation ends', async () => {
    const { controller, turns, voice, appearances } = createScene()
    let ready!: () => void
    const create = voice.create
    voice.create = (scope) => ({ ...create(scope), open: () => new Promise((resolve) => { ready = resolve }) })
    await controller.load('test'); controller.start()
    const wrapper = mount(App, { props: { controller, appearances, demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    const portrait = () => wrapper.get('.portrait-backdrop img').attributes('src')
    expect(portrait()).toBe('/red-default.png')
    const opening = controller.startConversation()
    await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/red-default.png')
    ready(); await opening; await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/red-listening.png')
    turns[0].scope.onEvent({ type: 'userText', text: '问题。' })
    await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/red-waiting.png')
    turns[0].scope.onEvent({ type: 'speaking' })
    await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/red-speaking.png')
    turns[0].scope.onEvent({ type: 'listening' })
    await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/red-listening.png')
    controller.endConversation(); await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/red-default.png')
    voice.create = create
    await controller.startConversation()
    turns[1].scope.onEvent({ type: 'error' })
    await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/red-default.png')
  })

  it('selects the new character resources, falls back for missing states and keeps list avatars unchanged', async () => {
    const { controller, turns, appearances } = createScene()
    await controller.load('test'); controller.start()
    const wrapper = mount(App, { props: { controller, appearances, demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    const portrait = () => wrapper.get('.portrait-backdrop img').attributes('src')
    const avatars = () => wrapper.findAll('.character-list img').map((image) => image.attributes('src'))
    const originalAvatars = avatars()
    await controller.startConversation(); await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/red-listening.png')
    controller.selectCharacter('two'); await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/blue-default.png')
    await controller.startConversation(); await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/blue-default.png')
    turns[1].scope.onEvent({ type: 'userText', text: '问题。' })
    await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/blue-default.png')
    turns[1].scope.onEvent({ type: 'speaking' })
    await wrapper.vm.$nextTick()
    expect(portrait()).toBe('/blue-speaking.png')
    expect(avatars()).toEqual(originalAvatars)
  })

  it('falls back from a failed state image without poisoning the default or another character', async () => {
    const { controller, turns, appearances } = createScene()
    await controller.load('test'); controller.start(); await controller.startConversation()
    const wrapper = mount(App, { props: { controller, appearances, demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    const portrait = () => wrapper.get('.portrait-backdrop img')
    const failedListening = portrait()
    turns[0].scope.onEvent({ type: 'speaking' }); await wrapper.vm.$nextTick()
    await failedListening.trigger('error')
    expect(portrait().attributes('src')).toBe('/red-speaking.png')
    turns[0].scope.onEvent({ type: 'listening' }); await wrapper.vm.$nextTick()
    expect(portrait().attributes('src')).toBe('/red-default.png')
    await portrait().trigger('error')
    expect(wrapper.find('.portrait-backdrop img').exists()).toBe(false)
    expect(wrapper.get('.portrait-initial').text()).toBe('甲')
    controller.selectCharacter('two'); await wrapper.vm.$nextTick()
    expect(portrait().attributes('src')).toBe('/blue-default.png')
  })
})
