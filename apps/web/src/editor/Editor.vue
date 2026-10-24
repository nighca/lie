<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import type { GameDefinition } from '@lie/game-core'
import { AnimatedPortrait, CharacterChoice, ProductHeader, UiButton, UiNotice } from '@lie/ui'

import type { Appearance } from '../presentation/appearances'
import EditorDialog from './EditorDialog.vue'
import { createDraft, draftGame, draftIssues, DRAFT_KEY, loadDraft, removeCharacter, saveDraft, type DraftCharacter, type DraftIssue } from './draft'
import { PROFILE_EXAMPLE } from './example'
import { encodeGameLink, SHARE_URL_LIMIT } from './share'
import { prepareSubmission } from './submission'

const props = defineProps<{ appearances: readonly Appearance[] }>()
const emit = defineEmits<{ preview: [game: GameDefinition]; leave: [] }>()
const draft = ref(createDraft(props.appearances[0]?.id ?? null))
const step = ref(0)
const selectedId = ref<string | null>(null)
const notice = ref<string | null>(null)
const saveStatus = ref('草稿仅保存在此浏览器')
const busy = ref(false)
const showIssues = ref(false)
const overlay = ref<'example' | 'appearance' | 'share' | 'submission' | 'delete' | 'clear' | null>(null)
const shareUrl = ref<string | null>(null)
const submission = ref<ReturnType<typeof prepareSubmission> | null>(null)
const copied = ref(false)
const form = ref<HTMLElement | null>(null)
let mounted = true
let clearingDraft = false
try {
  const stored = loadDraft(localStorage)
  if (stored != null) { draft.value = stored; saveStatus.value = '已恢复此浏览器的草稿' }
} catch { notice.value = '本地草稿无法读取。你仍可创作新案件；开始编辑后会保存新的草稿。' }
selectedId.value = draft.value.characters[0]?.id ?? null
const character = computed(() => draft.value.characters.find((person) => person.id === selectedId.value) ?? null)
const answer = computed(() => draft.value.characters.find((person) => person.id === draft.value.ending.culpritId) ?? null)
const issues = computed(() => draftIssues(draft.value, props.appearances))
const minutes = computed({ get: () => draft.value.interrogationLimitSeconds / 60, set: (value: number) => { draft.value.interrogationLimitSeconds = Math.round(Number(value) * 60) } })
const steps = ['故事设定', '故事人物', '真相结局']
function appearance(person: DraftCharacter) { return props.appearances.find((preset) => preset.id === person.appearanceId) ?? null }
function invalid(field: string) { return showIssues.value && issues.value.some((issue) => issue.field === field && (issue.characterId == null || issue.characterId === selectedId.value)) }
function name(person: DraftCharacter) { return person.name.trim() || `人物 ${draft.value.characters.indexOf(person) + 1}` }
watch(draft, () => {
  if (clearingDraft) return
  shareUrl.value = null
  copied.value = false
  try { saveDraft(localStorage, draft.value); saveStatus.value = '草稿已保存到此浏览器' }
  catch { saveStatus.value = '草稿未能保存，请勿关闭页面'; notice.value = '浏览器不允许保存草稿或存储空间不足。' }
}, { deep: true, flush: 'sync' })
onUnmounted(() => { mounted = false })
async function focus(field: string) {
  await nextTick()
  const target = form.value?.querySelector<HTMLElement>(`[data-field="${field}"]`)
  target?.focus()
  target?.scrollIntoView?.({ block: 'nearest' })
}
function goToIssue(issue: DraftIssue) {
  step.value = issue.step
  if (issue.characterId != null) selectedId.value = issue.characterId
  if (issue.field === 'answer' && character.value == null) selectedId.value = draft.value.characters[0]?.id ?? null
  void focus(issue.field)
}
function validated(): GameDefinition | null {
  notice.value = null
  showIssues.value = true
  if (issues.value.length > 0) { goToIssue(issues.value[0]); return null }
  try { return draftGame(draft.value, props.appearances) }
  catch (error) { notice.value = error instanceof Error ? error.message : '请检查案件内容'; return null }
}
function addCharacter() {
  const person = { id: crypto.randomUUID(), name: '', profile: '', appearanceId: props.appearances[0]?.id ?? null }
  draft.value.characters.push(person)
  selectedId.value = person.id
  void focus('name')
}
function deleteCharacter() {
  if (character.value == null) return
  const index = draft.value.characters.indexOf(character.value)
  removeCharacter(draft.value, character.value.id)
  selectedId.value = draft.value.characters[Math.min(index, draft.value.characters.length - 1)]?.id ?? null
  overlay.value = null
  void focus(character.value == null ? 'add-character' : 'name')
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY) }
  catch { notice.value = '无法清除本地草稿，内容已保留，请重试。'; return }
  clearingDraft = true
  draft.value = createDraft(props.appearances[0]?.id ?? null)
  clearingDraft = false
  selectedId.value = draft.value.characters[0].id
  step.value = 0
  showIssues.value = false
  notice.value = null
  shareUrl.value = null
  submission.value = null
  copied.value = false
  saveStatus.value = '本地草稿已清除，开始编辑后自动保存'
  overlay.value = null
  void focus('title')
}
function chooseAppearance(id: string) {
  if (character.value != null) character.value.appearanceId = id
  overlay.value = null
}
function preview() {
  const game = validated()
  if (game != null) emit('preview', game)
}
async function share() {
  const game = validated()
  if (game == null) return
  busy.value = true
  try {
    const url = await encodeGameLink(game, location.origin)
    if (mounted) { shareUrl.value = url; copied.value = false; overlay.value = 'share' }
  } catch (error) { if (mounted) notice.value = error instanceof Error ? error.message : '当前浏览器无法生成分享链接' }
  finally { if (mounted) busy.value = false }
}
function contribute() {
  const game = validated()
  if (game == null) return
  try { submission.value = prepareSubmission(game); copied.value = false; overlay.value = 'submission' }
  catch (error) { notice.value = error instanceof Error ? error.message : '无法准备投稿文件' }
}
async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); if (mounted) copied.value = true }
  catch { if (mounted) notice.value = '无法自动复制，请选中下方内容手动复制。' }
}
</script>

<template>
  <div class="editor-shell">
    <ProductHeader class="editor-header" @navigate-home="!busy && emit('leave')">
      <template #actions><UiButton variant="quiet" :disabled="busy" @click="overlay = 'clear'">清除草稿</UiButton><UiButton variant="quiet" :disabled="busy" @click="emit('leave')">返回首页</UiButton></template>
      <template #notice><p class="editor-save" role="status">{{ saveStatus }}</p></template>
    </ProductHeader>
    <nav class="editor-steps" aria-label="创作步骤">
      <button v-for="(label, index) in steps" :key="label" type="button" :disabled="busy" :aria-current="step === index ? 'step' : false" @click="step = index"><span>{{ index + 1 }}</span>{{ label }}<small v-if="!issues.some((issue) => issue.step === index)" aria-label="内容已填写">✓</small></button>
    </nav>
    <main ref="form">
      <div v-if="notice != null" role="alert" class="editor-notice"><UiNotice tone="error">{{ notice }}</UiNotice></div>
      <section v-if="showIssues && issues.length" class="error-summary" role="alert" aria-label="待补充内容"><strong>再补充这些，就能试玩或分享了</strong><ul><li v-for="(issue, index) in issues" :key="index"><button type="button" @click="goToIssue(issue)">{{ issue.message }}</button></li></ul></section>
      <fieldset class="editor-fields" :disabled="busy">
        <div class="page-heading"><h1>{{ steps[step] }}</h1></div>
        <div v-if="step === 0" class="story-layout">
          <section class="panel form-panel" aria-label="故事设定">
            <label class="field">案件标题<input v-model="draft.title" name="title" data-field="title" :aria-invalid="invalid('title')" placeholder="给谜题起个名字"></label>
            <label class="field">公共背景<textarea v-model="draft.background" name="background" data-field="background" :aria-invalid="invalid('background')" rows="7" placeholder="发生了什么？玩家要查明什么？只写所有人都知道的信息。"></textarea><small>玩家接案时会读到这段话。秘密留给人物设定。</small></label>
            <div class="field"><label for="editor-duration">共享询问时间</label><div class="duration-options"><button v-for="value in [5, 8, 10]" :key="value" type="button" :aria-pressed="minutes === value" @click="minutes = value">{{ value }} 分钟</button><label class="duration-custom"><input id="editor-duration" v-model.number="minutes" name="duration" data-field="duration" :aria-invalid="invalid('duration')" type="number" min="0" step="any">分钟</label></div><small>包含停顿、等待和回答，所有人物共享；结束对话后暂停。</small></div>
          </section>
          <aside class="panel player-preview" aria-label="接案内容预览"><span class="preview-badge">玩家接案时看到的内容</span><h2>{{ draft.title || '你的案件标题' }}</h2><p>{{ draft.background || '故事从这里开始……' }}</p><div class="preview-portraits"><template v-for="person in draft.characters" :key="person.id"><img v-if="appearance(person)" :src="appearance(person)!.avatar" :alt="name(person)"></template></div><div class="preview-time">{{ draft.characters.length }} 位人物 · 共享询问 {{ minutes }} 分钟</div></aside>
        </div>
        <div v-else-if="step === 1" class="character-layout">
          <nav class="character-rail" aria-label="编辑人物"><CharacterChoice v-for="person in draft.characters" :key="person.id" class="character-card" :name="name(person)" :selected="selectedId === person.id" :aria-label="`编辑${name(person)}`" :style="{ '--character-accent': appearance(person)?.accent }" @click="selectedId = person.id"><template v-if="appearance(person)" #avatar><img :src="appearance(person)!.avatar" alt=""></template></CharacterChoice><button type="button" class="add-character" data-field="add-character" @click="addCharacter"><span>＋</span>添加人物</button></nav>
          <section v-if="character != null" class="panel character-editor" aria-label="人物编辑">
            <div class="editor-character-stage"><button type="button" class="delete-button" :aria-label="`删除${name(character)}`" @click="overlay = 'delete'">删除人物</button><div class="editor-character-identity"><div class="portrait-halo"><AnimatedPortrait :src="appearance(character)?.animation ?? null" state="default" :label="name(character)"><img v-if="appearance(character)" :src="appearance(character)!.portrait" alt=""><span v-else class="portrait-initial">?</span></AnimatedPortrait></div><button type="button" class="appearance-choice" data-field="appearance" :aria-invalid="invalid('appearance')" @click="overlay = 'appearance'"><span class="appearance-action">{{ appearance(character) == null ? '选择形象' : '更换形象' }}</span></button><h2>{{ name(character) }}</h2></div></div>
            <div class="character-fields">
              <label class="field">姓名<input v-model="character.name" :name="`name-${character.id}`" data-field="name" :aria-invalid="invalid('name')" placeholder="这个人物叫什么？"></label>
              <label class="answer-toggle"><input type="checkbox" data-field="answer" :aria-invalid="invalid('answer')" :checked="draft.ending.culpritId === character.id" @change="draft.ending.culpritId = ($event.target as HTMLInputElement).checked ? character.id : ''"><span><strong>将此人物设为案件答案</strong><small>玩家最终指认此人物，即挑战成功</small></span></label>
              <div class="field"><div class="field-heading"><label for="editor-profile">人物设定</label><button type="button" class="text-button" @click="overlay = 'example'">看完整示例</button></div><textarea id="editor-profile" v-model="character.profile" :name="`profile-${character.id}`" data-field="profile" :aria-invalid="invalid('profile')" rows="9" placeholder="你叫……你亲历了什么，知道什么，面对追问会怎么回答？"></textarea><p class="guidance-line"><span aria-hidden="true">✎</span><span>推荐用第二人称「你叫……」，写清亲历、所知和回答方式。完整设定不会直接展示给玩家。</span></p></div>
            </div>
          </section>
          <section v-else class="panel no-characters"><h2>故事还缺一位人物</h2><p>为他选个形象，再写下他的故事。</p><UiButton variant="secondary" @click="addCharacter">添加第一位人物</UiButton></section>
        </div>
        <div v-else class="ending-layout">
          <section class="panel form-panel"><h2>案件答案</h2><div v-if="answer" class="answer-summary"><img v-if="appearance(answer)" :src="appearance(answer)!.avatar" alt=""><div><strong>{{ name(answer) }}</strong><span>在人物编辑中设定</span></div></div><div v-else class="answer-empty"><p>还没有选定案件答案</p><button type="button" class="text-button" @click="step = 1">返回人物编辑</button></div><label class="field">完整经过<textarea v-model="draft.ending.reveal" name="reveal" data-field="reveal" :aria-invalid="invalid('reveal')" rows="9" placeholder="谁做了什么，为什么？把这个谜题的完整经过写在这里。"></textarea><small>仅在正确指认后揭晓。指认错误会结束本局，不揭晓真相。</small></label></section>
          <aside class="panel player-preview" aria-label="结局内容预览"><span class="preview-badge">正确指认后的揭晓</span><h2>谜底在这里</h2><p>{{ draft.ending.reveal || '写下完整经过，给玩家一个恍然大悟的结局。' }}</p></aside>
        </div>
        <footer class="step-footer"><UiButton v-if="step > 0" variant="quiet" @click="step--">上一步</UiButton><span v-else></span><UiButton v-if="step < 2" variant="secondary" @click="step++">下一步：{{ steps[step + 1] }}</UiButton><div v-else class="final-actions"><UiButton variant="quiet" @click="contribute">投稿给官方</UiButton><UiButton variant="secondary" @click="preview">试玩</UiButton><UiButton :busy="busy" @click="share">分享案件</UiButton></div></footer>
        <div v-if="step < 2" class="quick-actions"><button type="button" class="text-button" @click="preview">试玩</button><button type="button" class="text-button" @click="share">分享案件</button></div>
      </fieldset>
    </main>
    <EditorDialog v-if="overlay != null" :title="{ example: '人物设定 · 完整示例', appearance: '选择预置形象', share: '把谜题交给朋友', submission: '投稿到官方案件库', delete: '删除这位人物？', clear: '清除本地草稿？' }[overlay]" @close="overlay = null">
      <template v-if="overlay === 'example'"><p>这是写给角色的扮演资料，仍是一份纯文本。</p><p class="example-text">{{ PROFILE_EXAMPLE }}</p><p class="muted">示例不会替换你正在写的内容。</p></template>
      <div v-else-if="overlay === 'appearance'" class="appearance-grid"><button v-for="preset in appearances" :key="preset.id" type="button" class="editor-appearance" :aria-pressed="character?.appearanceId === preset.id" @click="chooseAppearance(preset.id)"><img :src="preset.avatar" alt=""><span>{{ preset.name }}</span></button><p v-if="appearances.length === 0">预置形象暂未加载，请稍后重新打开编辑器。草稿仍保留在此浏览器。</p></div>
      <template v-else-if="overlay === 'clear'"><p>将清除当前案件的全部编辑内容和此浏览器保存的草稿，重新开始创作。此操作无法撤销，已分享的链接不受影响。</p><div class="dialog-actions"><UiButton variant="secondary" @click="overlay = null">保留草稿</UiButton><UiButton @click="clearDraft">确认清除</UiButton></div></template>
      <template v-else-if="overlay === 'delete'"><p>将删除{{ character == null ? '' : name(character) }}的设定。如果他是案件答案，需要重新选择；此操作无法撤销。</p><div class="dialog-actions"><UiButton variant="secondary" @click="overlay = null">保留人物</UiButton><UiButton @click="deleteCharacter">确认删除</UiButton></div></template>
      <template v-else-if="overlay === 'share' && shareUrl != null"><p>朋友打开链接就能玩。修改草稿后需要重新生成链接，旧链接保留当时的内容。</p><label class="field">完整分享链接<textarea :value="shareUrl" readonly rows="4" @focus="($event.target as HTMLTextAreaElement).select()"></textarea></label><p class="muted">{{ shareUrl.length.toLocaleString('en-US') }} / {{ SHARE_URL_LIMIT.toLocaleString('en-US') }} 字符</p><UiButton @click="copy(shareUrl)">{{ copied ? '已复制' : '复制分享链接' }}</UiButton></template>
      <template v-else-if="overlay === 'submission' && submission != null">
        <p>把案件投稿到官方案件库。内容包含完整真相和人物设定，提交前请确认愿意公开。</p>
        <a :href="submission.url" target="_blank" rel="noopener noreferrer" class="github-link">打开 GitHub 新建文件页 ↗</a>
        <ol class="submission-steps"><li>复制下方 JSON，打开上面的 GitHub 链接。</li><li>登录后按 GitHub 提示 fork 仓库，粘贴 JSON 并提交到自己的分支。</li><li>向 nighca/lie 的 main 发起 Pull Request，交给维护者审阅。</li></ol>
        <label class="field">案件 JSON<textarea :value="submission.json" readonly rows="7" @focus="($event.target as HTMLTextAreaElement).select()"></textarea></label>
        <UiButton variant="secondary" @click="copy(submission.json)">{{ copied ? '已复制' : '复制 JSON' }}</UiButton>
        <p class="muted">这里不会自动创建 PR。维护者审阅并收录后，案件才会上线。</p>
      </template>
      <p v-if="notice != null" role="alert">{{ notice }}</p>
    </EditorDialog>
  </div>
</template>

<style scoped src="./editor.css"></style>
