import { mount, flushPromises } from '@vue/test-utils'
import { KeepAlive, defineComponent, h, onMounted, onUnmounted, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnimatedPortrait, CharacterChoice } from '@lie/ui'

import Editor from '../src/editor/Editor.vue'
import { DRAFT_KEY } from '../src/editor/draft'
import * as sharing from '../src/editor/share'
import { game as sourceGame } from './helpers'

const characterPreset = { id: 'new-guide', name: '新来的向导', avatar: '/avatar.png', portrait: '/portrait.png', accent: '#123456', voiceId: 'existing-voice', animation: null, portraits: { listening: null, waiting: null, speaking: null } }
const game = { ...sourceGame, characters: sourceGame.characters.map((character) => ({ ...character, appearanceId: characterPreset.id })) }
const cleanup: (() => void)[] = []
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false } })
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.open = true } })
})
afterEach(() => { cleanup.splice(0).forEach((action) => action()); localStorage.clear(); vi.restoreAllMocks() })
function page(stored: unknown = null) {
  if (stored != null) localStorage.setItem(DRAFT_KEY, JSON.stringify(stored))
  const wrapper = mount(Editor, { props: { characterPresets: [characterPreset] }, attachTo: document.body })
  cleanup.push(() => wrapper.unmount())
  async function click(text: string) {
    const button = wrapper.findAll('button').find((button) => button.attributes('aria-label') === text || button.text() === text)
    expect(button, text).toBeDefined()
    await button!.trigger('click'); await flushPromises()
  }
  async function step(index: number) { await wrapper.findAll('.editor-steps button')[index].trigger('click') }
  return { wrapper, click, step }
}

describe('three-step editor', () => {
  it('releases the portrait while cached and remounts it on return without losing editing state', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(game))
    const visible = ref(true)
    const mounted = vi.fn()
    const released = vi.fn()
    const portrait = defineComponent({ setup() { onMounted(mounted); onUnmounted(released); return () => h('div', 'portrait') } })
    const wrapper = mount(defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => visible.value ? h(Editor, { characterPresets: [characterPreset] }) : null }) }), { global: { stubs: { AnimatedPortrait: portrait } } })
    cleanup.push(() => wrapper.unmount())
    await wrapper.findAll('.editor-steps button')[1].trigger('click')
    await wrapper.get('[data-field=name]').setValue('保留的姓名')
    expect(mounted).toHaveBeenCalledTimes(1)
    visible.value = false
    await flushPromises()
    expect(released).toHaveBeenCalledTimes(1)
    visible.value = true
    await flushPromises()
    expect(mounted).toHaveBeenCalledTimes(2)
    expect(wrapper.get('h1').text()).toBe('故事人物')
    expect((wrapper.get('[data-field=name]').element as HTMLInputElement).value).toBe('保留的姓名')
  })

  it('uses the shared product brand, draft notice and existing leave event', async () => {
    const { wrapper, click } = page(game)
    expect(wrapper.get('.lie-product-header__brand span').text()).toBe('语音推理')
    expect(wrapper.get('.lie-product-header__notice [role=status]').text()).toContain('已恢复')
    await wrapper.get('.lie-product-header__brand').trigger('click')
    await click('返回首页')
    expect(wrapper.emitted('leave')).toHaveLength(2)
    expect(wrapper.get('h1').text()).toBe('故事设定')
  })

  it('confirms clearing only this browser draft, then starts autosaving a fresh case', async () => {
    localStorage.setItem('other-setting', 'keep')
    const { wrapper, click, step } = page(game)
    await step(2)
    await click('清除草稿')
    await click('保留草稿')
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!)).toEqual(game)
    expect(wrapper.get('h1').text()).toBe('真相结局')
    await click('清除草稿')
    await click('确认清除')
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
    expect(wrapper.find('.editor-draft-status').exists()).toBe(false)
    expect(localStorage.getItem('other-setting')).toBe('keep')
    expect(wrapper.get('h1').text()).toBe('故事设定')
    expect((wrapper.get('[name=title]').element as HTMLInputElement).value).toBe('')
    expect(document.activeElement).toBe(wrapper.get('[name=title]').element)
    await step(1)
    expect(wrapper.findAll('.character-card')).toHaveLength(1)
    expect((wrapper.get('[data-field=profile]').element as HTMLTextAreaElement).value).toBe('')
    expect((wrapper.get('[data-field=answer]').element as HTMLInputElement).checked).toBe(false)
    await step(2)
    expect((wrapper.get('[name=reveal]').element as HTMLTextAreaElement).value).toBe('')
    wrapper.unmount()
    const fresh = page()
    expect((fresh.wrapper.get('[name=title]').element as HTMLInputElement).value).toBe('')
    expect(fresh.wrapper.find('.editor-draft-status').exists()).toBe(false)
    await fresh.wrapper.get('[name=title]').setValue('新的谜题')
    expect(fresh.wrapper.get('.editor-draft-status').text()).toContain('草稿已保存到此浏览器')
    expect(fresh.wrapper.get('.editor-draft-status button').text()).toBe('清除草稿')
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY)!)
    expect(saved.title).toBe('新的谜题')
    expect(saved.id).not.toBe(game.id)
    expect(saved.ending).toEqual({ culpritId: '', reveal: '' })
  })

  it('groups a failed save with the draft clearing action', async () => {
    const { wrapper } = page()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    await wrapper.get('[name=title]').setValue('未保存的故事')
    expect(wrapper.get('.editor-draft-status [role=status]').text()).toBe('草稿未能保存，请勿关闭页面')
    expect(wrapper.get('.editor-draft-status button').text()).toBe('清除草稿')
  })

  it('preserves the current case if browser storage refuses draft removal', async () => {
    const { wrapper, click } = page(game)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
    await click('清除草稿')
    await click('确认清除')
    expect(wrapper.get('dialog').text()).toContain('无法清除本地草稿')
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!)).toEqual(game)
    await wrapper.get('[aria-label=关闭]').trigger('click')
    expect((wrapper.get('[name=title]').element as HTMLInputElement).value).toBe(game.title)
  })

  it('keeps header departure disabled while a share snapshot is being encoded', async () => {
    let finish: (url: string) => void = () => {}
    vi.spyOn(sharing, 'encodeGameLink').mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    const { wrapper } = page(game)
    const share = wrapper.findAll('button').find((button) => button.text() === '分享案件')!
    await share.trigger('click')
    expect(wrapper.get('.lie-product-header__actions button').attributes('disabled')).toBeDefined()
    expect(wrapper.get('.editor-draft-status button').attributes('disabled')).toBeDefined()
    await wrapper.get('.lie-product-header__brand').trigger('click')
    expect(wrapper.emitted('leave')).toBeUndefined()
    finish('https://lie.example/play#game=encoded')
    await flushPromises()
    await wrapper.get('[aria-label=关闭]').trigger('click')
    await wrapper.get('.lie-product-header__brand').trigger('click')
    expect(wrapper.emitted('leave')).toHaveLength(1)
  })

  it('freely switches steps and characters while autosaving incomplete text', async () => {
    const { wrapper, step, click } = page()
    await wrapper.get('[name=title]').setValue('我的小谜题')
    await step(2)
    await wrapper.get('[name=reveal]').setValue('先写真相')
    await step(1)
    await wrapper.get('[data-field=name]').setValue('小林')
    await wrapper.get('[data-field=profile]').setValue('人物文字')
    await click('＋添加人物')
    expect(document.activeElement).toBe(wrapper.get('[data-field=name]').element)
    await wrapper.get('[data-field=name]').setValue('小周')
    await wrapper.findAll('.character-card')[0].trigger('click')
    expect(wrapper.findAllComponents(CharacterChoice)).toHaveLength(2)
    expect(wrapper.findAllComponents(CharacterChoice)[0].props('selected')).toBe(true)
    expect((wrapper.get('[data-field=profile]').element as HTMLTextAreaElement).value).toBe('人物文字')
    await step(0)
    expect((wrapper.get('[name=title]').element as HTMLInputElement).value).toBe('我的小谜题')
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).ending.reveal).toBe('先写真相')
    wrapper.unmount()
    const restored = page()
    expect(restored.wrapper.text()).toContain('已恢复')
    await restored.step(2)
    expect((restored.wrapper.get('[name=reveal]').element as HTMLTextAreaElement).value).toBe('先写真相')
  })

  it('uses one global answer checkbox and a read-only ending summary', async () => {
    const { wrapper, step } = page(game)
    await step(1)
    expect((wrapper.get('[data-field=answer]').element as HTMLInputElement).checked).toBe(true)
    await wrapper.findAll('.character-card')[1].trigger('click')
    await wrapper.get('[data-field=answer]').setValue(true)
    await wrapper.findAll('.character-card')[0].trigger('click')
    expect((wrapper.get('[data-field=answer]').element as HTMLInputElement).checked).toBe(false)
    await step(2)
    expect(wrapper.get('.answer-summary strong').text()).toBe('乙')
    expect(wrapper.findAll('.answer-summary')).toHaveLength(1)
    await step(1)
    await wrapper.findAll('.character-card')[1].trigger('click')
    await wrapper.get('[data-field=answer]').setValue(false)
    await step(2)
    expect(wrapper.get('.answer-empty').text()).toContain('还没有选定')
  })

  it('confirms deletion, selects a neighbor and clears the deleted answer', async () => {
    const { wrapper, step, click } = page(game)
    await step(1)
    expect(wrapper.get('.editor-character-stage .delete-button').attributes('aria-label')).toBe('删除甲')
    await click('删除人物'); await click('保留人物')
    expect(wrapper.findAll('.character-card')).toHaveLength(2)
    await click('删除人物'); await click('确认删除')
    expect(wrapper.findAll('.character-card')).toHaveLength(1)
    expect((wrapper.get('[data-field=name]').element as HTMLInputElement).value).toBe('乙')
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).ending.culpritId).toBe('')
    await click('删除人物'); await click('确认删除')
    expect(wrapper.get('.no-characters').text()).toContain('添加第一位人物')
  })

  it('locates cross-step validation and keeps the issue list current as fields are fixed', async () => {
    const { wrapper, step, click } = page()
    await step(2); await click('试玩')
    expect(document.activeElement).toBe(wrapper.get('[data-field=title]').element)
    await wrapper.get('[name=title]').setValue('新案件')
    expect(wrapper.get('.error-summary').text()).not.toContain('请填写案件标题')
    const profileIssue = wrapper.findAll('.error-summary button').find((button) => button.text().includes('人物设定'))!
    await profileIssue.trigger('click'); await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('[data-field=profile]').element)
    await wrapper.get('[data-field=profile]').setValue('你叫小林。')
    expect(wrapper.get('.error-summary').text()).not.toContain('人物设定')
  })

  it.each([null, 'removed-preset'])('preserves restored content with characterPreset %s and locates the selection', async (appearanceId) => {
    const stored = { ...game, characters: game.characters.map((person, index) => ({ ...person, appearanceId: index === 1 ? appearanceId : characterPreset.id })) }
    const { wrapper, click } = page(stored)
    await click('分享案件')
    expect((wrapper.get('[data-field=name]').element as HTMLInputElement).value).toBe('乙')
    expect(document.activeElement).toBe(wrapper.get('[data-field=preset]').element)
    expect((wrapper.get('[data-field=profile]').element as HTMLTextAreaElement).value).toBe('只属于乙的秘密。')
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).characters[1].appearanceId).toBe(appearanceId)
    await wrapper.get('[data-field=preset]').trigger('click')
    expect(wrapper.findAll('.editor-preset')).toHaveLength(1)
    await click('新来的向导')
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).characters[1].appearanceId).toBe(characterPreset.id)
  })

  it('uses the shared idle portrait and preserves a static fallback', async () => {
    const { wrapper, step } = page(game)
    await step(1)
    expect(wrapper.getComponent(AnimatedPortrait).props()).toMatchObject({ src: null, state: 'default', label: '甲' })
    expect(wrapper.get('.portrait-halo img').attributes('src')).toBe('/portrait.png')
    await wrapper.setProps({ characterPresets: [{ ...characterPreset, animation: '/appearances/new-guide/animation/package.json' }] })
    expect(wrapper.getComponent(AnimatedPortrait).props('src')).toBe('/appearances/new-guide/animation/package.json')
  })

  it('shows a full second-person example without replacing authored text', async () => {
    const { wrapper, step, click } = page(game)
    await step(1); await click('看完整示例')
    expect(wrapper.get('.example-text').text()).toContain('舞台左侧的蓝色抽屉')
    expect(wrapper.get('.example-text').text()).toContain('你只说自己亲历的事')
    await wrapper.get('[aria-label=关闭]').trigger('click')
    expect((wrapper.get('[data-field=profile]').element as HTMLTextAreaElement).value).toBe('只属于甲的秘密。')
  })

  it('emits an independent validated snapshot through the existing preview contract', async () => {
    const { wrapper, click } = page(game)
    await click('试玩')
    expect(wrapper.emitted('preview')?.[0]).toEqual([game])
    await wrapper.get('[name=title]').setValue('改名')
    expect((wrapper.emitted('preview')![0][0] as typeof game).title).toBe(game.title)
  })

  it('puts share, trial and manual contribution on the final step and prepares a short GitHub link', async () => {
    const { wrapper, step, click } = page(game)
    await step(2)
    expect(wrapper.get('.final-actions .lie-button--primary').text()).toBe('分享案件')
    expect(wrapper.get('.final-actions .lie-button--secondary').text()).toBe('试玩')
    await click('投稿给官方')
    expect(wrapper.get('dialog').text()).toContain('fork 仓库')
    expect(wrapper.get('dialog').text()).toContain('发起 Pull Request')
    expect(wrapper.get('dialog').text()).toContain('不会自动创建 PR')
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(null) } })
    await click('复制 JSON')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith((wrapper.get('dialog textarea').element as HTMLTextAreaElement).value)
    expect(wrapper.get('dialog').text()).toContain('已复制')
    const exported = JSON.parse((wrapper.get('dialog textarea').element as HTMLTextAreaElement).value)
    expect(exported).toEqual(game)
    const link = new URL(wrapper.get('.github-link').attributes('href')!)
    expect(link.searchParams.get('filename')).toBe('content/games/test.json')
    expect([...link.searchParams.keys()]).toEqual(['filename'])
  })

  it('opens share with the generated URL and clears it after further editing', async () => {
    vi.spyOn(sharing, 'encodeGameLink').mockResolvedValue('https://lie.example/play#game=abc')
    const { wrapper, click } = page(game)
    await click('分享案件')
    expect((wrapper.get('dialog textarea').element as HTMLTextAreaElement).value).toBe('https://lie.example/play#game=abc')
    await wrapper.get('[aria-label=关闭]').trigger('click')
    await wrapper.get('[name=title]').setValue('改了')
    await click('分享案件')
    expect(sharing.encodeGameLink).toHaveBeenLastCalledWith(expect.objectContaining({ title: '改了' }), location.origin)
  })

  it.each([['share', false], ['share', true], ['same-share', false], ['submission', false]])('ignores an old copy completion in a reopened %s dialog (reject=%s)', async (next, reject) => {
    vi.spyOn(sharing, 'encodeGameLink').mockImplementation(async (game) => `https://lie.example/play#${game.title}`)
    let complete!: () => void
    const writeText = vi.fn().mockResolvedValue(null).mockImplementationOnce(() => new Promise<void>((resolve, fail) => { complete = () => reject ? fail(new Error('old denied')) : resolve() }))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const { wrapper, click, step } = page(game)
    await click('分享案件')
    const original = (wrapper.get('dialog textarea').element as HTMLTextAreaElement).value
    await click('复制分享链接')
    await wrapper.get('[aria-label=关闭]').trigger('click')
    if (next !== 'same-share') await wrapper.get('[name=title]').setValue('新内容')
    if (next === 'submission') { await step(2); await click('投稿给官方') }
    else await click('分享案件')
    complete(); await flushPromises()
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith(original)
    expect(wrapper.get('dialog').text()).not.toContain('已复制')
    expect(wrapper.get('dialog').text()).not.toContain('无法自动复制')
    await click(next === 'submission' ? '复制 JSON' : '复制分享链接')
    expect(writeText).toHaveBeenLastCalledWith((wrapper.get('dialog textarea').element as HTMLTextAreaElement).value)
    expect(wrapper.get('dialog').text()).toContain('已复制')
  })

  it('leaves a damaged draft untouched until editing starts', async () => {
    localStorage.setItem(DRAFT_KEY, 'damaged')
    const { wrapper } = page()
    expect(wrapper.get('.editor-draft-status [role=status]').text()).toBe('本地草稿无法读取')
    expect(wrapper.get('.editor-draft-status button').text()).toBe('清除草稿')
    expect(localStorage.getItem(DRAFT_KEY)).toBe('damaged')
    await wrapper.get('[name=title]').setValue('新故事')
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!).title).toBe('新故事')
  })

  it('uses live accessible names on image-only preset choices', async () => {
    const { wrapper, step } = page()
    await step(1); await wrapper.get('[data-field=preset]').trigger('click')
    expect(wrapper.get('.editor-preset').attributes('aria-label')).toBe('新来的向导')
    expect(wrapper.get('.editor-preset').text()).toBe('')
    expect(wrapper.get('.editor-preset img').attributes('src')).toBe(characterPreset.avatar)
    expect(wrapper.get('.editor-preset').attributes('aria-pressed')).toBe('true')
    await wrapper.setProps({ characterPresets: [{ ...characterPreset, name: '来自清单的新名字' }] })
    expect(wrapper.get('.editor-preset').attributes('aria-label')).toBe('来自清单的新名字')
    await wrapper.get('[aria-label=关闭]').trigger('click')
    expect(wrapper.get('[data-field=preset]').text()).toBe('更换预设')
  })
})
