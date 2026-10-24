<script setup lang="ts">
import { onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UiButton, UiDialog } from '@lie/ui'

import App from './App.vue'
import type { CaseSummary } from './application/catalog'
import type { GameController } from './application/controller'
import { observeNavigationLifecycle } from './application/navigationLifecycle'
import type { Appearance } from './presentation/appearances'

const props = defineProps<{ createController: () => GameController; loadCatalog: () => Promise<CaseSummary[]>; appearances: readonly Appearance[]; demo: boolean }>()
const route = useRoute()
const router = useRouter()
const controller = shallowRef<GameController | null>(null)
const instance = ref(0)
const cases = ref<CaseSummary[]>([])
const catalogStatus = ref<'loading' | 'ready' | 'failed'>('loading')
const confirmation = ref(false)
let resolveConfirmation: ((answer: boolean) => void) | null = null
let unsubscribe: (() => void) | null = null
const lifecycle = observeNavigationLifecycle(() => controller.value, discard, loadCurrent, document, window)
function gameId() { return typeof route.query.game === 'string' ? route.query.game : route.query.game == null ? null : '' }
function discard() {
  answer(false)
  unsubscribe?.()
  unsubscribe = null
  controller.value?.dispose()
  controller.value = null
  lifecycle.sync()
}
function loadCurrent() {
  discard()
  const id = gameId()
  if (id == null) return
  const next = props.createController()
  controller.value = next
  instance.value += 1
  unsubscribe = next.subscribe(() => lifecycle.sync())
  void next.load(id)
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
function home() { void router.push({ path: '/', query: props.demo ? { demo: '1' } : {} }) }
function selectCase(id: string) { void router.push({ path: '/', query: { game: id, ...(props.demo ? { demo: '1' } : {}) } }) }
async function end() { if (await confirmLeave()) controller.value?.end() }
function duration(seconds: number) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}` }
async function loadCatalog() {
  catalogStatus.value = 'loading'
  try { cases.value = await props.loadCatalog(); catalogStatus.value = 'ready' }
  catch { catalogStatus.value = 'failed' }
}
watch(() => route.fullPath, loadCurrent, { immediate: true })
void loadCatalog()
onUnmounted(() => { answer(false); removeGuard(); lifecycle.dispose(); discard() })
</script>

<template>
  <App v-if="controller != null" :key="instance" :controller="controller" :appearances="appearances" :demo="demo" @navigate-home="home" @request-end="end" @retry="loadCurrent" />
  <div v-else class="game-shell home-shell">
    <header class="game-header"><a class="wordmark" href="/" aria-label="LIE 首页" @click.prevent="home"><img src="/brand/logo.svg" width="116" height="62" alt=""> <span>语音推理</span></a><p v-if="demo" class="environment-note">演示模式 · 对话为模拟内容，不使用麦克风</p></header>
    <main class="home-content">
      <section class="home-intro"><p class="eyebrow">开口聊聊，找到真相</p><h1>每个人，都有话没说完。</h1><p>和故事里的人物自由对话，听听他们的说法，再做出你的指认。</p></section>
      <section aria-labelledby="cases-title"><h2 id="cases-title">挑一桩谜题</h2>
        <p v-if="catalogStatus === 'loading'" role="status">正在准备案件…</p>
        <div v-else-if="catalogStatus === 'failed'" class="surface catalog-error"><p role="status">案件列表暂时无法加载</p><UiButton @click="loadCatalog">重试</UiButton></div>
        <p v-else-if="cases.length === 0">新案件正在准备中。</p>
        <div v-else class="case-grid"><article v-for="item in cases" :key="item.id" class="surface case-card"><span class="case-symbol" aria-hidden="true">？</span><h3>{{ item.title }}</h3><p>{{ item.summary }}</p><span class="case-duration">{{ duration(item.interrogationLimitSeconds) }} 询问时间</span><UiButton @click="selectCase(item.id)">查看案件</UiButton></article></div>
      </section>
    </main>
  </div>
  <UiDialog class="leave-confirmation" :open="confirmation" title="结束这次调查？" @close="answer(false)"><p>离开会结束本局，调查进度不会保留。</p><template #actions><UiButton variant="secondary" @click="answer(false)">继续调查</UiButton><UiButton @click="answer(true)">确认结束</UiButton></template></UiDialog>
</template>
