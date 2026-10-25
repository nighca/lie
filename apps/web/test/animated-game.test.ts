import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimatedPortrait } from '@lie/ui'
import { readAnimationPackage } from '@lie/character-animation'

import dataSource from '../../../design/character-presets/assets/coral-bob/animation/package.json'
import App from '../src/App.vue'
import { readCharacterPresets } from '../src/presentation/characterPresets'
import { game, setup } from './helpers'

const animation = vi.hoisted(() => ({ load: vi.fn(), render: vi.fn(), dispose: vi.fn() }))
vi.mock('@lie/character-animation', async importOriginal => ({
  ...await importOriginal<typeof import('@lie/character-animation')>(),
  loadAnimationPackage: animation.load,
  createCanvasRenderer: () => ({ render: animation.render, dispose: animation.dispose }),
}))
const data = readAnimationPackage({
  ...structuredClone(dataSource),
  schemaVersion: 1,
  states: {
    default: dataSource.states.default,
    listening: dataSource.states.listening,
    waiting: dataSource.states.waiting,
    speaking: dataSource.states.speaking,
  },
})
const cleanup: (() => void)[] = []
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 42))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  animation.load.mockResolvedValue({ data, images: new Map() })
})
afterEach(() => { cleanup.splice(0).forEach(action => action()); vi.unstubAllGlobals() })
function scene(culpritId = game.ending.culpritId) {
  const content = { ...game, ending: { ...game.ending, culpritId }, characters: game.characters.map((character, index) => ({ ...character, appearanceId: index === 0 ? 'coral-bob' : 'blue-glasses' })) }
  const characterPresets = readCharacterPresets([
    { id: 'coral-bob', name: '珊瑚短发', avatar: '/red-avatar.png', portrait: '/red.png', portraits: { listening: '/red-listening.png', waiting: '/red-waiting.png', speaking: '/red-speaking.png', accusedCorrectly: '/red-correct.webp', accusedWrongly: '/red-wrong.webp' }, accent: '#ff0000', animation: '/appearances/coral-bob/animation/package.json' },
    { id: 'blue-glasses', name: '蓝衣眼镜', avatar: '/blue-avatar.png', portrait: '/blue.png', portraits: { speaking: '/blue-speaking.png' }, accent: '#0000ff' },
  ])
  return { ...setup(undefined, content), characterPresets }
}
function show(controller: ReturnType<typeof setup>['controller'], characterPresets: ReturnType<typeof readCharacterPresets>) {
  const wrapper = mount(App, { props: { controller, characterPresets, demo: true } })
  cleanup.push(() => { wrapper.unmount(); controller.dispose() })
  return wrapper
}

describe('animated character in the game page', () => {
  it('follows game voice states, starts a late animation in the current state and returns to default on end/error', async () => {
    let finish!: (value: { data: typeof data; images: Map<string, HTMLImageElement> }) => void
    animation.load.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    const { controller, turns, characterPresets } = scene()
    await controller.load('test'); controller.start()
    const wrapper = show(controller, characterPresets)
    const portrait = () => wrapper.getComponent(AnimatedPortrait)
    expect(portrait().props('state')).toBe('default')
    expect(wrapper.get('.portrait-backdrop [role="status"]').text()).toBe('人物加载中…')
    expect(wrapper.find('.portrait-backdrop img').exists()).toBe(false)
    await controller.startConversation(); await wrapper.vm.$nextTick()
    expect(portrait().props('state')).toBe('listening')
    finish({ data, images: new Map() }); await flushPromises()
    expect(wrapper.get('.portrait-backdrop canvas').isVisible()).toBe(true)
    expect(wrapper.find('.portrait-backdrop [role="status"]').exists()).toBe(false)
    expect(wrapper.find('.portrait-backdrop img').exists()).toBe(false)
    expect(animation.render.mock.calls.at(-1)?.[0]['listen-front'].visible).toBe(true)
    turns[0].scope.onEvent({ type: 'userText', text: '问题。' }); await wrapper.vm.$nextTick()
    expect(portrait().props('state')).toBe('waiting')
    turns[0].scope.onEvent({ type: 'speaking' }); await wrapper.vm.$nextTick()
    expect(portrait().props('state')).toBe('speaking')
    turns[0].scope.onEvent({ type: 'listening' }); await wrapper.vm.$nextTick()
    expect(portrait().props('state')).toBe('listening')
    controller.endConversation(); await wrapper.vm.$nextTick()
    expect(portrait().props('state')).toBe('default')
    await controller.startConversation()
    turns[1].scope.onEvent({ type: 'error' }); await wrapper.vm.$nextTick()
    expect(portrait().props('state')).toBe('default')
  })

  it('disposes animation on switching to a static character and retains the current static state when loading fails', async () => {
    const { controller, turns, characterPresets } = scene()
    await controller.load('test'); controller.start()
    const wrapper = show(controller, characterPresets)
    await flushPromises()
    expect(wrapper.get('.portrait-backdrop canvas').isVisible()).toBe(true)
    controller.selectCharacter('two'); await flushPromises()
    expect(animation.dispose).toHaveBeenCalledOnce()
    expect(cancelAnimationFrame).toHaveBeenCalledWith(42)
    expect(wrapper.getComponent(AnimatedPortrait).props('src')).toBe(null)
    expect(wrapper.get('.portrait-backdrop img').attributes('src')).toBe('/blue.png')
    expect(wrapper.find('.portrait-backdrop [role="status"]').exists()).toBe(false)
    await controller.startConversation()
    turns[0].scope.onEvent({ type: 'speaking' }); await wrapper.vm.$nextTick()
    expect(wrapper.get('.portrait-backdrop img').attributes('src')).toBe('/blue-speaking.png')
    animation.load.mockRejectedValueOnce(new Error('missing animation asset'))
    controller.selectCharacter('one'); await flushPromises()
    expect(animation.load).toHaveBeenCalledTimes(2)
    await controller.startConversation(); await flushPromises()
    expect(wrapper.get('.portrait-backdrop').html()).toContain('display: none')
    expect(wrapper.get('.portrait-backdrop img').attributes('src')).toBe('/red-listening.png')
    expect(wrapper.find('.portrait-backdrop [role="status"]').exists()).toBe(false)
    turns[1].scope.onEvent({ type: 'userText', text: '问题。' }); await wrapper.vm.$nextTick()
    expect(wrapper.get('.portrait-backdrop img').attributes('src')).toBe('/red-waiting.png')
  })
})


describe('result reactions in the game page', () => {
  it.each([true, false])('plays the actual accused character reaction when correct=%s and unmounts it on restart', async (correct) => {
    const resultData = readAnimationPackage({
      ...dataSource,
      schemaVersion: 2,
      states: { ...dataSource.states, accusedCorrectly: 'correct', accusedWrongly: 'wrong' },
      clips: {
        ...dataSource.clips,
        correct: { ...dataSource.clips.rest, loop: false },
        wrong: { ...dataSource.clips.rest, loop: false },
      },
    })
    animation.load.mockResolvedValue({ data: resultData, images: new Map() })
    const { controller, characterPresets } = scene(correct ? 'one' : 'two')
    await controller.load('test'); controller.start()
    controller.selectCharacter('two')
    controller.openAccusation(); controller.accuse('one')
    const wrapper = show(controller, characterPresets)
    await flushPromises()
    const portrait = wrapper.getComponent(AnimatedPortrait)
    expect(portrait.props('state')).toBe(correct ? 'accusedCorrectly' : 'accusedWrongly')
    expect(portrait.props('fit')).toBe('contain')
    expect(portrait.props('label')).toBe('甲')
    expect(portrait.props('src')).toBe('/appearances/coral-bob/animation/package.json')
    expect(wrapper.get('.result-character figcaption strong').text()).toBe('甲')
    expect(wrapper.get('.result-mark__stroke').attributes('d')).toBe(correct ? 'm27 51 16 17 32-37' : 'm32 32 36 36m0-36L32 68')
    expect(wrapper.get('.result-portrait canvas').isVisible()).toBe(true)
    controller.restart(); await flushPromises()
    expect(wrapper.findComponent(AnimatedPortrait).exists()).toBe(false)
    expect(animation.dispose).toHaveBeenCalledOnce()
  })

  it.each(['legacy package', 'failed load', 'static only'])('uses the corresponding static reaction with a %s', async (mode) => {
    if (mode === 'failed load') animation.load.mockRejectedValue(new Error('missing resource'))
    const { controller, characterPresets } = scene()
    const contentPresets = mode === 'static only' ? characterPresets.map(preset => ({ ...preset, animation: null })) : characterPresets
    await controller.load('test'); controller.start(); controller.openAccusation(); controller.accuse('one')
    const wrapper = show(controller, contentPresets)
    await flushPromises()
    expect(wrapper.get('.result-portrait img').attributes('src')).toBe('/red-correct.webp')
    expect(wrapper.get('.result-portrait canvas').isVisible()).toBe(false)
    expect(animation.render).not.toHaveBeenCalled()
    await wrapper.get('.result-portrait img').trigger('error')
    expect(wrapper.get('.result-portrait img').attributes('src')).toBe('/red.png')
    await wrapper.get('.result-portrait img').trigger('error')
    expect(wrapper.get('.result-initial').text()).toBe('甲')
  })

  it('uses the wrong-result static when that character was accused incorrectly', async () => {
    const { controller, characterPresets } = scene('two')
    await controller.load('test'); controller.start(); controller.openAccusation(); controller.accuse('one')
    const wrapper = show(controller, characterPresets)
    await flushPromises()
    expect(wrapper.get('.result-portrait img').attributes('src')).toBe('/red-wrong.webp')
    expect(wrapper.getComponent(AnimatedPortrait).props('state')).toBe('accusedWrongly')
    expect(wrapper.get('.result-story').text()).toBe('这次调查已结束想再试一次，请重新开始一局。')
    expect(wrapper.get('.result-story').text()).not.toContain(game.ending.reveal)
  })
})
