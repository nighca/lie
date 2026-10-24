import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import Editor from '../src/editor/Editor.vue'
import { DRAFT_KEY } from '../src/editor/draft'
import { game as sourceGame } from './helpers'

const game = { ...sourceGame, characters: sourceGame.characters.map((character) => ({ ...character, appearanceId: null })) }

const cleanup: (() => void)[] = []
afterEach(() => { cleanup.splice(0).forEach((action) => action()); localStorage.clear() })
function page() {
  const wrapper = mount(Editor, { props: { appearances: [] } })
  cleanup.push(() => wrapper.unmount())
  return wrapper
}

describe('editor page', () => {
  it('autosaves incomplete edits and restores them when the page is reopened', async () => {
    const first = page()
    await first.get('input[name="title"]').setValue('我的小谜题')
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).title).toBe('我的小谜题')
    first.unmount()
    const restored = page()
    expect((restored.get('input[name="title"]').element as HTMLInputElement).value).toBe('我的小谜题')
    expect(restored.text()).toContain('已恢复')
  })
  it('emits a validated playable snapshot without owning game rules', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(game))
    const wrapper = page()
    await wrapper.findAll('button').find((button) => button.text() === '试玩当前案件')!.trigger('click')
    expect(wrapper.emitted('preview')?.[0]).toEqual([game])
    await wrapper.get('input[name="title"]').setValue('改名')
    expect((wrapper.emitted('preview')![0][0] as typeof game).title).toBe(game.title)
  })
  it('requires choosing a new correct character after deleting the original answer', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(game))
    const wrapper = page()
    await wrapper.get('[aria-label="删除人物 1"]').trigger('click')
    expect((wrapper.get('select[name="culprit"]').element as HTMLSelectElement).value).toBe('')
    await wrapper.findAll('button').find((button) => button.text() === '试玩当前案件')!.trigger('click')
    expect(wrapper.text()).toContain('请选择正确指认的人物')
    expect(wrapper.emitted('preview')).toBeUndefined()
  })
  it('leaves a damaged draft untouched until the user starts editing', async () => {
    localStorage.setItem(DRAFT_KEY, 'damaged')
    const wrapper = page()
    expect(wrapper.text()).toContain('本地草稿无法读取')
    expect(localStorage.getItem(DRAFT_KEY)).toBe('damaged')
    await wrapper.get('input[name="title"]').setValue('新故事')
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).title).toBe('新故事')
  })
})

describe('catalog-driven editor appearances', () => {
  it('displays and updates the manifest name of a previously unknown preset ID', async () => {
    const appearance = { id: 'new-guide', name: '新来的向导', avatar: '/avatar.png', portrait: '/portrait.png', accent: '#123456', voiceId: 'existing-voice', portraits: { listening: null, waiting: null, speaking: null } }
    const wrapper = mount(Editor, { props: { appearances: [appearance] } })
    cleanup.push(() => wrapper.unmount())
    expect(wrapper.get('.editor-appearance').text()).toBe('新来的向导')
    await wrapper.setProps({ appearances: [{ ...appearance, name: '来自清单的新名字' }] })
    expect(wrapper.get('.editor-appearance').text()).toBe('来自清单的新名字')
  })
})
