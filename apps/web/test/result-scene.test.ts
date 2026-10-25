import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '../src/App.vue'
import { readCharacterPresets } from '../src/presentation/characterPresets'
import { game, setup } from './helpers'

const cleanup: (() => void)[] = []
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
})
afterEach(() => cleanup.splice(0).forEach((action) => action()))

const presets = readCharacterPresets([
  { id: 'red', name: '红衣', avatar: '/red-avatar.png', portrait: '/red-default.png', accent: '#ff665b', animation: '/appearances/red/animation/package.json', portraits: { speaking: '/red-speaking.png' } },
  { id: 'blue', name: '蓝衣', avatar: '/blue-avatar.png', portrait: '/blue-default.png', accent: '#075bfa' },
])

describe('accused character result scene', () => {
  it.each([true, false])('shows the actual accused character and preserves terminal actions when correct=%s', async (correct) => {
    const content = { ...game, characters: game.characters.map((person, index) => ({ ...person, appearanceId: index === 0 ? 'red' : 'blue' })), ending: { culpritId: 'two', reveal: '第一段真相。\n\n第二段经过。' } }
    const { controller } = setup(undefined, content)
    await controller.load('test'); controller.start()
    controller.selectCharacter(correct ? 'one' : 'two')
    controller.openAccusation()
    const wrapper = mount(App, { props: { controller, characterPresets: presets, demo: true, returnLabel: '返回我的案件' }, attachTo: document.body })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    await wrapper.get(`[aria-label="指认 ${correct ? '乙' : '甲'}"]`).trigger('click'); await flushPromises()

    expect(wrapper.get('.result-character figcaption strong').text()).toBe(correct ? '乙' : '甲')
    expect(wrapper.get('.result-portrait img').attributes('src')).toBe(correct ? '/blue-default.png' : '/red-default.png')
    expect(document.activeElement).toBe(wrapper.get('main h1').element)
    expect(wrapper.get('main h1').text()).toBe(correct ? '谜题解开了！' : '指认不正确')
    expect(wrapper.get<HTMLDialogElement>('.accusation-dialog').element.open).toBe(false)
    expect(wrapper.findAll('.result-actions button').map((button) => button.text())).toEqual(['重新开始一局', '改编游戏', '返回我的案件'])
    if (correct) {
      expect(wrapper.findAll('.result-story p').map((paragraph) => paragraph.text())).toEqual(['第一段真相。', '第二段经过。'])
    } else {
      expect(wrapper.get('.result-story').text()).toBe('这次调查已结束想再试一次，请重新开始一局。')
    }
    await wrapper.get('.result-actions button:last-child').trigger('click')
    expect(wrapper.emitted('navigateHome')).toHaveLength(1)
    await wrapper.get('.result-actions button:first-child').trigger('click')
    expect(controller.getView().phase).toBe('intro')
    expect(wrapper.find('.result-character').exists()).toBe(false)
  })

  it.each(['missing preset', 'broken portrait'])('keeps the accused name when the result has a %s', async (failure) => {
    const { controller } = setup(undefined, { ...game, characters: game.characters.map((person) => ({ ...person, appearanceId: 'red' })) })
    await controller.load('test'); controller.start(); controller.openAccusation(); controller.accuse('one')
    const wrapper = mount(App, { props: { controller, characterPresets: failure === 'missing preset' ? [] : presets, demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    if (failure === 'broken portrait') await wrapper.get('.result-portrait img').trigger('error')
    expect(wrapper.get('.result-initial').text()).toBe('甲')
    expect(wrapper.get('.result-character figcaption strong').text()).toBe('甲')
  })

  it('keeps long names, explicit line breaks and all ending paragraphs', async () => {
    const name = '来自社区摄影社的特别来宾'.repeat(4)
    const paragraphs = ['第一段。'.repeat(80), '第二段中的换行。\n仍在第二段。', '最后一段。'.repeat(60)]
    const { controller } = setup(undefined, { ...game, characters: game.characters.map((person) => person.id === 'one' ? { ...person, name } : person), ending: { culpritId: 'one', reveal: paragraphs.join('\n\n') } })
    await controller.load('test'); controller.start(); controller.openAccusation(); controller.accuse('one')
    const wrapper = mount(App, { props: { controller, characterPresets: [], demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    expect(wrapper.get('.result-character figcaption strong').text()).toBe(name)
    expect(wrapper.findAll('.result-story p').map((paragraph) => paragraph.element.textContent)).toEqual(paragraphs)
  })
})
