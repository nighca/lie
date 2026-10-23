<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { CharacterChoice, Transcript, UiButton, UiDialog, UiNotice, VoiceControl } from '@lie/ui'

import type { GameController } from './application/controller'
import type { Appearance } from './presentation/appearances'

const props = defineProps<{ controller: GameController; appearances: readonly Appearance[]; demo: boolean }>()
const view = ref(props.controller.getView())
const unsubscribe = props.controller.subscribe((value) => { view.value = value })
onUnmounted(unsubscribe)
const brokenImages = ref(new Set<string>())
const current = computed(() => view.value.characters.find((character) => character.id === view.value.currentCharacterId) ?? null)
const transcript = computed(() => view.value.history.map((entry) => ({ id: entry.id, speaker: entry.role === 'user' ? '你' : current.value?.name ?? '人物', text: entry.text, mine: entry.role === 'user' })))
const labels = { idle: '等待你开口', recording: '正在聆听', waiting: '等待回应', speaking: '正在说话', error: '语音暂时中断' }
const actionLabel = computed(() => {
  if (view.value.voiceStatus === 'recording') return props.demo ? '结束模拟发言' : '结束说话'
  if (view.value.voiceStatus === 'error') return '重试'
  if (view.value.voiceStatus === 'speaking' || view.value.voiceStatus === 'waiting') return props.demo ? '打断并模拟发言' : '打断并说话'
  return props.demo ? '模拟说话' : '开始说话'
})
function appearance(id: string | null) { return props.appearances.find((item) => item.id === id) ?? null }
function usableImage(url: string | null) { return url != null && !brokenImages.value.has(url) }
function speak() { if (view.value.voiceStatus === 'recording') props.controller.finishInput(); else void props.controller.startInput() }
</script>

<template>
  <div class="game-shell">
    <header class="game-header"><a class="wordmark" href="/" aria-label="LIE 首页">LiE <span>语音推理</span></a><div v-if="view.phase === 'interrogating'" class="header-actions"><UiButton variant="quiet" @click="controller.end()">结束本局</UiButton><UiButton @click="controller.openAccusation()">最终指认</UiButton></div></header>
    <p class="environment-note">{{ demo ? '开发演示 · 假数据，无真实 AI、麦克风或声音' : '开发预览 · 真实语音需配置服务网关，目前可能尚未接入' }} · 剧情为开发占位</p>

    <main v-if="view.phase === 'loading' || view.phase === 'failed'" class="intro-card surface"><h1>{{ view.phase === 'loading' ? '正在准备案件…' : '案件暂时无法加载' }}</h1><p role="status">{{ view.notice }}</p><p v-if="view.phase === 'failed'">请刷新页面重试。</p></main>

    <main v-else-if="view.phase === 'intro'" class="intro-card surface"><p class="eyebrow">一桩小谜题，几位有话说的人</p><h1>{{ view.title }}</h1><p class="background">{{ view.background }}</p><div class="intro-characters"><div v-for="character in view.characters" :key="character.id"><span v-if="usableImage(appearance(character.appearanceId)?.avatar ?? null)" class="avatar-frame"><img :src="appearance(character.appearanceId)!.avatar" alt="" @error="brokenImages.add(appearance(character.appearanceId)!.avatar)"></span><span v-else class="initial-avatar">{{ character.name.slice(0, 1) }}</span><strong>{{ character.name }}</strong></div></div><p class="flow-hint">开口问话 → 对照说法 → 最终指认</p><UiButton @click="controller.start()">接案，开始调查</UiButton></main>

    <main v-else-if="view.phase === 'interrogating'" class="investigation"><div class="case-heading"><p class="eyebrow">调查进行中</p><h1>{{ view.title }}</h1></div><div class="conversation-layout"><nav class="character-list" aria-label="选择询问人物"><CharacterChoice v-for="character in view.characters" :key="character.id" :name="character.name" :selected="view.currentCharacterId === character.id" @click="controller.selectCharacter(character.id)"><template #avatar><img v-if="usableImage(appearance(character.appearanceId)?.avatar ?? null)" :src="appearance(character.appearanceId)!.avatar" alt="" @error="brokenImages.add(appearance(character.appearanceId)!.avatar)"><span v-else>{{ character.name.slice(0, 1) }}</span></template></CharacterChoice></nav><section v-if="current != null" class="character-stage" :style="{ '--character-accent': appearance(current.appearanceId)?.accent ?? 'var(--lie-aqua)' }"><div class="portrait-backdrop"><img v-if="usableImage(appearance(current.appearanceId)?.portrait ?? null)" :src="appearance(current.appearanceId)!.portrait" alt="人物形象" @error="brokenImages.add(appearance(current.appearanceId)!.portrait)"><span v-else class="portrait-initial">{{ current.name.slice(0, 1) }}</span></div><h2>{{ current.name }}</h2><p>听听这位怎么说</p></section><section class="conversation-copy"><h2>与{{ current?.name }}对话</h2><p class="muted">用语音自由提问，转写仅供回看。表情与配色不表示人物是否撒谎。</p><Transcript :messages="transcript" /><UiNotice v-if="view.notice != null">{{ view.notice }}</UiNotice></section></div><VoiceControl :status="view.voiceStatus" :label="view.busy ? '正在连接语音…' : labels[view.voiceStatus]" :action-label="view.busy ? null : actionLabel" :cancel-label="view.voiceStatus === 'recording' || view.voiceStatus === 'waiting' ? '取消本轮' : null" :interrupt-label="view.voiceStatus === 'speaking' ? '打断说话' : null" @start="speak" @cancel="controller.interrupt()" @interrupt="controller.interrupt()" /></main>

    <main v-else-if="view.phase === 'solved'" class="intro-card surface"><p class="eyebrow">指认正确</p><h1>谜题解开了！</h1><h2>完整经过</h2><p class="background">{{ view.reveal }}</p><UiButton @click="controller.restart()">重新开始一局</UiButton></main>
    <main v-else class="intro-card surface"><h1>本局已结束</h1><p>这次的对话已经停止。准备好后，可以重新接案。</p><UiButton @click="controller.restart()">重新开始一局</UiButton></main>

    <UiDialog :open="view.accusationOpen" title="最终指认" @close="controller.closeAccusation()"><p>你认为谁是这次事件的责任人？点击人物提交指认。</p><div class="accusation-choices"><UiButton v-for="character in view.characters" :key="character.id" variant="secondary" @click="controller.accuse(character.id)">指认 {{ character.name }}</UiButton></div><UiNotice v-if="view.accusationFeedback != null" tone="error">{{ view.accusationFeedback }}</UiNotice><template #actions><UiButton @click="controller.closeAccusation()">返回调查</UiButton></template></UiDialog>
  </div>
</template>
