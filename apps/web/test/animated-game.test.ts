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
const data = readAnimationPackage(dataSource)
const cleanup: (() => void)[] = []
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 42))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  animation.load.mockResolvedValue({ data, images: new Map() })
})
afterEach(() => { cleanup.splice(0).forEach(action => action()); vi.unstubAllGlobals() })
function scene() {
  const content = { ...game, characters: game.characters.map((character, index) => ({ ...character, appearanceId: index === 0 ? 'coral-bob' : 'blue-glasses' })) }
  const characterPresets = readCharacterPresets([
    { id: 'coral-bob', name: '珊瑚短发', avatar: '/red-avatar.png', portrait: '/red.png', portraits: { listening: '/red-listening.png', waiting: '/red-waiting.png', speaking: '/red-speaking.png' }, accent: '#ff0000', animation: '/appearances/coral-bob/animation/package.json' },
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
    expect(wrapper.get('.portrait-backdrop img').attributes('src')).toBe('/red.png')
    await controller.startConversation(); await wrapper.vm.$nextTick()
    expect(portrait().props('state')).toBe('listening')
    finish({ data, images: new Map() }); await flushPromises()
    expect(wrapper.get('.portrait-backdrop canvas').isVisible()).toBe(true)
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
    await controller.startConversation()
    turns[0].scope.onEvent({ type: 'speaking' }); await wrapper.vm.$nextTick()
    expect(wrapper.get('.portrait-backdrop img').attributes('src')).toBe('/blue-speaking.png')
    animation.load.mockRejectedValueOnce(new Error('missing animation asset'))
    controller.selectCharacter('one'); await flushPromises()
    expect(animation.load).toHaveBeenCalledTimes(2)
    await controller.startConversation(); await flushPromises()
    expect(wrapper.get('.portrait-backdrop').html()).toContain('display: none')
    expect(wrapper.get('.portrait-backdrop img').attributes('src')).toBe('/red-listening.png')
    turns[1].scope.onEvent({ type: 'userText', text: '问题。' }); await wrapper.vm.$nextTick()
    expect(wrapper.get('.portrait-backdrop img').attributes('src')).toBe('/red-waiting.png')
  })
})
