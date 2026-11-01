<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'

import { ProductHeader, UiButton } from '@lie/ui'
import EditorDialog from '../../apps/web/src/editor/EditorDialog.vue'

type AuthorResult = 'success' | 'network' | 'unavailable' | 'large'
type PlayerResult = 'success' | 'missing' | 'network'
const screen = ref<'author' | 'player'>('author')
const authorResult = ref<AuthorResult>('success')
const playerResult = ref<PlayerResult>('success')
const sharing = ref(false)
const dialog = ref(false)
const copied = ref(false)
const copyError = ref(false)
const notice = ref<string | null>(null)
const shareError = ref<string | null>(null)
const playerState = ref<'loading' | 'ready' | 'missing' | 'network'>('loading')
const title = ref('消失的小鸭木偶')
const reveal = ref('小林为了给主创一个谢幕惊喜，提前把小鸭木偶收进舞台左侧的蓝色抽屉。阿禾看到他走出道具间，却没看见他手里的东西；小周一直在台口调试音箱。大家急着找木偶时，小林才意识到自己闹了个乌龙。')
const shareUrl = 'https://lie.agency/play?share=v1.a9V5mK2pW8xN4rT7cQ1sZg'
const people = [
  { name: '小林', id: 'sunny-moustache' },
  { name: '阿禾', id: 'coral-bob' },
  { name: '小周', id: 'blue-glasses' },
]
const avatar = (id: string) => `/appearances/${id}/avatar.png`
const errorMessage = computed(() => playerState.value === 'missing' ? '案件不存在或已不可用' : '暂时无法打开案件')
let timer: ReturnType<typeof setTimeout> | null = null
function cancelPending() {
  if (timer != null) clearTimeout(timer)
  timer = null
  sharing.value = false
}
function author() {
  cancelPending()
  screen.value = 'author'
  dialog.value = false
  notice.value = null
}
function openPlayer() {
  cancelPending()
  dialog.value = false
  screen.value = 'player'
  playerState.value = 'loading'
  timer = setTimeout(() => {
    playerState.value = playerResult.value === 'success' ? 'ready' : playerResult.value
  }, 1100)
}
function share() {
  cancelPending()
  copied.value = false
  copyError.value = false
  notice.value = null
  shareError.value = null
  dialog.value = true
  if (authorResult.value === 'large') {
    shareError.value = '案件内容过大，请精简后再分享。'
    return
  }
  sharing.value = true
  timer = setTimeout(() => {
    sharing.value = false
    if (authorResult.value !== 'success') shareError.value = authorResult.value === 'network'
      ? '网络连接失败，请检查网络后重试。'
      : '暂时无法生成分享链接，请稍后重试。'
  }, 1300)
}
async function copy() {
  try { await navigator.clipboard.writeText(shareUrl); copied.value = true }
  catch { copyError.value = true }
}
function closeShare() { cancelPending(); dialog.value = false }
function edit() { notice.value = null; closeShare() }
onUnmounted(cancelPending)
</script>

<template>
  <aside class="prototype-bar" aria-label="交互原型控制">
    <div class="prototype-heading"><strong>分享体验 · 交互原型</strong><span>模拟存储 · 刷新重置示例 · 不连接语音</span></div>
    <div class="prototype-controls">
      <div class="role-switch"><button :aria-pressed="screen === 'author'" @click="author">作者分享</button><button :aria-pressed="screen === 'player'" @click="openPlayer">玩家打开</button></div>
      <label v-if="screen === 'author'">模拟分享结果<select v-model="authorResult" :disabled="sharing"><option value="success">成功</option><option value="network">网络失败</option><option value="unavailable">服务暂不可用</option><option value="large">内容超过 1 MiB</option></select></label>
      <label v-else>模拟打开结果<select v-model="playerResult" @change="openPlayer"><option value="success">正常接案</option><option value="missing">案件不存在</option><option value="network">网络失败</option></select></label>
      <p v-if="screen === 'author'">在页面底部点击「分享案件」体验。</p><p v-else>这里模拟朋友打开分享链接。</p>
    </div>
  </aside>

  <div v-if="screen === 'author'" class="editor-shell demo-shell">
    <ProductHeader title="创作你的案件" @navigate-home="author"><template #actions><UiButton variant="quiet" @click="author">返回首页</UiButton></template></ProductHeader>
    <div class="editor-draft-status"><p>草稿已保存至此设备</p><button :disabled="sharing" @click="notice = '原型中的示例草稿不会清除。'">清除草稿</button></div>
    <nav class="editor-steps" aria-label="创作步骤"><button @click="notice = '本原型聚焦完成创作后的分享体验。'"><span>1</span>故事设定<small>✓</small></button><i class="editor-step-connector"></i><button @click="notice = '本原型聚焦完成创作后的分享体验。'"><span>2</span>故事人物<small>✓</small></button><i class="editor-step-connector"></i><button aria-current="step"><span>3</span>案件真相<small>✓</small></button></nav>
    <main>
      <div class="page-heading"><h1>最后，揭开谜底</h1><span class="muted">只有正确指认后才会揭晓</span></div>
      <fieldset class="editor-fields" :disabled="sharing">
        <div class="ending-layout">
          <section class="panel form-panel">
            <div class="answer-summary"><img :src="avatar('sunny-moustache')" alt=""><div><strong>案件答案：小林</strong><span>玩家指认他，才能揭开真相。</span></div></div>
            <label class="field">完整经过<textarea v-model="reveal" rows="7" @input="edit"></textarea><small>把前因后果讲清楚，给玩家一个恍然大悟的结局。</small></label>
          </section>
          <aside class="panel player-preview"><span class="preview-badge">正确指认后的揭晓</span><h2>谜底在这里</h2><p class="reveal-text">{{ reveal }}</p></aside>
        </div>
        <footer class="step-footer"><UiButton variant="quiet" @click="notice = '本原型聚焦分享体验，不切换完整编辑步骤。'">上一步</UiButton><div class="final-actions"><UiButton variant="quiet" @click="notice = '投稿给官方的既有流程保持原样。'">投稿给官方</UiButton><UiButton variant="secondary" @click="openPlayer">试玩</UiButton><UiButton @click="share">分享案件</UiButton></div></footer>
      </fieldset>
      <p v-if="notice != null" class="demo-feedback" role="status">{{ notice }}</p>
    </main>
    <EditorDialog v-if="dialog" title="把谜题交给朋友" @close="closeShare">
      <div v-if="sharing" class="share-pending" role="status"><span class="loading-ring" aria-hidden="true"></span><p>正在保存案件…</p><span class="muted">分享链接马上就好。</span></div>
      <template v-else-if="shareError != null">
        <p class="share-lead" role="status">{{ shareError }}</p>
        <p class="snapshot-note">草稿仍保留在这里，可以继续编辑。</p>
        <div class="share-actions"><UiButton v-if="authorResult !== 'large'" @click="share">重试</UiButton><UiButton variant="secondary" @click="closeShare">继续编辑</UiButton></div>
      </template>
      <template v-else>
        <p class="share-lead">链接准备好了，朋友打开就能玩。</p>
        <label class="field">分享链接<input :value="shareUrl" readonly @focus="($event.target as HTMLInputElement).select()"></label>
        <p class="snapshot-note">修改案件后需要重新生成链接，旧链接保留当时的内容。</p>
        <p v-if="copyError" class="copy-error" role="status">无法自动复制，请选中上方链接手动复制。</p>
        <div class="share-actions"><UiButton @click="copy">{{ copied ? '已复制链接' : '复制分享链接' }}</UiButton></div>
      </template>
      <p class="share-disclosure">生成链接会将案件保存到 LIE 服务端，持有链接的人可以查看完整内容。</p>
    </EditorDialog>
  </div>

  <div v-else class="game-shell demo-shell">
    <ProductHeader @navigate-home="author"><template #actions><UiButton variant="quiet" @click="author">返回首页</UiButton></template></ProductHeader>
    <section v-if="playerState === 'loading'" class="surface intro-card state-card" role="status"><span class="loading-ring" aria-hidden="true"></span><h1>正在打开案件…</h1><p>谜题马上就到。</p></section>
    <section v-else-if="playerState !== 'ready'" class="surface intro-card state-card"><div class="question-mark" aria-hidden="true">?</div><h1>{{ errorMessage }}</h1><p>{{ playerState === 'missing' ? '请向作者确认链接是否正确。' : '请检查网络连接，再试一次。' }}</p><div class="state-actions"><UiButton v-if="playerState === 'network'" @click="openPlayer">重新加载</UiButton><UiButton :variant="playerState === 'missing' ? 'primary' : 'secondary'" @click="author">返回首页</UiButton></div></section>
    <section v-else class="surface intro-card"><p class="eyebrow">朋友分享的案件</p><h1 class="case-title lie-handwritten-underline">{{ title }}</h1><p class="background">社区木偶剧的谢幕演出即将开始，道具桌上的小鸭木偶却不见了。三位在场的人各有说法。和他们聊一聊，找出是谁拿走了木偶。</p><div class="intro-characters"><article v-for="(person, index) in people" :key="person.id" class="intro-character" :style="{ '--fan-angle': `${(index - 1) * 6}deg`, '--fan-drop': `${index === 1 ? 0 : 8}px` }"><div class="avatar-frame"><img :src="avatar(person.id)" alt=""></div><strong>{{ person.name }}</strong></article></div><ol class="flow-hint"><li>选择人物</li><li>语音询问</li><li>指认答案</li></ol><UiButton class="intro-start" @click="notice = '这是分享界面原型，未接入游戏或语音。'">开始调查</UiButton><p class="muted">本案共享询问时间 10 分钟</p><p v-if="notice" class="demo-feedback" role="status">{{ notice }}</p></section>
  </div>
</template>

<style scoped src="../../apps/web/src/editor/editor.css"></style>
