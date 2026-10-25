import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '../src/App.vue'
import Editor from '../src/editor/Editor.vue'
import { DRAFT_KEY } from '../src/editor/draft'
import { readCharacterPresets } from '../src/presentation/characterPresets'
import { game, setup } from './helpers'

const cleanup: (() => void)[] = []
const presets = readCharacterPresets([
  { id: 'yellow', name: '黄衣', portrait: '/yellow.png', avatar: '/yellow-avatar.png', accent: '#ffcf43' },
  { id: 'red', name: '红衣', portrait: '/red.png', avatar: '/red-avatar.png', accent: '#ff665b' },
])
const content = { ...game, background: '  沈禾、顾遥和小林。\n <b>原文</b>  ', characters: game.characters.map((person, index) => ({ ...person, name: index === 0 ? '沈禾' : '顾遥', appearanceId: index === 0 ? 'yellow' : 'red' })), ending: { ...game.ending, reveal: '  沈禾说：<b>顾遥</b>。\n单行\n\n顾遥也见过沈禾。  ' } }
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false } },
  })
})
afterEach(() => { cleanup.splice(0).forEach((action) => action()); localStorage.clear() })
function editor() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(content))
  const wrapper = mount(Editor, { props: { characterPresets: presets } })
  cleanup.push(() => wrapper.unmount())
  async function step(index: number) { await wrapper.findAll('.editor-steps button')[index].trigger('click') }
  async function click(text: string) { await wrapper.findAll('button').find((button) => button.text() === text)!.trigger('click'); await flushPromises() }
  return { wrapper, step, click }
}

describe('shared character name display', () => {
  it.each([true, false])('preserves heading and accusation labels and only reveals highlighted truth on success (%s)', async (correct) => {
    const { controller } = setup(undefined, content)
    const wrapper = mount(App, { props: { controller, characterPresets: presets, demo: true } })
    cleanup.push(() => { wrapper.unmount(); controller.dispose() })
    await controller.load('test'); controller.start(); await flushPromises()
    expect(wrapper.get('.conversation-copy h2').element.textContent).toBe('沈禾的询问记录')
    expect(wrapper.get('.conversation-copy h2 mark').text()).toBe('沈禾')
    controller.openAccusation(); await flushPromises()
    const accusation = wrapper.get('[aria-label="指认 沈禾"]')
    expect(accusation.get('strong').element.textContent).toBe('指认 沈禾')
    expect(accusation.get('mark').text()).toBe('沈禾')
    expect(accusation.attributes('type')).toBe('button')
    await wrapper.get(`[aria-label="指认 ${correct ? '沈禾' : '顾遥'}"]`).trigger('click')
    if (correct) {
      expect(wrapper.findAll('.result-story p').map((paragraph) => paragraph.element.textContent)).toEqual(content.ending.reveal.split('\n\n'))
      expect(wrapper.get('.result-story').findAll('mark').map((mark) => mark.text())).toEqual(['沈禾', '顾遥', '顾遥', '沈禾'])
      expect(wrapper.get('.result-story').find('b').exists()).toBe(false)
    } else {
      expect(wrapper.get('.result-story').text()).toContain('这次调查已结束')
      expect(wrapper.text()).not.toContain(content.ending.reveal)
    }
  })
  it('updates editor preview marks when names, themes, blank and duplicate names change', async () => {
    const { wrapper, step } = editor()
    const background = () => wrapper.get('[aria-label="接案内容预览"] p')
    const accents = () => background().findAll('mark').map((mark) => (mark.element as HTMLElement).style.getPropertyValue('--character-name-accent'))
    expect(background().element.textContent).toBe(content.background)
    expect(background().findAll('mark').map((mark) => mark.text())).toEqual(['沈禾', '顾遥'])
    expect(background().find('b').exists()).toBe(false)
    await step(1)
    await wrapper.get('[data-field=name]').setValue('顾遥')
    await step(0)
    expect(background().findAll('mark').map((mark) => mark.text())).toEqual(['顾遥'])
    expect(accents()).toEqual([''])
    await step(1); await wrapper.get('[data-field=name]').setValue('   '); await step(0)
    expect(background().findAll('mark').map((mark) => mark.text())).toEqual(['顾遥'])
    await wrapper.setProps({ characterPresets: presets.map((preset) => ({ ...preset, accent: '#335577' })) })
    expect(accents()).toEqual(['#335577'])
    await wrapper.setProps({ characterPresets: [] })
    expect(accents()).toEqual([''])
  })
  it('updates preview themes when an individual draft preset is changed', async () => {
    const { wrapper, step } = editor()
    await step(1)
    await wrapper.get('[data-field=preset]').trigger('click')
    await wrapper.get('.editor-preset[aria-label="红衣"]').trigger('click')
    await step(0)
    expect(wrapper.get('[aria-label="接案内容预览"] p').findAll('mark').map((mark) => (mark.element as HTMLElement).style.getPropertyValue('--character-name-accent'))).toEqual(['#ff665b', '#ff665b'])
    await step(2)
    expect(wrapper.get('[aria-label="结局内容预览"] p').findAll('mark').map((mark) => (mark.element as HTMLElement).style.getPropertyValue('--character-name-accent'))).toEqual(['#ff665b', '#ff665b', '#ff665b', '#ff665b'])
  })
  it('reacts to added and removed draft characters and highlights existing ending previews', async () => {
    const { wrapper, step, click } = editor()
    await step(1); await wrapper.get('.add-character').trigger('click'); await wrapper.get('[data-field=name]').setValue('小林')
    await step(0)
    expect(wrapper.get('[aria-label="接案内容预览"] p').findAll('mark').map((mark) => mark.text())).toEqual(['沈禾', '顾遥', '小林'])
    await step(1); await wrapper.get('[aria-label="删除小林"]').trigger('click')
    expect(wrapper.get('dialog mark').text()).toBe('小林')
    await click('确认删除'); await step(0)
    expect(wrapper.get('[aria-label="接案内容预览"] p').findAll('mark').map((mark) => mark.text())).toEqual(['沈禾', '顾遥'])
    await step(2)
    expect(wrapper.get('[aria-label="结局内容预览"] p').element.textContent).toBe(content.ending.reveal)
    expect(wrapper.get('[aria-label="结局内容预览"] p').findAll('mark').map((mark) => mark.text())).toEqual(['沈禾', '顾遥', '顾遥', '沈禾'])
    expect(wrapper.get('.answer-summary strong').element.textContent).toBe('沈禾')
    expect(wrapper.get('.answer-summary strong mark').text()).toBe('沈禾')
    expect((wrapper.get('[name=reveal]').element as HTMLTextAreaElement).value).toBe(content.ending.reveal)
  })
})
