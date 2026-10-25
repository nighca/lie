import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Editor from '../src/editor/Editor.vue'
import { DRAFT_KEY } from '../src/editor/draft'
import * as sharing from '../src/editor/share'
import { game } from './helpers'

const characterPreset = { id: 'blue', name: '蓝衣眼镜', avatar: '/a.png', portrait: '/p.png', accent: '#123456', voiceId: null, animation: null, portraits: { listening: null, waiting: null, speaking: null } }
const cleanup: (() => void)[] = []
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false } })
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.open = true } })
})
afterEach(() => { cleanup.splice(0).forEach((action) => action()); localStorage.clear(); vi.restoreAllMocks() })

describe('unique editor character names', () => {
  it.each(['试玩', '分享案件'])('blocks %s on duplicate names, locates both fields and recovers after renaming', async (label) => {
    const stored = { ...game, characters: game.characters.map((person, index) => ({ ...person, appearanceId: characterPreset.id, name: index === 0 ? '小林' : ' 小林 ' })) }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(stored))
    const encode = vi.spyOn(sharing, 'encodeGameLink').mockResolvedValue('https://lie.example/play#game=encoded')
    const wrapper = mount(Editor, { props: { characterPresets: [characterPreset] }, attachTo: document.body })
    cleanup.push(() => wrapper.unmount())
    async function act() {
      await wrapper.findAll('button').find((button) => button.text() === label)!.trigger('click')
      await flushPromises()
    }
    await wrapper.findAll('.editor-steps button')[2].trigger('click')
    await act()
    expect(wrapper.get('h1').text()).toBe('故事人物')
    expect(wrapper.emitted('preview')).toBeUndefined()
    expect(encode).not.toHaveBeenCalled()
    const issues = wrapper.findAll('.error-summary button')
    expect(issues.map((issue) => issue.text())).toEqual(['人物姓名“小林”重复，请使用不同姓名', '人物姓名“小林”重复，请使用不同姓名'])
    expect(document.activeElement).toBe(wrapper.get('[data-field=name]').element)
    expect(wrapper.get('[data-field=name]').attributes('aria-invalid')).toBe('true')
    expect((wrapper.get('[data-field=name]').element as HTMLInputElement).value).toBe('小林')
    await issues[1].trigger('click')
    await flushPromises()
    expect((wrapper.get('[data-field=name]').element as HTMLInputElement).value).toBe(' 小林 ')
    expect(document.activeElement).toBe(wrapper.get('[data-field=name]').element)
    await wrapper.get('[data-field=name]').setValue('小周')
    expect(wrapper.find('.error-summary').exists()).toBe(false)
    await act()
    if (label === '试玩') {
      expect(wrapper.emitted('preview')?.[0]).toEqual([{ ...stored, characters: stored.characters.map((person, index) => ({ ...person, name: index === 0 ? '小林' : '小周' })) }])
    } else {
      expect(encode).toHaveBeenCalledOnce()
      expect(wrapper.get('dialog textarea').element).toHaveProperty('value', 'https://lie.example/play#game=encoded')
    }
  })
})
