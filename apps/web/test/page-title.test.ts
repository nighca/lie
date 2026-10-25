import { readFileSync } from 'node:fs'
import { effectScope, nextTick, reactive, ref, shallowRef } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { afterEach, describe, expect, it } from 'vitest'

import { createGameController, type GameController } from '../src/application/controller'
import { BRAND_TITLE, getPageTitle, usePageTitle } from '../src/application/pageTitle'
import { game, setup } from './helpers'

const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach((action) => action()))
function title(path: string, phase: 'intro' | 'interrogating' | 'solved' | 'lost' | 'ended' | 'loading' | 'failed' | null, hasGame = true, shareFailed = false) {
  return getPageTitle({ path, hasGame, game: phase == null ? null : { phase, title: '公开案件名' }, shareFailed })
}
function binding(path = '/', query: RouteLocationNormalizedLoaded['query'] = {}) {
  const route = reactive({ path, query })
  const controller = shallowRef<GameController | null>(null)
  const error = ref<string | null>(null)
  const page = { title: '' }
  const scope = effectScope()
  scope.run(() => usePageTitle(route, controller, error, page))
  cleanup.push(() => scope.stop())
  return { route, controller, error, page, scope }
}

describe('page titles', () => {
  it('uses the formal brand before JavaScript is loaded', () => {
    expect(readFileSync('index.html', 'utf8')).toContain(`<title>${BRAND_TITLE}</title>`)
  })
  it.each(['/', '/unknown-route'])('names the rendered home at %s without using query text', (path) => {
    expect(title(path, null, false)).toBe(`首页 · ${BRAND_TITLE}`)
    expect(title(path, 'failed')).toBe(`案件无法打开 · ${BRAND_TITLE}`)
  })
  it('gives the editor a stable title regardless of cached game or untrusted query', () => {
    expect(title('/editor', 'solved')).toBe(`创作案件 · ${BRAND_TITLE}`)
  })
  it.each([
    ['/', null, '正在加载案件'], ['/', 'loading', '正在加载案件'], ['/', 'failed', '案件无法打开'],
    ['/editor/preview', null, '正在准备试玩'], ['/editor/preview', 'failed', '试玩无法打开'],
    ['/play', null, '正在打开分享案件'], ['/play', 'failed', '分享案件无法打开'],
  ] as const)('describes pending or unavailable content at %s (%s)', (path, phase, label) => {
    expect(title(path, phase)).toBe(`${label} · ${BRAND_TITLE}`)
  })
  it('reports decode failure without exposing an old case name', () => {
    expect(title('/play', 'intro', false, true)).toBe(`分享案件无法打开 · ${BRAND_TITLE}`)
  })
  it.each([
    ['intro', '案件介绍'], ['interrogating', '正在调查'], ['solved', '指认正确'], ['lost', '指认不正确'], ['ended', '本局已结束'],
  ] as const)('reflects %s for official, preview and shared cases using only public title', (phase, label) => {
    expect(title('/', phase)).toBe(`${label} · 公开案件名 · ${BRAND_TITLE}`)
    expect(title('/editor/preview', phase)).toBe(`试玩 · ${label} · 公开案件名 · ${BRAND_TITLE}`)
    expect(title('/play', phase)).toBe(`分享案件 · ${label} · 公开案件名 · ${BRAND_TITLE}`)
  })
  it('tracks phases and stops subscribing when its scope is disposed', async () => {
    const state = binding('/', { game: 'not-used-as-title' })
    const { controller, turns } = setup()
    cleanup.push(() => controller.dispose())
    state.controller.value = controller
    await controller.load('test'); await nextTick()
    expect(state.page.title).toBe(`案件介绍 · ${game.title} · ${BRAND_TITLE}`)
    controller.start(); await nextTick()
    expect(state.page.title).toContain('正在调查')
    controller.openAccusation(); controller.accuse('two'); await nextTick()
    expect(state.page.title).toContain('指认不正确')
    expect(state.page.title).not.toContain(game.ending.reveal)
    expect(state.page.title).not.toContain(game.characters[0].profile)
    expect(turns).toHaveLength(0)
    state.scope.stop()
    const previous = state.page.title
    controller.restart(); await nextTick()
    expect(state.page.title).toBe(previous)
  })
  it('does not rewrite the same title for unrelated controller publications', async () => {
    const state = binding('/', { game: 'test' })
    const { controller } = setup()
    cleanup.push(() => controller.dispose())
    state.controller.value = controller
    await controller.load('test'); await nextTick()
    const writes: string[] = []
    Object.defineProperty(state.page, 'title', { configurable: true, set(value: string) { writes.push(value) } })
    controller.start(); await nextTick()
    controller.openAccusation(); await nextTick()
    expect(writes).toEqual([`正在调查 · ${game.title} · ${BRAND_TITLE}`])
  })
  it('ignores old controller loads completing after route and controller replacement', async () => {
    const state = binding('/', { game: '<untrusted query>' })
    let release!: (game: unknown) => void
    const old = createGameController({ readGame: () => new Promise((resolve) => { release = resolve }), voice: { create() { throw new Error('No voice') } }, now: () => 0, newSessionId: () => 'test' })
    cleanup.push(() => old.dispose())
    state.controller.value = old
    const loading = old.load('test')
    await nextTick()
    expect(state.page.title).toBe(`正在加载案件 · ${BRAND_TITLE}`)
    state.route.path = '/editor'
    state.controller.value = null
    await nextTick()
    release(game); await loading; await nextTick()
    expect(state.page.title).toBe(`创作案件 · ${BRAND_TITLE}`)
    state.route.path = '/play'; state.route.query = {}; state.error.value = 'invalid #fragment-private'; await nextTick()
    expect(state.page.title).toBe(`分享案件无法打开 · ${BRAND_TITLE}`)
  })
})
