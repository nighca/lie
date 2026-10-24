<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { UiButton, UiNotice } from '@lie/ui'
import type { GameDefinition } from '@lie/game-core'

import type { Appearance } from '../presentation/appearances'
import { createDraft, draftGame, loadDraft, removeCharacter, saveDraft } from './draft'
import { encodeGameLink, SHARE_URL_LIMIT } from './share'

const props = defineProps<{ appearances: readonly Appearance[] }>()
const emit = defineEmits<{ preview: [game: GameDefinition]; leave: [] }>()
const draft = ref(createDraft(props.appearances[0]?.id ?? null))
const notice = ref<string | null>(null)
const noticeElement = ref<HTMLElement | null>(null)
const saveStatus = ref('草稿仅保存在此浏览器')
const busy = ref(false)
const shareUrl = ref<string | null>(null)
const copied = ref(false)
let mounted = true
try {
  const stored = loadDraft(localStorage)
  if (stored != null) { draft.value = stored; saveStatus.value = '已恢复此浏览器的草稿' }
} catch { notice.value = '本地草稿无法读取。你仍可创作新案件；开始编辑后会保存新的草稿。' }
watch(draft, () => {
  shareUrl.value = null
  copied.value = false
  try { saveDraft(localStorage, draft.value); saveStatus.value = '草稿已保存到此浏览器' }
  catch { saveStatus.value = '草稿未能保存，请勿关闭页面'; notice.value = '浏览器不允许保存草稿或存储空间不足。' }
}, { deep: true, flush: 'sync' })
watch(notice, (value) => { if (value != null) noticeElement.value?.focus() }, { flush: 'post' })
onUnmounted(() => { mounted = false })
function addCharacter() {
  draft.value.characters.push({ id: crypto.randomUUID(), name: '', profile: '', appearanceId: props.appearances[0]?.id ?? null })
}
function preview() {
  notice.value = null
  try { emit('preview', draftGame(draft.value, props.appearances)) }
  catch (error) { notice.value = error instanceof Error ? error.message : '请检查案件内容' }
}
async function share() {
  notice.value = null
  busy.value = true
  try {
    const url = await encodeGameLink(draftGame(draft.value, props.appearances), location.origin)
    if (mounted) { shareUrl.value = url; copied.value = false }
  } catch (error) {
    if (mounted) notice.value = error instanceof Error ? error.message : '当前浏览器无法生成分享链接'
  } finally { if (mounted) busy.value = false }
}
async function copy() {
  if (shareUrl.value == null) return
  try { await navigator.clipboard.writeText(shareUrl.value); if (mounted) copied.value = true }
  catch { if (mounted) notice.value = '无法自动复制，请选中下方链接手动复制。' }
}
const appearanceNames: Record<string, string> = {
  'coral-bob': '珊瑚短发', 'sunny-moustache': '阳光小胡子', 'blue-glasses': '蓝衣眼镜',
  'silver-bun': '银发盘发', 'salt-pepper-beard': '灰白胡须', 'plum-crop': '紫衣短卷发',
  'mint-puffs': '薄荷双丸子', 'ochre-freckles': '赭黄雀斑',
}
</script>

<template>
  <div class="editor-shell">
    <header class="editor-header"><a href="/" class="wordmark" aria-label="LIE 首页" @click.prevent="emit('leave')"><img src="/brand/logo.svg" width="116" height="62" alt=""></a><div><p class="editor-eyebrow">让你的故事，也有话可聊。</p><h1>创作案件</h1></div><UiButton variant="quiet" @click="emit('leave')">返回首页</UiButton></header>
    <main>
      <p class="editor-description">写一个小谜题，为每位人物安排各自知道的事。玩家将用语音问话，最后做出一次指认。</p>
      <p class="editor-save" role="status">{{ saveStatus }}</p>
      <div v-if="notice != null" ref="noticeElement" tabindex="-1"><UiNotice tone="error">{{ notice }}</UiNotice></div>
      <form @submit.prevent="preview">
        <fieldset :disabled="busy" class="editor-fields">
          <section class="editor-panel" aria-labelledby="editor-case-title"><h2 id="editor-case-title">故事从这里开始</h2>
            <label>案件标题<input v-model="draft.title" name="title" placeholder="给谜题起个名字" required></label>
            <label>公共背景<textarea v-model="draft.background" name="background" rows="5" placeholder="所有人都知道的背景。会在接案时展示给玩家。" required></textarea></label>
            <label class="editor-duration">共享询问时长（秒）<input v-model.number="draft.interrogationLimitSeconds" name="duration" type="number" min="1" step="1" required><small>包含对话中的停顿、等待与回答，切换人物不会重置。</small></label>
          </section>
          <section class="editor-panel" aria-labelledby="editor-characters-title"><div class="editor-section-heading"><h2 id="editor-characters-title">故事里的人</h2><UiButton variant="secondary" @click="addCharacter">添加人物</UiButton></div>
            <article v-for="(character, index) in draft.characters" :key="character.id" class="editor-character"><div class="editor-section-heading"><h3>人物 {{ index + 1 }}</h3><UiButton variant="quiet" :aria-label="`删除人物 ${index + 1}`" @click="removeCharacter(draft, character.id)">删除人物</UiButton></div>
              <label>姓名<input v-model="character.name" :name="`name-${character.id}`" required></label>
              <label>人物设定<textarea v-model="character.profile" :name="`profile-${character.id}`" rows="5" placeholder="他是谁、知道什么、隐瞒什么，以及面对追问会怎么说。完整真相可以写在这里，不会直接展示给玩家。" required></textarea></label>
              <fieldset class="editor-appearances"><legend>预置形象</legend><label v-for="appearance in appearances" :key="appearance.id" class="editor-appearance" :class="{ 'editor-appearance--selected': character.appearanceId === appearance.id }"><input v-model="character.appearanceId" type="radio" :name="`appearance-${character.id}`" :value="appearance.id"><img :src="appearance.avatar" alt=""><span>{{ appearanceNames[appearance.id] ?? appearance.id }}</span></label><label class="editor-no-appearance"><input v-model="character.appearanceId" type="radio" :name="`appearance-${character.id}`" :value="null">不使用形象</label></fieldset>
            </article><p v-if="draft.characters.length === 0">还没有人物，先添加一位吧。</p>
          </section>
          <section class="editor-panel" aria-labelledby="editor-ending-title"><h2 id="editor-ending-title">真相与结局</h2><p>以下内容不会在调查时直接展示给玩家。</p>
            <label>正确指认的人物<select v-model="draft.ending.culpritId" name="culprit" required><option disabled value="">请选择人物</option><option v-for="(character, index) in draft.characters" :key="character.id" :value="character.id">{{ character.name || `人物 ${index + 1}` }}</option></select></label>
            <label>完整经过<textarea v-model="draft.ending.reveal" name="reveal" rows="5" placeholder="正确指认后揭晓的完整经过。错误指认会结束本局，不揭晓真相。" required></textarea></label>
          </section>
        </fieldset>
        <div class="editor-actions"><UiButton :disabled="busy" @click="preview">试玩当前案件</UiButton><UiButton variant="secondary" :busy="busy" @click="share">生成分享链接</UiButton></div>
      </form>
      <section v-if="shareUrl != null" class="editor-panel editor-share" aria-label="分享链接"><h2>把谜题交给朋友</h2><p>链接包含完整案件。修改草稿后，请重新生成链接；之前发出的链接仍保留当时的内容。</p><label>完整分享链接<textarea :value="shareUrl" readonly rows="3" @focus="($event.target as HTMLTextAreaElement).select()"></textarea></label><p>{{ shareUrl.length.toLocaleString('en-US') }} / {{ SHARE_URL_LIMIT.toLocaleString('en-US') }} 字符</p><UiButton @click="copy">{{ copied ? '已复制' : '复制分享链接' }}</UiButton></section>
    </main>
  </div>
</template>

<style scoped>
.editor-shell { max-width: 1060px; margin: auto; padding: 24px 28px 64px; color: var(--lie-ink); }
.editor-header { display: flex; align-items: center; gap: 24px; margin-bottom: 28px; }
.editor-header > .lie-button { margin-left: auto; }
.editor-header h1, .editor-eyebrow { margin: 0; }
.editor-eyebrow { font-size: 14px; margin-bottom: 4px; }
.editor-description { font-size: 18px; line-height: 1.7; max-width: 760px; }
.editor-save { color: var(--lie-muted); font-size: 14px; }
.editor-fields { border: 0; padding: 0; margin: 0; min-width: 0; }
.editor-panel { background: var(--lie-surface); border: 2px solid var(--lie-ink); border-radius: 24px; padding: 26px; margin-top: 24px; }
.editor-panel h2 { margin: 0 0 18px; font-size: 22px; }
.editor-panel p { line-height: 1.6; }
.editor-panel label:not(.editor-appearance):not(.editor-no-appearance) { display: flex; flex-direction: column; gap: 8px; font-weight: 700; margin: 18px 0; }
.editor-panel input:not([type=radio]), .editor-panel textarea, .editor-panel select { border: 2px solid #b2b5c2; border-radius: 12px; background: white; color: inherit; font: inherit; font-weight: 400; padding: 12px; min-width: 0; }
.editor-panel input:focus, .editor-panel textarea:focus, .editor-panel select:focus { outline: 3px solid #a8c6ff; border-color: var(--lie-primary); }
.editor-panel textarea { resize: vertical; line-height: 1.6; }
.editor-duration input { max-width: 160px; }
.editor-duration small { font-weight: 400; line-height: 1.6; }
.editor-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.editor-section-heading h2, .editor-section-heading h3 { margin: 0; }
.editor-character { margin-top: 24px; border-top: 1px solid #d9d9dd; padding-top: 20px; }
.editor-appearances { display: flex; gap: 10px; flex-wrap: wrap; border: 0; margin: 20px 0 0; padding: 0; }
.editor-appearances legend { font-weight: 700; margin-bottom: 10px; }
.editor-appearance { display: flex; position: relative; flex-direction: column; align-items: center; width: 106px; border: 2px solid #d5d7df; border-radius: 12px; padding: 8px; cursor: pointer; gap: 6px; font-size: 12px; }
.editor-appearance input { position: absolute; top: 5px; left: 5px; }
.editor-appearance img { width: 64px; height: 64px; object-fit: cover; border-radius: 50%; }
.editor-appearance--selected { border-color: var(--lie-primary); background: #eaf1ff; }
.editor-no-appearance { display: flex; align-items: center; gap: 6px; }
.editor-actions { display: flex; gap: 16px; padding: 28px 0 0; flex-wrap: wrap; }
.editor-share textarea { font-size: 13px; overflow-wrap: anywhere; }
@media (max-width: 620px) { .editor-shell { padding: 16px 14px 40px; } .editor-header { flex-wrap: wrap; gap: 12px; } .editor-header .wordmark img { width: 84px; height: auto; } .editor-header h1 { font-size: 24px; } .editor-eyebrow { display: none; } .editor-panel { padding: 18px; border-radius: 18px; } .editor-appearance { width: 94px; } .editor-header > .lie-button { padding: 8px; } }
</style>
