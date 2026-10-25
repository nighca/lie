import { Blob } from 'node:buffer'
import { TextDecoder, TextEncoder } from 'node:util'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { appendDialogue, createGameSession, selectCharacter, startSession } from '@lie/game-core'
import Editor from '../../../apps/web/src/editor/Editor.vue'
import { createRemixDraft, DRAFT_KEY, loadDraft } from '../../../apps/web/src/editor/draft'
import { decodeSharedGame, encodeGameLink } from '../../../apps/web/src/editor/share'
import { game as source } from '../../../apps/web/test/helpers'

Object.assign(globalThis, { Blob, TextDecoder, TextEncoder })
const preset = { id: 'blue', name: '蓝衣', avatar: '/a.png', portrait: '/p.png', accent: '#123456', voiceId: null, animation: null, portraits: { listening: null, waiting: null, speaking: null } }
const game = { ...source, characters: source.characters.map(c => ({ ...c, appearanceId: 'blue' })) }
const cleanup: (() => void)[] = []
beforeEach(() => { localStorage.clear(); vi.stubGlobal('fetch', vi.fn(() => { throw Error('No network in review') })) })
afterEach(() => { cleanup.splice(0).forEach(f => f()); expect(fetch).not.toHaveBeenCalled(); localStorage.clear(); vi.unstubAllGlobals() })

it('CB01: entering finite 1e308 minutes writes an unrestorable null duration and discards saved author text after remount', async () => {
  const draft = createRemixDraft(game); draft.title = 'saved story must survive invalid duration'
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  const first = mount(Editor, { props: { characterPresets: [preset] } }); cleanup.push(() => first.unmount())
  await first.get('input[name=duration]').setValue('1e308')
  const saved = JSON.parse(localStorage.getItem(DRAFT_KEY)!)
  expect(saved.interrogationLimitSeconds).toBeNull()
  expect(first.text()).toContain('草稿已保存至此设备')
  expect(() => loadDraft(localStorage)).toThrow('草稿无法读取')
  const fresh = mount(Editor, { props: { characterPresets: [preset] } }); cleanup.push(() => fresh.unmount())
  expect((fresh.get('input[name=title]').element as HTMLInputElement).value).toBe('')
  expect(fresh.text()).toContain('本地草稿无法读取')
})

it('CB02: valid prototype-like role IDs survive fragment normalization and core history writes without prototype pollution', async () => {
  const ids = ['__proto__', 'constructor']
  const content = JSON.parse(JSON.stringify({ ...game, characters: game.characters.map((c, i) => ({ ...c, id: ids[i], extraAsset: 'https://untrusted.invalid/image.svg' })), ending: { ...game.ending, culpritId: ids[0] } }))
  const url = await encodeGameLink(content, 'https://example.invalid')
  const restored = await decodeSharedGame(new URL(url).hash, [preset])
  expect(restored.characters.every(c => !Object.hasOwn(c, 'extraAsset'))).toBe(true)
  let session = startSession(createGameSession(restored, { sessionId: 'review', now: 0 }), 0)
  session = appendDialogue(session, ids[0], { id: 'one', role: 'user', text: 'only A', at: 0, interrupted: false })
  session = selectCharacter(session, ids[1])
  session = appendDialogue(session, ids[1], { id: 'two', role: 'user', text: 'only B', at: 0, interrupted: false })
  expect(session.histories[ids[0]].map(e => e.text)).toEqual(['only A'])
  expect(session.histories[ids[1]].map(e => e.text)).toEqual(['only B'])
  expect(Object.hasOwn(Object.prototype, 'one')).toBe(false)
})

it('CB03: gzip-valid invalid UTF8 is rejected without touching an unrelated saved draft', async () => {
  const original = JSON.stringify(createRemixDraft(game)); localStorage.setItem(DRAFT_KEY, original)
  const bytes = new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d])
  const compressed = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()
  const hash = `#game=${Buffer.from(compressed).toString('base64url')}`
  await expect(decodeSharedGame(hash, [preset])).rejects.toThrow('不完整或已损坏')
  expect(localStorage.getItem(DRAFT_KEY)).toBe(original)
})
