<script setup lang="ts">
import { KeepAlive, nextTick, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ProductHeader, UiButton, UiDialog } from '@lie/ui'
import type { GameDefinition } from '@lie/game-core'

import App from './App.vue'
import PageVersion from './PageVersion.vue'
import Editor from './editor/Editor.vue'
import { createRemixDraft, DRAFT_KEY, saveDraft, type EditorDraft } from './editor/draft'
import { loadSharedGame, ShareError } from './editor/share'
import type { CaseSummary } from './application/catalog'
import type { GameController } from './application/controller'
import { observeNavigationLifecycle } from './application/navigationLifecycle'
import { usePageTitle } from './application/pageTitle'
import type { CharacterPreset } from './presentation/characterPresets'
import type { PresetLoadStatus } from './presentation/characterPresetLoader'

const props = defineProps<{ createController: (game: GameDefinition | null) => GameController; catalog: readonly CaseSummary[]; characterPresets: readonly CharacterPreset[]; presetStatus?: PresetLoadStatus; loadCharacterPresets?: () => Promise<readonly CharacterPreset[] | null>; demo: boolean }>()
const pageBuild = import.meta.env.DEV ? null : import.meta.env.LIE_PAGE_BUILD
const versionOpen = ref(false)
let versionTrigger: HTMLElement | null = null
function showVersion(trigger: HTMLElement) { versionTrigger = trigger; versionOpen.value = true }
async function closeVersion() {
  versionOpen.value = false
  await nextTick()
  versionTrigger?.focus()
  versionTrigger = null
}
const route = useRoute()
const router = useRouter()
const controller = shallowRef<GameController | null>(null)
const instance = ref(0)
const editorRevision = ref(0)
const confirmation = ref(false)
const shareLoading = ref(false)
const shareError = ref<string | null>(null)
const shareRetryable = ref(true)
const remixOpen = ref(false)
const remixError = ref<string | null>(null)
const remixChanged = ref(false)
let pendingRemix: EditorDraft | null = null
let observedDraft: string | null = null
let draftRead = false
let previewGame: GameDefinition | null = null
let revision = 0
let resolveConfirmation: ((answer: boolean) => void) | null = null
let unsubscribe: (() => void) | null = null
const lifecycle = observeNavigationLifecycle(() => controller.value, leavePage, loadCurrent, document, window)
function gameId() { return typeof route.query.game === 'string' ? route.query.game : route.query.game == null ? null : '' }
function leavePage() { previewGame = null; discard() }
function discard() {
  revision++
  shareLoading.value = false
  shareError.value = null
  shareRetryable.value = true
  answer(false)
  cancelRemix()
  unsubscribe?.()
  unsubscribe = null
  controller.value?.dispose()
  controller.value = null
  lifecycle.sync()
}
function attach(gameId: string, game: GameDefinition | null) {
  const next = props.createController(game)
  controller.value = next
  instance.value += 1
  unsubscribe = next.subscribe(() => lifecycle.sync())
  void next.load(gameId)
}
async function loadCurrent() {
  discard()
  if (route.path !== '/editor/preview') previewGame = null
  if (route.path === '/editor') { void props.loadCharacterPresets?.(); return }
  if (route.path === '/editor/preview') {
    if (previewGame == null) { void router.replace({ path: '/editor', query: demoQuery() }); return }
    attach(previewGame.id, previewGame)
    return
  }
  if (route.path === '/play') {
    const currentRevision = revision
    shareLoading.value = true
    try {
      const presets = props.loadCharacterPresets == null ? props.characterPresets : await props.loadCharacterPresets()
      if (revision !== currentRevision) return
      if (presets == null) throw new Error('人物预设加载失败，请重试')
      const game = await loadSharedGame(new URL(route.fullPath, window.location.origin), presets)
      if (revision !== currentRevision) return
      shareLoading.value = false
      attach(game.id, game)
    } catch (error) {
      if (revision !== currentRevision) return
      shareLoading.value = false
      shareError.value = error instanceof Error ? error.message : '分享案件暂时无法打开'
      shareRetryable.value = !(error instanceof ShareError) || error.retryable
    }
    return
  }
  const id = gameId()
  if (id != null) attach(id, null)
}
function confirmLeave(): Promise<boolean> {
  if (controller.value?.getView().phase !== 'interrogating') return Promise.resolve(true)
  if (resolveConfirmation != null) return Promise.resolve(false)
  confirmation.value = true
  return new Promise((resolve) => { resolveConfirmation = resolve })
}
function answer(value: boolean) {
  confirmation.value = false
  const resolve = resolveConfirmation
  resolveConfirmation = null
  resolve?.(value)
}
const removeGuard = router.beforeEach(async (to, from) => {
  if (to.fullPath === from.fullPath) return true
  return confirmLeave()
})
function demoQuery() { return props.demo ? { demo: '1' } : {} }
function home() { void router.push({ path: '/', query: demoQuery() }) }
function editor() { void router.push({ path: '/editor', query: demoQuery() }) }
function returnFromGame() { if (route.path === '/editor/preview') editor(); else home() }
function preview(game: GameDefinition) {
  previewGame = game
  void router.push({ path: '/editor/preview', query: demoQuery() })
}
function cancelRemix() {
  remixOpen.value = false
  remixError.value = null
  remixChanged.value = false
  pendingRemix = null
  observedDraft = null
  draftRead = false
}
function remix() {
  if (route.path === '/editor/preview') return
  const source = controller.value?.getRemixSource()
  if (source == null) return
  pendingRemix = createRemixDraft(source)
  remixOpen.value = true
  checkRemix(false)
}
function checkRemix(replace: boolean) {
  if (pendingRemix == null) return
  let raw: string | null
  try { raw = localStorage.getItem(DRAFT_KEY) }
  catch {
    draftRead = false
    remixError.value = '无法读取此浏览器的草稿，请重试。当前案件尚未改编。'
    return
  }
  remixError.value = null
  const changed = draftRead && raw !== observedDraft
  const canSave = !changed && (raw == null || (replace && draftRead))
  observedDraft = raw
  draftRead = true
  remixChanged.value = changed
  if (!canSave) return
  try { saveDraft(localStorage, pendingRemix) }
  catch {
    remixError.value = '无法保存改编草稿，请重试。当前案件尚未改编。'
    return
  }
  cancelRemix()
  editorRevision.value++
  editor()
}
function selectCase(id: string) { void router.push({ path: '/', query: { game: id, ...(props.demo ? { demo: '1' } : {}) } }) }
async function end() { if (await confirmLeave()) controller.value?.end() }
function avatar(id: string | null) { return props.characterPresets.find((item) => item.id === id)?.avatar ?? null }
const brokenAvatars = ref(new Set<string>())

watch(() => route.fullPath, loadCurrent, { immediate: true })
usePageTitle(route, controller, shareError)
onUnmounted(() => { answer(false); removeGuard(); lifecycle.dispose(); discard() })
</script>

<template>
  <KeepAlive v-if="route.path === '/editor' || route.path === '/editor/preview'" :max="1">
    <Editor v-if="route.path === '/editor'" :key="editorRevision" :character-presets="characterPresets" :preset-status="presetStatus" @show-version="showVersion" @retry-presets="loadCharacterPresets?.()" @preview="preview" @leave="home" />
  </KeepAlive>
  <App v-if="controller != null" :key="instance" :controller="controller" :character-presets="characterPresets" :demo="demo" :allow-remix="route.path !== '/editor/preview'" :return-label="route.path === '/editor/preview' ? '返回编辑器' : '返回案件列表'" @show-version="showVersion" @navigate-home="returnFromGame" @request-end="end" @retry="loadCurrent" @remix="remix" />
  <div v-else-if="shareLoading || shareError != null" class="game-shell">
    <ProductHeader @navigate-home="home" @show-version="showVersion"><template #actions><UiButton variant="quiet" @click="home">返回首页</UiButton></template></ProductHeader>
    <main class="intro-card surface share-state-card"><span v-if="shareLoading" class="share-loading-ring" aria-hidden="true"></span><span v-else class="share-question" aria-hidden="true">?</span><h1>{{ shareLoading ? '正在打开分享案件…' : '分享案件无法打开' }}</h1><p v-if="shareError != null" role="status">{{ shareError }}</p><div v-if="shareError != null" class="share-state-actions"><UiButton v-if="shareRetryable" @click="loadCurrent">重试</UiButton><UiButton :variant="shareRetryable ? 'secondary' : 'primary'" @click="home">返回首页</UiButton></div></main>
  </div>
  <div v-else-if="route.path !== '/editor' && route.path !== '/editor/preview'" class="game-shell home-shell">
    <ProductHeader class="home-header" @navigate-home="home" @show-version="showVersion">
      <template #actions><UiButton variant="quiet" @click="editor">创作案件</UiButton><a class="home-github" href="https://github.com/nighca/lie" target="_blank" rel="noopener noreferrer" aria-label="在新标签页打开 LIE GitHub 仓库">GitHub <span aria-hidden="true">↗</span></a></template>
      <template v-if="demo" #notice><p>演示模式 · 对话为模拟内容，不使用麦克风</p></template>
    </ProductHeader>
    <main class="home-content">
      <section class="home-intro" aria-label="产品介绍">
        <h1>有人在说谎</h1>
        <p>和角色语音对话，<br>找出藏起真相的人。</p>
        <div class="home-cast" aria-hidden="true">
          <div class="home-cast-art">
            <div class="home-cast-backdrop"></div>
            <img class="home-cast-sunny" src="/appearances/sunny-moustache/avatar.png" alt="">
            <img class="home-cast-coral" src="/appearances/coral-bob/avatar.png" alt="">
            <img class="home-cast-blue" src="/appearances/blue-glasses/avatar.png" alt="">
            <span class="home-spark first">✦</span><span class="home-spark second">✦</span>
          </div>
        </div>
        <ol class="flow-hint home-flow" aria-label="调查流程"><li>开口问话</li><li>对照说法</li><li>最终指认</li></ol>
      </section>
      <section class="home-cases" aria-labelledby="cases-title"><h2 id="cases-title">选择案件</h2>
        <p v-if="catalog.length === 0">新案件正在准备中。</p>
        <div v-else class="case-grid">
          <article v-for="(item, index) in catalog" :key="item.id" class="surface case-card">
            <div class="case-top"><span class="case-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><div class="case-cast" role="img" :aria-label="`${item.characters.length}位角色：${item.characters.map((person) => person.name).join('、')}`">
              <span class="case-cast__avatars" aria-hidden="true"><span v-for="(person, personIndex) in item.characters" :key="personIndex" class="case-cast__avatar"><img v-if="avatar(person.appearanceId) != null && !brokenAvatars.has(avatar(person.appearanceId)!)" :src="avatar(person.appearanceId)!" alt="" @error="brokenAvatars.add(avatar(person.appearanceId)!)"><span v-else>{{ person.name.slice(0, 1) }}</span></span></span>
              <span aria-hidden="true">{{ item.characters.length }}位角色</span>
            </div></div>
            <h3>{{ item.title }}</h3><p>{{ item.summary }}</p>
            <UiButton @click="selectCase(item.id)">查看案件</UiButton>
          </article>
        </div>
      </section>
    </main>
  </div>
  <PageVersion :open="versionOpen" :build="pageBuild" @close="closeVersion" />
  <UiDialog :open="remixOpen" title="改编案件" @close="cancelRemix">
    <p>改编会打开完整案件，包括答案、结局和人物设定。</p>
    <p>此浏览器如有草稿，继续将替换它，无法撤销。选择“保留草稿”可取消改编。</p>
    <p v-if="remixChanged" role="status">草稿刚刚发生了变化，请再次确认是否替换。</p>
    <p v-if="remixError != null" role="alert">{{ remixError }}</p>
    <template #actions><UiButton variant="secondary" @click="cancelRemix">保留草稿</UiButton><UiButton @click="checkRemix(true)">{{ remixError != null ? '重试' : '替换草稿并改编' }}</UiButton></template>
  </UiDialog>
  <UiDialog class="leave-confirmation" :open="confirmation" title="结束这次调查？" @close="answer(false)"><p>离开会结束本局，调查进度不会保留。</p><template #actions><UiButton variant="secondary" @click="answer(false)">继续调查</UiButton><UiButton @click="answer(true)">确认结束</UiButton></template></UiDialog>
</template>

<style scoped>
.home-header :deep(.lie-product-header__actions) { gap: 12px; }
.home-github { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: 44px; padding: 8px 10px; border-radius: 10px; color: var(--lie-ink); font-size: 15px; font-weight: 650; text-decoration: none; white-space: nowrap; }
.home-github:hover { background: #111b450b; text-decoration: underline; text-underline-offset: 4px; }
.home-github:focus-visible { outline: 3px solid var(--lie-primary); outline-offset: 3px; }
.home-github > span { font-size: 16px; }
@media (max-width: 700px) { .home-header :deep(.lie-product-header__actions) { gap: 10px; } .home-github { padding: 6px 4px; font-size: 14px; } }

.share-state-card { min-height: 370px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.share-state-card h1 { font-size: 28px; margin: 22px 0 0; }
.share-state-card p { color: var(--lie-muted); margin: 16px 0 24px; }
.share-state-actions { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
.share-loading-ring { width: 42px; height: 42px; border: 4px solid #d7e4ff; border-top-color: var(--lie-primary); border-radius: 50%; animation: share-spin 1s linear infinite; }
.share-question { width: 66px; height: 66px; border: 2px solid var(--lie-ink); border-radius: 23px; background: var(--lie-aqua); display: grid; place-items: center; font-size: 40px; font-weight: 800; transform: rotate(-7deg); box-shadow: 0 4px 0 #111b451a; }
@keyframes share-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .share-loading-ring { animation: none; } }
@media (max-width: 670px) { .share-state-card { padding: 28px 18px; }.share-state-card h1 { font-size: 24px; } }
</style>
