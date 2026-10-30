<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { AnimatedPortrait, CharacterChoice, ProductHeader, Transcript, UiButton, UiDialog, UiNotice, VoiceControl } from '@lie/ui'

import type { GameController } from './application/controller'
import CharacterNameText from './presentation/CharacterNameText.vue'
import VoiceConnectionNotice from './presentation/VoiceConnectionNotice.vue'
import type { CharacterPreset } from './presentation/characterPresets'

const props = withDefaults(defineProps<{ controller: GameController; characterPresets: readonly CharacterPreset[]; demo: boolean; allowRemix?: boolean; returnLabel?: string }>(), { allowRemix: true, returnLabel: '返回案件列表' })
const emit = defineEmits<{ navigateHome: []; showVersion: [trigger: HTMLButtonElement]; requestEnd: []; retry: []; remix: [] }>()
const view = ref(props.controller.getView())
const connectionAttempt = ref(0)
const voiceFeedback = ref(props.controller.getVoiceFeedback())
const unsubscribeFeedback = props.controller.subscribeVoiceFeedback((value) => { voiceFeedback.value = value })
onUnmounted(unsubscribeFeedback)
const backgroundOpen = ref(false)
const unsubscribe = props.controller.subscribe((value) => {
  if (value.busy && (!view.value.busy || value.currentCharacterId !== view.value.currentCharacterId)) connectionAttempt.value++
  view.value = value
  if (value.phase !== 'interrogating') backgroundOpen.value = false
})
onUnmounted(unsubscribe)
const brokenImages = ref(new Set<string>())
const current = computed(() => view.value.characters.find((character) => character.id === view.value.currentCharacterId) ?? null)
const currentCharacterPreset = computed(() => characterPreset(current.value?.appearanceId ?? null))
const characterNames = computed(() => view.value.characters.map((character) => ({
  name: character.name,
  accent: characterPreset(character.appearanceId)?.accent ?? null,
})))
const resultCharacter = computed(() => view.value.characters.find((character) => character.id === view.value.result?.characterId) ?? null)
const resultCharacterPreset = computed(() => characterPreset(resultCharacter.value?.appearanceId ?? null))
const resultState = computed(() => view.value.result?.correct === true ? 'accusedCorrectly' : 'accusedWrongly')
const resultPortrait = computed(() => {
  const preset = resultCharacterPreset.value
  const stateImage = preset?.portraits[resultState.value] ?? null
  if (usableImage(stateImage)) return stateImage
  const image = preset?.portrait ?? null
  return usableImage(image) ? image : null
})
const resultParagraphs = computed(() => view.value.reveal?.split('\n\n') ?? [])
const resultHeading = ref<HTMLElement | null>(null)
watch(resultHeading, (heading) => { heading?.focus() }, { flush: 'post' })
const portraitState = computed(() => {
  if (!view.value.conversationActive || view.value.busy) return 'default'
  const status = view.value.voiceStatus
  return status === 'recording' ? 'listening' : status === 'waiting' || status === 'speaking' ? status : 'default'
})
const portrait = computed(() => {
  const preset = currentCharacterPreset.value
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
  avatar: entry.role === 'user' ? null : characterPreset(current.value?.appearanceId ?? null)?.avatar ?? null,
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
function characterPreset(id: string | null) { return props.characterPresets.find((item) => item.id === id) ?? null }
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
    <ProductHeader @navigate-home="emit('navigateHome')" @show-version="emit('showVersion', $event)">
      <template v-if="view.phase === 'interrogating'" #title><h1 class="investigation-heading" :aria-label="view.title"><button class="investigation-title" aria-label="查看案件背景" @click="openBackground"><span>{{ view.title }}</span><small>案件背景 ↗</small></button></h1></template>
      <template v-if="view.phase === 'interrogating'" #actions>
        <UiButton variant="quiet" @click="emit('requestEnd')">结束本局</UiButton>
      </template>
      <template v-if="demo" #notice><p>演示模式 · 对话为模拟内容，不使用麦克风</p></template>
    </ProductHeader>

    <VoiceConnectionNotice v-if="view.phase === 'interrogating' && view.conversationActive && view.busy && current != null" :key="connectionAttempt" :name="current.name" :accent="currentCharacterPreset?.accent ?? null" @cancel="controller.endConversation()" />

    <main v-if="view.phase === 'loading' || view.phase === 'failed'" class="intro-card surface">
      <h1>{{ view.phase === 'loading' ? '正在准备案件…' : '案件暂时无法加载' }}</h1>
      <p role="status">{{ view.notice }}</p>
      <div v-if="view.phase === 'failed'" class="result-actions"><UiButton @click="emit('retry')">重试</UiButton><UiButton variant="secondary" @click="emit('navigateHome')">{{ returnLabel }}</UiButton></div>
    </main>

    <main v-else-if="view.phase === 'intro'" class="intro-card surface">
      <p class="eyebrow">一桩小谜题，几位有话说的人</p>
      <h1 class="case-title lie-handwritten-underline">{{ view.title }}</h1>
      <p class="background"><CharacterNameText :text="view.background" :characters="characterNames" /></p>
      <div class="intro-characters" :class="{ 'intro-characters--many': view.characters.length > 5 }">
        <div v-for="(character, index) in view.characters" :key="character.id" class="intro-character" tabindex="0" :style="{ ...fanStyle(index), '--character-accent': characterPreset(character.appearanceId)?.accent ?? 'var(--lie-aqua)' }">
          <span v-if="usableImage(characterPreset(character.appearanceId)?.avatar ?? null)" class="avatar-frame">
            <img :src="characterPreset(character.appearanceId)!.avatar" alt="" @error="brokenImages.add(characterPreset(character.appearanceId)!.avatar)">
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
          <CharacterChoice v-for="character in view.characters" :key="character.id" :name="character.name" :selected="view.currentCharacterId === character.id" :style="{ '--character-accent': characterPreset(character.appearanceId)?.accent ?? 'var(--lie-aqua)' }" @click="controller.selectCharacter(character.id)">
            <template #avatar>
              <img v-if="usableImage(characterPreset(character.appearanceId)?.avatar ?? null)" :src="characterPreset(character.appearanceId)!.avatar" alt="" @error="brokenImages.add(characterPreset(character.appearanceId)!.avatar)">
              <span v-else>{{ character.name.slice(0, 1) }}</span>
            </template>
          </CharacterChoice>
        </nav>
        <section v-if="current != null" class="character-stage" :style="{ '--character-accent': characterPreset(current.appearanceId)?.accent ?? 'var(--lie-aqua)' }" :aria-label="`${current.name}的人物形象`">
          <div class="portrait-backdrop">
            <AnimatedPortrait :src="currentCharacterPreset?.animation ?? null" :state="portraitState" :label="current.name">
              <template #loading><span class="portrait-loading" role="status">人物加载中…</span></template>
              <img v-if="portrait != null" :key="portrait" :src="portrait" alt="人物形象" @error="portraitFailed">
              <span v-else class="portrait-initial">{{ current.name.slice(0, 1) }}</span>
            </AnimatedPortrait>
          </div>
        </section>
        <section class="conversation-copy">
          <h2><template v-if="current != null"><CharacterNameText :text="current.name" :characters="characterNames" />的询问记录</template><template v-else>询问记录</template></h2>
          <Transcript :key="view.currentCharacterId ?? ''" :messages="transcript" :animate="view.conversationActive && !view.busy" />
          <UiNotice v-if="view.notice != null">{{ view.notice }}</UiNotice>
        </section>
      </div>
      <VoiceControl :preparing="view.busy" :active="view.conversationActive && !view.busy" :status="view.voiceStatus" :label="view.busy ? '正在连接语音…' : labels[view.voiceStatus]" :action-label="actionLabel" :disabled="!view.conversationActive && view.interrogationRemainingMs <= 0" :input-level="voiceFeedback.inputLevel" :input-active="voiceFeedback.inputActive" @start="speak">
        <template #details><div class="interrogation-budget" aria-label="剩余询问时间"><span>剩余询问</span><strong>{{ remainingTime }}</strong></div></template>
        <template #answer><UiButton variant="secondary" @click="controller.openAccusation()">我有答案了 <span aria-hidden="true">→</span></UiButton></template>
      </VoiceControl>
    </main>

    <main v-else-if="view.phase === 'solved' || view.phase === 'lost'" class="result-card surface" :class="{ 'result-card--wrong': !view.result?.correct }">
      <div class="result-pattern" aria-hidden="true"></div>
      <header class="result-heading">
        <svg class="result-mark" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <template v-if="view.result?.correct">
            <path class="result-mark__seal" d="M50 2 60 12 75 8 79 23 94 28 89 43 98 55 85 65 85 81 69 83 60 97 47 89 33 96 25 82 9 78 13 62 2 50 14 39 12 23 28 20 38 6Z" />
            <path class="result-mark__stroke" d="m27 51 16 17 32-37" />
          </template>
          <template v-else>
            <circle class="result-mark__seal" cx="50" cy="50" r="43" />
            <path class="result-mark__stroke" d="m32 32 36 36m0-36L32 68" />
          </template>
        </svg>
        <div class="result-heading-copy">
          <p class="eyebrow">{{ view.phase === 'solved' ? '指认正确' : '本局结束' }}</p>
          <h1 ref="resultHeading" class="case-title lie-handwritten-underline" tabindex="-1">{{ view.phase === 'solved' ? '谜题解开了！' : '指认不正确' }}</h1>
        </div>
      </header>
      <div class="result-content">
        <figure v-if="resultCharacter != null" class="result-character" :style="{ '--character-accent': resultCharacterPreset?.accent ?? 'var(--lie-aqua)' }">
          <div class="result-portrait">
            <AnimatedPortrait :src="resultCharacterPreset?.animation ?? null" :state="resultState" :label="resultCharacter.name" fit="contain">
              <img v-if="resultPortrait != null" :key="resultPortrait" :src="resultPortrait" alt="" @error="portraitFailed">
              <span v-else class="result-initial" aria-hidden="true">{{ resultCharacter.name.slice(0, 1) }}</span>
            </AnimatedPortrait>
          </div>
          <figcaption><span>你指认了</span><strong>{{ resultCharacter.name }}</strong></figcaption>
        </figure>
        <section v-if="view.phase === 'solved'" class="result-story" aria-label="完整经过">
          <h2>完整经过</h2><p v-for="(paragraph, index) in resultParagraphs" :key="index"><CharacterNameText :text="paragraph" :characters="characterNames" /></p>
        </section>
        <section v-else class="result-story" aria-label="调查结果">
          <h2>这次调查已结束</h2><p>想再试一次，请重新开始一局。</p>
        </section>
      </div>
      <footer class="result-actions">
        <UiButton @click="controller.restart()">重新开始一局</UiButton>
        <UiButton variant="secondary" @click="emit('navigateHome')">{{ returnLabel }}</UiButton>
        <UiButton v-if="allowRemix" variant="quiet" class="remix-link" @click="emit('remix')">我要改编</UiButton>
      </footer>
    </main>
    <main v-else class="intro-card surface">
      <h1>本局已结束</h1><p>这次的对话已经停止。准备好后，可以重新接案。</p>
      <UiButton @click="controller.restart()">重新开始一局</UiButton>
      <UiButton variant="secondary" @click="emit('navigateHome')">{{ returnLabel }}</UiButton>
    </main>

    <UiDialog class="background-dialog" :open="backgroundOpen && view.phase === 'interrogating'" :title="view.title" @close="backgroundOpen = false">
      <p class="public-background"><CharacterNameText :text="view.background" :characters="characterNames" /></p>
      <template #actions><UiButton @click="backgroundOpen = false">继续调查</UiButton></template>
    </UiDialog>
    <UiDialog class="accusation-dialog" :open="view.accusationOpen && !backgroundOpen" title="我有答案了" @close="controller.closeAccusation()">
      <p class="accusation-question">你认为谁是这次事件的责任人？</p>
      <p class="accusation-hint">点击人物提交指认</p>
      <div class="intro-characters accusation-choices" :class="{ 'intro-characters--many': view.characters.length > 5 }">
        <button v-for="(character, index) in view.characters" :key="character.id" type="button" class="intro-character accusation-character" :aria-label="`指认 ${character.name}`" :style="{ ...fanStyle(index), '--character-accent': characterPreset(character.appearanceId)?.accent ?? 'var(--lie-aqua)' }" @click="controller.accuse(character.id)">
          <span v-if="usableImage(characterPreset(character.appearanceId)?.avatar ?? null)" class="avatar-frame"><img :src="characterPreset(character.appearanceId)!.avatar" alt="" @error="brokenImages.add(characterPreset(character.appearanceId)!.avatar)"></span>
          <span v-else class="initial-avatar">{{ character.name.slice(0, 1) }}</span>
          <strong>指认 <CharacterNameText :text="character.name" :characters="characterNames" /></strong>
        </button>
      </div>
      <template #actions><UiButton variant="secondary" @click="controller.closeAccusation()">返回调查</UiButton></template>
    </UiDialog>
  </div>
</template>

<style scoped>
.intro-duration { text-autospace: normal; }
</style>
