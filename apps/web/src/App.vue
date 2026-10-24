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
const portrait = computed(() => {
  const preset = appearance(current.value?.appearanceId ?? null)
  if (preset == null) return null
  if (view.value.conversationActive && !view.value.busy) {
    const status = view.value.voiceStatus
    const state = status === 'recording' ? 'listening' : status === 'waiting' || status === 'speaking' ? status : null
    const stateImage = state == null ? null : preset.portraits[state]
    if (usableImage(stateImage)) return stateImage
  }
  return usableImage(preset.portrait) ? preset.portrait : null
})
const transcript = computed(() => view.value.history.map((entry) => ({
  id: entry.id,
  speaker: entry.role === 'user' ? '你' : current.value?.name ?? '人物',
  text: entry.text,
  mine: entry.role === 'user',
  avatar: entry.role === 'user' ? null : appearance(current.value?.appearanceId ?? null)?.avatar ?? null,
})))
const labels = { idle: '等待你开口', recording: '正在聆听', waiting: '等待回应 · 麦克风已开启', speaking: '正在说话 · 可直接开口打断', error: '语音暂时中断' }
const actionLabel = computed(() => {
  if (view.value.conversationActive) return view.value.busy ? '取消连接' : '结束对话'
  if (view.value.interrogationRemainingMs <= 0) return '询问时间已用完'
  return props.demo ? '开始模拟对话' : '开始对话'
})
const remainingTime = computed(() => {
  const seconds = Math.ceil(view.value.interrogationRemainingMs / 1000)
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
})
function appearance(id: string | null) { return props.appearances.find((item) => item.id === id) ?? null }
function usableImage(url: string | null) { return url != null && !brokenImages.value.has(url) }
function portraitFailed(event: Event) {
  const url = (event.currentTarget as HTMLImageElement).getAttribute('src')
  if (url != null) brokenImages.value.add(url)
}
function speak() { if (view.value.conversationActive) props.controller.endConversation(); else void props.controller.startConversation() }
</script>

<template>
  <div class="game-shell">
    <header class="game-header">
      <a class="wordmark" href="/" aria-label="LIE 首页"><img src="/brand/logo.svg" width="116" height="62" alt=""> <span>语音推理</span></a>
      <h1 v-if="view.phase === 'interrogating'" class="header-title">{{ view.title }}</h1>
      <div v-if="view.phase === 'interrogating'" class="header-actions">
        <span class="interrogation-budget" aria-label="剩余询问时间">剩余 {{ remainingTime }}</span>
        <UiButton variant="quiet" @click="controller.end()">结束本局</UiButton>
        <UiButton @click="controller.openAccusation()">最终指认</UiButton>
      </div>
    </header>
    <p class="environment-note">{{ demo ? '演示模式 · 对话为模拟内容，不使用麦克风' : '语音体验开发预览' }}</p>

    <main v-if="view.phase === 'loading' || view.phase === 'failed'" class="intro-card surface">
      <h1>{{ view.phase === 'loading' ? '正在准备案件…' : '案件暂时无法加载' }}</h1>
      <p role="status">{{ view.notice }}</p>
      <p v-if="view.phase === 'failed'">请刷新页面重试。</p>
    </main>

    <main v-else-if="view.phase === 'intro'" class="intro-card surface">
      <p class="eyebrow">一桩小谜题，几位有话说的人</p>
      <h1 class="case-title">{{ view.title }}</h1>
      <p class="background">{{ view.background }}</p>
      <div class="intro-characters">
        <div v-for="character in view.characters" :key="character.id" class="intro-character" :style="{ '--character-accent': appearance(character.appearanceId)?.accent ?? 'var(--lie-aqua)' }">
          <span v-if="usableImage(appearance(character.appearanceId)?.avatar ?? null)" class="avatar-frame">
            <img :src="appearance(character.appearanceId)!.avatar" alt="" @error="brokenImages.add(appearance(character.appearanceId)!.avatar)">
          </span>
          <span v-else class="initial-avatar">{{ character.name.slice(0, 1) }}</span>
          <strong>{{ character.name }}</strong>
        </div>
      </div>
      <ol class="flow-hint" aria-label="调查流程"><li>开口问话</li><li>对照说法</li><li>最终指认</li></ol>
      <p class="muted">本局共 {{ remainingTime }} 询问时间，跨人物共享。语音开启时计时，结束对话后暂停，连接准备不计时。</p>
      <UiButton class="intro-start" @click="controller.start()">接案，开始调查</UiButton>
    </main>

    <main v-else-if="view.phase === 'interrogating'" class="investigation">
      <div class="conversation-layout">
        <nav class="character-list" aria-label="选择询问人物">
          <CharacterChoice v-for="character in view.characters" :key="character.id" :name="character.name" :selected="view.currentCharacterId === character.id" :style="{ '--character-accent': appearance(character.appearanceId)?.accent ?? 'var(--lie-aqua)' }" @click="controller.selectCharacter(character.id)">
            <template #avatar>
              <img v-if="usableImage(appearance(character.appearanceId)?.avatar ?? null)" :src="appearance(character.appearanceId)!.avatar" alt="" @error="brokenImages.add(appearance(character.appearanceId)!.avatar)">
              <span v-else>{{ character.name.slice(0, 1) }}</span>
            </template>
          </CharacterChoice>
        </nav>
        <section v-if="current != null" class="character-stage" :style="{ '--character-accent': appearance(current.appearanceId)?.accent ?? 'var(--lie-aqua)' }" :aria-label="`${current.name}的人物形象`">
          <div class="portrait-backdrop">
            <img v-if="portrait != null" :key="portrait" :src="portrait" alt="人物形象" @error="portraitFailed">
            <span v-else class="portrait-initial">{{ current.name.slice(0, 1) }}</span>
          </div>
          <div class="stage-caption"><h2>{{ current.name }}</h2><span>听听这位怎么说</span></div>
        </section>
        <section class="conversation-copy">
          <h2>与{{ current?.name }}对话</h2>
          <p class="muted">自由开口提问，听听每个人的说法。</p>
          <Transcript :messages="transcript" />
          <UiNotice v-if="view.notice != null">{{ view.notice }} <a v-if="view.voiceAccessEntry != null" :href="view.voiceAccessEntry">打开本地测试入口（将写入测试 Cookie）</a></UiNotice>
        </section>
      </div>
      <VoiceControl :status="view.voiceStatus" :label="view.busy ? '正在连接语音…' : labels[view.voiceStatus]" :action-label="actionLabel" :disabled="!view.conversationActive && view.interrogationRemainingMs <= 0" @start="speak" />
      <p class="muted conversation-hint">{{ view.conversationActive ? '对话持续进行中，停顿后会自动回答；你也可以直接开口打断。' : '点击一次开始多轮对话，再次点击结束。语音开启时计时，结束后暂停。' }}</p>
      <p class="presentation-note">转写仅供回看 · 人物的表情和配色不代表是否撒谎</p>
    </main>

    <main v-else-if="view.phase === 'solved'" class="intro-card result-card surface">
      <p class="eyebrow">指认正确</p>
      <h1 class="case-title">谜题解开了！</h1>
      <div class="result-divider" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="result-story"><h2>完整经过</h2><p class="background">{{ view.reveal }}</p></div>
      <UiButton class="intro-start" @click="controller.restart()">重新开始一局</UiButton>
    </main>
    <main v-else class="intro-card surface">
      <h1>本局已结束</h1><p>这次的对话已经停止。准备好后，可以重新接案。</p>
      <UiButton @click="controller.restart()">重新开始一局</UiButton>
    </main>

    <UiDialog :open="view.accusationOpen" title="最终指认" @close="controller.closeAccusation()">
      <p class="accusation-question">你认为谁是这次事件的责任人？</p>
      <p class="accusation-hint">点击人物提交指认</p>
      <div class="accusation-choices">
        <div v-for="character in view.characters" :key="character.id" class="accusation-character" :style="{ '--character-accent': appearance(character.appearanceId)?.accent ?? 'var(--lie-aqua)' }">
          <span v-if="usableImage(appearance(character.appearanceId)?.avatar ?? null)" class="avatar-frame"><img :src="appearance(character.appearanceId)!.avatar" alt="" @error="brokenImages.add(appearance(character.appearanceId)!.avatar)"></span>
          <span v-else class="initial-avatar">{{ character.name.slice(0, 1) }}</span>
          <UiButton @click="controller.accuse(character.id)">指认 {{ character.name }}</UiButton>
        </div>
      </div>
      <UiNotice v-if="view.accusationFeedback != null">{{ view.accusationFeedback }}</UiNotice>
      <template #actions><UiButton variant="secondary" @click="controller.closeAccusation()">返回调查</UiButton></template>
    </UiDialog>
  </div>
</template>
