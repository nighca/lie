import { shallowRef, watch, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import type { GameController, GameView } from './controller'

export const BRAND_TITLE = 'LIE · 语音推理'
interface PageTitleContext {
  path: string
  hasGame: boolean
  game: Pick<GameView, 'phase' | 'title'> | null
  shareFailed: boolean
}
const phases = { intro: '案件介绍', interrogating: '正在调查', solved: '指认正确', lost: '指认不正确', ended: '本局已结束' }
export function getPageTitle({ path, hasGame, game, shareFailed }: PageTitleContext): string {
  if (path === '/editor') return `创作案件 · ${BRAND_TITLE}`
  const mode = path === '/editor/preview' ? '试玩' : path === '/play' ? '分享案件' : null
  if (mode == null && !hasGame) return `首页 · ${BRAND_TITLE}`
  if (path === '/play' && shareFailed) return `分享案件无法打开 · ${BRAND_TITLE}`
  if (game?.phase === 'failed') return `${mode ?? '案件'}无法打开 · ${BRAND_TITLE}`
  if (game == null || game.phase === 'loading') return `${mode === '试玩' ? '正在准备试玩' : mode === '分享案件' ? '正在打开分享案件' : '正在加载案件'} · ${BRAND_TITLE}`
  return [mode, phases[game.phase], game.title, BRAND_TITLE].filter((part) => part != null).join(' · ')
}

export function usePageTitle(route: Pick<RouteLocationNormalizedLoaded, 'path' | 'query'>, controller: Readonly<Ref<GameController | null>>, shareError: Readonly<Ref<string | null>>, page: Pick<Document, 'title'> = document) {
  const game = shallowRef<GameView | null>(null)
  watch(controller, (current, _, onCleanup) => {
    game.value = current?.getView() ?? null
    if (current != null) onCleanup(current.subscribe((view) => { game.value = view }))
  }, { immediate: true, flush: 'sync' })
  watch(() => getPageTitle({ path: route.path, hasGame: route.query.game != null, game: game.value, shareFailed: shareError.value != null }), (title) => { page.title = title }, { immediate: true })
}
