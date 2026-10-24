<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { AnimatedPortrait, CharacterChoice, ProductHeader, Transcript, UiButton, UiDialog, UiNotice, VoiceControl } from '@lie/ui'

import type { GameController } from './application/controller'
import type { Appearance } from './presentation/appearances'

const props = withDefaults(defineProps<{ controller: GameController; appearances: readonly Appearance[]; demo: boolean; returnLabel?: string }>(), { returnLabel: '返回案件列表' })
const emit = defineEmits<{ navigateHome: []; requestEnd: []; retry: [] }>()
const view = ref(props.controller.getView())
const voiceFeedback = ref(props.controller.getVoiceFeedback())
const unsubscribeFeedback = props.controller.subscribeVoiceFeedback((value) => { voiceFeedback.value = value })
onUnmounted(unsubscribeFeedback)
const backgroundOpen = ref(false)
const unsubscribe = props.controller.subscribe((value) => {
  view.value = value
  if (value.phase !== 'interrogating') backgroundOpen.value = false
})
onUnmounted(unsubscribe)
const brokenImages = ref(new Set<string>())
const current = computed(() => view.value.characters.find((character) => character.id === view.value.currentCharacterId) ?? null)
const currentAppearance = computed(() => appearance(current.value?.appearanceId ?? null))
const portraitState = computed(() => {
  if (!view.value.conversationActive || view.value.busy) return 'default'
  const status = view.value.voiceStatus
  return status === 'recording' ? 'listening' : status === 'waiting' || status === 'speaking' ? status : 'default'
})
const portrait = computed(() => {
  const preset = currentAppearance.value
  if (preset == null) return null
  const stateImage = portraitState.value === 'default' ? null : preset.portraits[portraitState.value]
  if (usableImage(stateImage)) return stateImage
  return usableImage(preset.portrait) ? preset.portrait : null
})
const transcript = computed(() => view.value.history.map((entry) => ({
  id: entry.id,
  speaker: entry.role === 'user' ? '你' : current.value?.name ?? '人物',
  text: entry.text,
  interrupted: entry.interrupted,
  pending: entry.id === 'pending-answer',
  mine: entry.role === 'user',
  avatar: entry.role === 'user' ? null : appearance(current.value?.appearanceId ?? null)?.avatar ?? null,
})))
const labels = { idle: '等待你开口', recording: '正在聆听', waiting: '等待回答', speaking: '正在回答', error: '语音暂时中断' }
const actionLabel = computed(() => {
  if (view.value.conversationActive) return view.value.busy ? '取消连接' : '结束对话'
  if (view.value.interrogationRemainingMs <= 0) return '询问时间已用完'
  return props.demo ? '开启模拟对话' : '开启对话'
})
const remainingTime = computed(() => {
  const seconds = Math.ceil(view.value.interrogationRemainingMs / 1000)
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
})
function fanStyle(index: number) {
  const position = (index - (view.value.characters.length - 1) / 2) / Math.max(1, (view.value.characters.length - 1) / 2)
  return { '--fan-angle': `${position * 8}deg`, '--fan-drop': `${Math.abs(position) * 14}px` }
}
function appearance(id: string | null) { return props.appearances.find((item) => item.id === id) ?? null }
function usableImage(url: string | null) { return url != null && !brokenImages.value.has(url) }
function portraitFailed(event: Event) {
  const url = (event.currentTarget as HTMLImageElement).getAttribute('src')
  if (url != null) brokenImages.value.add(url)
}
const durationLabel = computed(() => {
  const seconds = Math.ceil(view.value.interrogationRemainingMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes > 0 ? `${minutes}分${remainder === 0 ? '钟' : ''}` : ''}${remainder > 0 ? `${remainder}秒` : ''}`
})
function openBackground() { props.controller.endConversation(); backgroundOpen.value = true }
function speak() { if (view.value.conversationActive) props.controller.endConversation(); else void props.controller.startConversation() }
</script>

<template>
  <div class="game-shell" :class="{ 'game-shell--investigating': view.phase === 'interrogating' }">
    <ProductHeader @navigate-home="emit('navigateHome')">
      <template v-if="view.phase === 'interrogating'" #title><h1 class="investigation-heading" :aria-label="view.title"><button class="investigation-title" aria-label="查看案件背景" @click="openBackground"><span>{{ view.title }}</span><small>案件背景 ↗</small></button></h1></template>
      <template v-if="view.phase === 'interrogating'" #actions>
        <UiButton variant="quiet" @click="emit('requestEnd')">结束本局</UiButton>
      </template>
      <template v-if="demo" #notice><p>演示模式 · 对话为模拟内容，不使用麦克风</p></template>
    </ProductHeader>

    <main v-if="view.phase === 'loading' || view.phase === 'failed'" class="intro-card surface">
      <h1>{{ view.phase === 'loading' ? '正在准备案件…' : '案件暂时无法加载' }}</h1>
      <p role="status">{{ view.notice }}</p>
      <div v-if="view.phase === 'failed'" class="result-actions"><UiButton @click="emit('retry')">重试</UiButton><UiButton variant="secondary" @click="emit('navigateHome')">{{ returnLabel }}</UiButton></div>
    </main>

    <main v-else-if="view.phase === 'intro'" class="intro-card surface">
      <p class="eyebrow">一桩小谜题，几位有话说的人</p>
      <h1 class="case-title lie-handwritten-underline">{{ view.title }}</h1>
      <p class="background">{{ view.background }}</p>
      <div class="intro-characters" :class="{ 'intro-characters--many': view.characters.length > 5 }">
        <div v-for="(character, index) in view.characters" :key="character.id" class="intro-character" tabindex="0" :style="{ ...fanStyle(index), '--character-accent': appearance(character.appearanceId)?.accent ?? 'var(--lie-aqua)' }">
          <span v-if="usableImage(appearance(character.appearanceId)?.avatar ?? null)" class="avatar-frame">
            <img :src="appearance(character.appearanceId)!.avatar" alt="" @error="brokenImages.add(appearance(character.appearanceId)!.avatar)">
          </span>
          <span v-else class="initial-avatar">{{ character.name.slice(0, 1) }}</span>
          <strong>{{ character.name }}</strong>
        </div>
      </div>
      <ol class="flow-hint" aria-label="调查流程"><li>开口问话</li><li>对照说法</li><li>最终指认</li></ol>
      <p class="muted intro-duration">本局可询问{{ durationLabel }}</p>
      <UiButton class="intro-start" @click="controller.start()">接案，开始调查</UiButton>
      <UiButton variant="quiet" @click="emit('navigateHome')">{{ returnLabel }}</UiButton>
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
            <AnimatedPortrait :src="currentAppearance?.animation ?? null" :state="portraitState" :label="current.name">
              <img v-if="portrait != null" :key="portrait" :src="portrait" alt="人物形象" @error="portraitFailed">
              <span v-else class="portrait-initial">{{ current.name.slice(0, 1) }}</span>
            </AnimatedPortrait>
          </div>
          <div class="stage-caption"><h2>{{ current.name }}</h2></div>
        </section>
        <section class="conversation-copy">
          <h2>询问记录</h2>
          <Transcript :key="view.currentCharacterId ?? ''" :messages="transcript" :animate="view.conversationActive && !view.busy" />
          <UiNotice v-if="view.notice != null">{{ view.notice }}</UiNotice>
        </section>
      </div>
      <VoiceControl :preparing="view.busy" :active="view.conversationActive && !view.busy" :status="view.voiceStatus" :label="view.busy ? '正在连接语音…' : labels[view.voiceStatus]" :action-label="actionLabel" :disabled="!view.conversationActive && view.interrogationRemainingMs <= 0" :input-level="voiceFeedback.inputLevel" :input-active="voiceFeedback.inputActive" @start="speak">
        <template #details><div class="interrogation-budget" aria-label="剩余询问时间"><span>剩余询问</span><strong>{{ remainingTime }}</strong></div></template>
        <template #answer><UiButton variant="secondary" @click="controller.openAccusation()">我有答案了 <span aria-hidden="true">→</span></UiButton></template>
      </VoiceControl>
    </main>

    <main v-else-if="view.phase === 'solved'" class="intro-card result-card surface">
      <p class="eyebrow">指认正确</p>
      <h1 class="case-title lie-handwritten-underline">谜题解开了！</h1>
      <div class="result-divider" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="result-story"><h2>完整经过</h2><p class="background">{{ view.reveal }}</p></div>
      <UiButton class="intro-start" @click="controller.restart()">重新开始一局</UiButton>
      <UiButton variant="secondary" @click="emit('navigateHome')">{{ returnLabel }}</UiButton>
    </main>
    <main v-else-if="view.phase === 'lost'" class="intro-card result-card surface">
      <p class="eyebrow">本局失败</p>
      <h1 class="case-title lie-handwritten-underline">指认不正确</h1>
      <p class="background">这次调查已结束。想再试一次，请重新开始一局。</p>
      <UiButton class="intro-start" @click="controller.restart()">重新开始一局</UiButton>
      <UiButton variant="secondary" @click="emit('navigateHome')">{{ returnLabel }}</UiButton>
    </main>
    <main v-else class="intro-card surface">
      <h1>本局已结束</h1><p>这次的对话已经停止。准备好后，可以重新接案。</p>
      <UiButton @click="controller.restart()">重新开始一局</UiButton>
      <UiButton variant="secondary" @click="emit('navigateHome')">{{ returnLabel }}</UiButton>
    </main>

    <UiDialog class="background-dialog" :open="backgroundOpen && view.phase === 'interrogating'" :title="view.title" @close="backgroundOpen = false">
      <p class="public-background">{{ view.background }}</p>
      <template #actions><UiButton @click="backgroundOpen = false">继续调查</UiButton></template>
    </UiDialog>
    <UiDialog class="accusation-dialog" :open="view.accusationOpen && !backgroundOpen" title="我有答案了" @close="controller.closeAccusation()">
      <p class="accusation-question">你认为谁是这次事件的责任人？</p>
      <p class="accusation-hint">点击人物提交指认</p>
      <div class="accusation-choices">
        <div v-for="character in view.characters" :key="character.id" class="accusation-character" :style="{ '--character-accent': appearance(character.appearanceId)?.accent ?? 'var(--lie-aqua)' }">
          <span v-if="usableImage(appearance(character.appearanceId)?.avatar ?? null)" class="avatar-frame"><img :src="appearance(character.appearanceId)!.avatar" alt="" @error="brokenImages.add(appearance(character.appearanceId)!.avatar)"></span>
          <span v-else class="initial-avatar">{{ character.name.slice(0, 1) }}</span>
          <UiButton @click="controller.accuse(character.id)">指认 {{ character.name }}</UiButton>
        </div>
      </div>
      <template #actions><UiButton variant="secondary" @click="controller.closeAccusation()">返回调查</UiButton></template>
    </UiDialog>
  </div>
</template>

<style scoped>
.intro-duration { text-autospace: normal; }
</style>
