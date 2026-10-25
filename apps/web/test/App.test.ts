import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../src/App.vue'
import { VoiceAvailabilityError } from '../src/application/voice'
import { readCharacterPresets } from '../src/presentation/characterPresets'
import { game, setup } from './helpers'

const cleanup: (() => void)[] = []
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
})
afterEach(() => { cleanup.splice(0).forEach((action) => action()); vi.useRealTimers() })

describe('game screens', () => {
  it('ends a wrong accusation in failure and permits only a fresh attempt before a correct result', async () => {
    const { controller } = setup()
    await controller.load('test')
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    async function click(text: string) {
      const button = wrapper.findAll('button').find((item) => (item.attributes('aria-label') ?? item.text()) === text)
      expect(button, text).toBeDefined()
      await button!.trigger('click')
    }
    await click('接案，开始调查')
    expect(wrapper.get('[role="log"]').isVisible()).toBe(true)
    await click('我有答案了 →')
    await click('指认 乙')
    expect(wrapper.text()).toContain('本局结束')
    expect(wrapper.get('main h1').text()).toBe('指认不正确')
    expect(wrapper.get('dialog').element.open).toBe(false)
    expect(wrapper.get('main').findAll('button').map((button) => button.text())).toEqual(['重新开始一局', '返回案件列表'])
    expect(wrapper.text()).not.toContain(game.ending.reveal)
    await click('重新开始一局')
    expect(controller.getView().phase).toBe('intro')
    await click('接案，开始调查')
    await click('我有答案了 →')
    await click('指认 甲')
    expect(wrapper.text()).toContain('仅在揭晓后显示的结局')
    await click('重新开始一局')
    expect(wrapper.text()).toContain('接案，开始调查')
    expect(controller.getView().phase).toBe('intro')
  })

  it.each([1, 4, 7])('presents and starts an introduction with %i characters', async (count) => {
    const characters = Array.from({ length: count }, (_, index) => ({ ...game.characters[0], id: `person-${index}`, name: `人物${index + 1}` }))
    const { controller } = setup(undefined, { ...game, characters, ending: { ...game.ending, culpritId: characters[0].id } })
    await controller.load('test')
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    expect(wrapper.get('main').findAll('.intro-character strong').map((name) => name.text())).toEqual(characters.map(({ name }) => name))
    await wrapper.get('.intro-start').trigger('click')
    expect(wrapper.findAll('.character-list button')).toHaveLength(count)
  })

  it.each([1, 4, 7])('offers all %i accusation cards and submits only on activation', async (count) => {
    const characters = Array.from({ length: count }, (_, index) => ({ ...game.characters[0], id: `person-${index}`, name: `人物${index + 1}` }))
    const { controller } = setup(undefined, { ...game, characters, ending: { ...game.ending, culpritId: characters[count - 1].id } })
    await controller.load('test'); controller.start(); controller.openAccusation()
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    const cards = wrapper.findAll('.accusation-choices button')
    expect(cards.map((card) => card.attributes('aria-label'))).toEqual(characters.map(({ name }) => `指认 ${name}`))
    await cards[0].trigger('mouseenter')
    await cards[0].trigger('focus')
    expect(controller.getView()).toMatchObject({ phase: 'interrogating', accusationOpen: true })
    await cards[count - 1].trigger('click')
    expect(controller.getView().phase).toBe('solved')
  })

  it.each([[600, '10分钟'], [330, '5分30秒']])('uses natural language for a %s-second introduction', async (seconds, label) => {
    const { controller } = setup(undefined, { ...game, interrogationLimitSeconds: Number(seconds) })
    await controller.load('test')
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: false } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    expect(wrapper.get('.muted').text()).toBe(`本局可询问${label}`)
  })

  it('opens only public background under the case title and leaves voice paused until manually restarted', async () => {
    vi.useFakeTimers()
    let now = 0
    const { controller, turns } = setup({ now: () => now, setTimeout, clearTimeout })
    await controller.load('test'); controller.start(); await controller.startConversation()
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: false } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    now = 2000
    await wrapper.get('[aria-label="查看案件背景"]').trigger('click')
    const background = wrapper.get('.background-dialog')
    expect(background.get('h2').text()).toBe(game.title)
    expect(background.text()).toContain(game.background)
    expect(background.text()).not.toContain(game.characters[0].profile)
    expect(background.text()).not.toContain(game.ending.reveal)
    expect(turns[0].closed).toBe(true)
    const paused = controller.getView().interrogationRemainingMs
    expect(paused).toBe(478000)
    await background.get('footer button').trigger('click')
    now = 20000
    await vi.advanceTimersByTimeAsync(1000)
    expect(controller.getView().interrogationRemainingMs).toBe(paused)
    expect(controller.getView().conversationActive).toBe(false)
    expect(turns).toHaveLength(1)
    await wrapper.get('[aria-label="语音对话控制"] button').trigger('click'); await flushPromises()
    expect(turns).toHaveLength(2)
  })

  it('keeps only the background modal open when time expires while opening it', async () => {
    let now = 0
    const { controller } = setup({ now: () => now, setTimeout, clearTimeout })
    await controller.load('test'); controller.start(); await controller.startConversation()
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: false } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    now = 480000
    await wrapper.get('[aria-label="查看案件背景"]').trigger('click')
    expect(wrapper.get<HTMLDialogElement>('.background-dialog').element.open).toBe(true)
    expect(wrapper.get<HTMLDialogElement>('.accusation-dialog').element.open).toBe(false)
    await wrapper.get('.background-dialog footer button').trigger('click')
    expect(wrapper.get<HTMLDialogElement>('.accusation-dialog').element.open).toBe(true)
    expect(controller.getView().phase).toBe('interrogating')
  })

  it('uses one start/end action through listening, waiting and speaking, with a shared time display', async () => {
    const { controller, turns } = setup()
    await controller.load('test'); controller.start()
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: false } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    const controls = () => wrapper.get('[aria-label="语音对话控制"]')
    expect(controls().get('[aria-label="剩余询问时间"]').text()).toContain('08:00')
    expect(wrapper.get('.conversation-copy h2').text()).toBe('甲的询问记录')
    expect(controls().findAll('button')).toHaveLength(2)
    expect(controls().get('button').attributes('aria-pressed')).toBe('false')
    expect(controls().text()).not.toContain('计时中')
    await controls().get('button').trigger('click'); await flushPromises()
    expect(controls().get('button').text()).toBe('结束对话')
    expect(controls().get('button').attributes('aria-pressed')).toBe('true')
    for (const event of [{ type: 'userText', text: '问题' } as const, { type: 'speaking' } as const, { type: 'listening' } as const]) {
      turns[0].scope.onEvent(event)
      await wrapper.vm.$nextTick()
      expect(controls().findAll('button')).toHaveLength(2)
      expect(controls().get('button').text()).toBe('结束对话')
      expect(controls().get('button').attributes('aria-pressed')).toBe('true')
      expect(controls().find('.lie-voice__waveform').exists()).toBe(true)
      expect(controls().find('[role="status"]').exists()).toBe(false)
    }
    await controls().get('button').trigger('click')
    expect(turns[0].closed).toBe(true)
    expect(controls().get('button').text()).toBe('开启对话')
    expect(controls().get('button').attributes('aria-pressed')).toBe('false')
    expect(controls().text()).not.toContain('计时中')
  })

  it('clears the active capture and counting marker after a voice error', async () => {
    const { controller, turns } = setup()
    await controller.load('test'); controller.start(); await controller.startConversation()
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: false } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    const controls = wrapper.get('[aria-label="语音对话控制"]')
    expect(controls.get('button').attributes('aria-pressed')).toBe('true')
    turns[0].scope.onEvent({ type: 'error' }); await wrapper.vm.$nextTick()
    expect(controls.text()).toContain('语音暂时中断')
    expect(controls.get('button').attributes('aria-pressed')).toBe('false')
    expect(controls.text()).not.toContain('计时中')
    expect(turns[0].closed).toBe(true)
  })

  it('explains when voice is not enabled in this environment before capture starts', async () => {
    const { controller, voice } = setup()
    voice.create = () => ({ async open() { throw new VoiceAvailabilityError('unavailable') }, close() {} })
    await controller.load('test'); controller.start()
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: false } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    await wrapper.get('[aria-label="语音对话控制"] button').trigger('click'); await flushPromises()
    expect(wrapper.text()).toContain('当前环境尚未开放语音体验')
    expect(wrapper.get('[aria-label="语音对话控制"] button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('[aria-label="语音对话控制"] button').text()).toBe('开启对话')
  })

  it('shows interrupted controller history without marking normally completed answers', async () => {
    vi.useFakeTimers()
    const { controller, turns } = setup()
    await controller.load('test'); controller.start(); await controller.startConversation()
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    turns[0].scope.onEvent({ type: 'assistantText', text: '保留这段已经显示的文字。' })
    turns[0].scope.onEvent({ type: 'interrupted' })
    turns[0].scope.onEvent({ type: 'assistantText', text: '随后正常结束的回答。' })
    turns[0].scope.onEvent({ type: 'listening' })
    await wrapper.vm.$nextTick()
    expect(controller.getView().history.map(({ interrupted }) => interrupted)).toEqual([true, false])
    await vi.advanceTimersByTimeAsync(1000)
    const answers = wrapper.findAll('[role="log"] article')
    expect(answers[0].get('p').text()).toBe('保留这段已经显示的文字。')
    expect(answers[0].get('.lie-transcript__interrupted').text()).toBe('回答被打断')
    expect(answers[1].get('p').text()).toBe('随后正常结束的回答。')
    expect(answers[1].find('.lie-transcript__interrupted').exists()).toBe(false)
  })

  it('keeps progressive pending text stable when committed, flushes on stop and shows full history after switching back', async () => {
    vi.useFakeTimers()
    const { controller, turns } = setup()
    await controller.load('test'); controller.start(); await controller.startConversation()
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    const text = '角色回复'.repeat(30)
    turns[0].scope.onEvent({ type: 'assistantText', text }); await wrapper.vm.$nextTick()
    await vi.advanceTimersByTimeAsync(100)
    const paragraph = wrapper.get('[role="log"] article p')
    const partial = paragraph.text()
    expect(partial.length).toBeGreaterThan(0)
    expect(partial.length).toBeLessThan(text.length)
    turns[0].scope.onEvent({ type: 'listening' }); await wrapper.vm.$nextTick()
    expect(wrapper.get('[role="log"] article p').element).toBe(paragraph.element)
    expect(paragraph.text()).toBe(partial)
    controller.endConversation(); await wrapper.vm.$nextTick()
    expect(paragraph.text()).toBe(text)
    controller.selectCharacter('two'); await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="log"] article').exists()).toBe(false)
    controller.selectCharacter('one'); await wrapper.vm.$nextTick()
    expect(wrapper.get('[role="log"] article p').text()).toBe(text)
    controller.restart(); await wrapper.vm.$nextTick()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('offers cancellation while microphone and service preparation is pending', async () => {
    const { controller, voice, turns } = setup()
    let ready!: () => void
    const create = voice.create
    voice.create = (scope) => ({ ...create(scope), open: () => new Promise((resolve) => { ready = resolve }) })
    await controller.load('test'); controller.start()
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: false } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    const controls = wrapper.get('[aria-label="语音对话控制"]')
    await controls.get('button').trigger('click')
    expect(controls.get('button').text()).toBe('取消连接')
    expect(controls.text()).toContain('正在连接')
    expect(controls.text()).not.toContain('对话已开启')
    expect(controls.text()).not.toContain('计时中')
    expect(controls.get('button').attributes('disabled')).toBeUndefined()
    await controls.get('button').trigger('click')
    expect(turns[0].closed).toBe(true)
    ready(); await flushPromises()
    expect(controls.get('button').text()).toBe('开启对话')
  })

})


describe('current character state portraits', () => {
  function createScene() {
    const content = { ...game, characters: game.characters.map((character, index) => ({ ...character, appearanceId: index === 0 ? 'red' : 'blue' })) }
    const characterPresets = readCharacterPresets([
      { id: 'red', name: '红色形象', avatar: '/red-avatar.png', portrait: '/red-default.png', accent: '#ff0000', portraits: { listening: '/red-listening.png', waiting: '/red-waiting.png', speaking: '/red-speaking.png' } },
      { id: 'blue', name: '蓝色形象', avatar: '/blue-avatar.png', portrait: '/blue-default.png', accent: '#0000ff', portraits: { speaking: '/blue-speaking.png' } },
    ])
    return { ...setup(undefined, content), characterPresets }
  }

  it('uses the default while preparing, then follows listening, waiting and speaking until the conversation ends', async () => {
    const { controller, turns, voice, characterPresets } = createScene()
    let ready!: () => void
    const create = voice.create
    voice.create = (scope) => ({ ...create(scope), open: () => new Promise((resolve) => { ready = resolve }) })
    await controller.load('test'); controller.start()
    const wrapper = mount(App, { props: { controller, characterPresets, demo: true } })
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
    const { controller, turns, characterPresets } = createScene()
    await controller.load('test'); controller.start()
    const wrapper = mount(App, { props: { controller, characterPresets, demo: true } })
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
    const { controller, turns, characterPresets } = createScene()
    await controller.load('test'); controller.start(); await controller.startConversation()
    const wrapper = mount(App, { props: { controller, characterPresets, demo: true } })
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
