import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '../src/App.vue'
import { readCharacterPresets } from '../src/presentation/characterPresets'
import { game, setup } from './helpers'

const cleanup: (() => void)[] = []
const presets = readCharacterPresets([
  { id: 'yellow', name: '黄衣', portrait: '/yellow.png', avatar: '/yellow-avatar.png', accent: '#ffcf43' },
  { id: 'red', name: '红衣', portrait: '/red.png', avatar: '/red-avatar.png', accent: '#ff665b' },
])
const content = {
  ...game,
  background: '  沈禾把白盒给顾遥。\n顾遥又问沈禾；  旁人并不在场。\n',
  characters: game.characters.map((person, index) => ({ ...person, name: index === 0 ? '沈禾' : '顾遥', appearanceId: index === 0 ? 'yellow' : 'red' })),
}
function createScene(source = content, characterPresets = presets) {
  const { controller, turns } = setup({ now: () => 0, setTimeout, clearTimeout }, source)
  const wrapper = mount(App, { props: { controller, characterPresets, demo: true } })
  cleanup.push(() => { wrapper.unmount(); controller.dispose() })
  return { controller, turns, wrapper }
}
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
})
afterEach(() => cleanup.splice(0).forEach((action) => action()))

describe('public background character names', () => {
  it('highlights both public entrances without changing text or background pause semantics', async () => {
    const { controller, turns, wrapper } = createScene()
    await controller.load('test'); await wrapper.vm.$nextTick()
    const opening = wrapper.get('.background')
    expect(opening.element.textContent).toBe(content.background)
    expect(opening.findAll('mark').map((mark) => mark.text())).toEqual(['沈禾', '顾遥', '顾遥', '沈禾'])
    controller.start(); await controller.startConversation()
    turns[0].scope.onEvent({ type: 'userText', text: '沈禾和顾遥在一起吗？' }); await wrapper.vm.$nextTick()
    expect(wrapper.get('.conversation-copy [role=log]').find('mark').exists()).toBe(false)
    await wrapper.get('[aria-label="查看案件背景"]').trigger('click')
    const modal = wrapper.get('.background-dialog')
    expect(modal.get('.public-background').element.textContent).toBe(content.background)
    expect(modal.findAll('mark').map((mark) => mark.text())).toEqual(['沈禾', '顾遥', '顾遥', '沈禾'])
    expect(modal.text()).not.toContain(content.characters[0].profile)
    expect(modal.text()).not.toContain(content.ending.reveal)
    expect(turns[0].closed).toBe(true)
    expect(controller.getView().conversationActive).toBe(false)
    await modal.get('footer button').trigger('click')
    expect(controller.getView().conversationActive).toBe(false)
    controller.openAccusation(); controller.accuse('one'); await wrapper.vm.$nextTick()
    expect(content.background).toBe('  沈禾把白盒给顾遥。\n顾遥又问沈禾；  旁人并不在场。\n')
  })

  it('uses neutral marks without presets and responds to arriving, updated and removed themes', async () => {
    const { controller, wrapper } = createScene(content, [])
    await controller.load('test'); await wrapper.vm.$nextTick()
    const accents = () => wrapper.get('.background').findAll('mark').map((mark) => (mark.element as HTMLElement).style.getPropertyValue('--character-name-accent'))
    expect(accents()).toEqual(['', '', '', ''])
    await wrapper.setProps({ characterPresets: presets })
    expect(accents()).toEqual(['#ffcf43', '#ff665b', '#ff665b', '#ffcf43'])
    expect(wrapper.get('.public-background mark').attributes('style')).toContain('#ffcf43')
    await wrapper.setProps({ characterPresets: presets.map((preset) => ({ ...preset, accent: '#335577' })) })
    expect(accents()).toEqual(['#335577', '#335577', '#335577', '#335577'])
    await wrapper.setProps({ characterPresets: [] })
    expect(accents()).toEqual(['', '', '', ''])
  })

  it('keeps old duplicate names neutral when their themes differ or one preset is missing', async () => {
    const source = { ...content, background: '沈禾和沈禾。', characters: content.characters.map((person) => ({ ...person, name: '沈禾' })) }
    const { controller, wrapper } = createScene(source)
    await controller.load('test'); await wrapper.vm.$nextTick()
    const accents = () => wrapper.get('.background').findAll('mark').map((mark) => (mark.element as HTMLElement).style.getPropertyValue('--character-name-accent'))
    expect(accents()).toEqual(['', ''])
    await wrapper.setProps({ characterPresets: [presets[0]] })
    expect(accents()).toEqual(['', ''])
    await wrapper.setProps({ characterPresets: presets.map((preset) => ({ ...preset, accent: '#ffcf43' })) })
    expect(accents()).toEqual(['#ffcf43', '#ffcf43'])
  })

  it('renders HTML and regular-expression punctuation literally without adding elements or spaces', async () => {
    const source = { ...content, background: '  A+B <br> <b>乙</b>\n\tA+B & AAB  ', characters: content.characters.map((person, index) => ({ ...person, name: index === 0 ? 'A+B' : '<b>乙</b>' })) }
    const { controller, wrapper } = createScene(source)
    await controller.load('test'); await wrapper.vm.$nextTick()
    expect(wrapper.get('.background').element.textContent).toBe(source.background)
    expect(wrapper.get('.public-background').element.textContent).toBe(source.background)
    expect(wrapper.get('.background').findAll('mark').map((mark) => mark.text())).toEqual(['A+B', '<b>乙</b>', 'A+B'])
    expect(wrapper.get('.background').find('b, br, img, script').exists()).toBe(false)
  })
})
