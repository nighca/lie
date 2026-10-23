<script setup lang="ts">
import { ref } from 'vue'

import { CharacterChoice, Transcript, UiButton, UiDialog, UiNotice, VoiceControl } from '../index'
import type { VoiceStatus } from '../index'

const count = ref(3)
const selected = ref('甲')
const open = ref(false)
const status = ref<VoiceStatus>('idle')
const busy = ref(false)
const notice = ref('组件只显示状态与发出操作，不连接麦克风或模型。')
const people = [
  { name: '人物甲', description: '前台工作人员', id: '甲' },
  { name: '名字特别长的人物乙', description: '夜间值班工作人员', id: '乙' },
  { name: '人物丙', description: '临时来访者', id: '丙' },
]
const states: VoiceStatus[] = ['idle', 'recording', 'waiting', 'speaking', 'error']
const labels: Record<VoiceStatus, string> = { idle: '等待你开口', recording: '正在聆听', waiting: '等待回应', speaking: '正在说话', error: '语音暂时中断' }
</script>

<template>
  <main class="demo">
    <header><p>LIE · 公共 UI 组件预览</p><h1>轻松开口，认真听话。</h1><p>中文 B 风格实现 · 假数据 · 非业务页面</p></header>
    <section><h2>按钮与反馈</h2><div class="demo-row"><UiButton @click="open = true">打开弹窗</UiButton><UiButton variant="secondary">次要操作</UiButton><UiButton variant="quiet">轻量操作</UiButton><UiButton disabled>暂不可用</UiButton><UiButton :busy="busy" @click="busy = true">{{ busy ? '处理中' : '提交操作' }}</UiButton><UiButton variant="quiet" @click="busy = false">重置忙碌状态</UiButton></div><UiNotice>{{ notice }}</UiNotice></section>
    <section><h2>人物选择 · {{ count }} 人</h2><div class="demo-row"><UiButton variant="secondary" @click="count = count === 3 ? 2 : 3">切换 2 / 3 人</UiButton></div><nav class="demo-people" aria-label="选择预览人物"><CharacterChoice v-for="person in people.slice(0, count)" :key="person.id" :name="person.name" :description="person.description" :selected="selected === person.id" @click="selected = person.id" /></nav></section>
    <section><h2>语音控制</h2><div class="demo-row"><UiButton v-for="state in states" :key="state" variant="secondary" :aria-pressed="status === state" @click="status = state">{{ labels[state] }}</UiButton></div><VoiceControl :status="status" :label="labels[status]" :action-label="status === 'recording' ? '结束说话' : status === 'error' ? '重试' : '开始说话'" :cancel-label="status === 'recording' || status === 'waiting' ? '取消本轮' : null" :interrupt-label="status === 'speaking' ? '打断说话' : null" @start="notice = '收到主操作意图；由业务处理。'" @cancel="notice = '收到取消意图；由业务处理。'" @interrupt="notice = '收到打断意图；由业务处理。'" /></section>
    <section><h2>只读转写</h2><Transcript :messages="[{ id: 'one', speaker: '你', text: '闭馆之后，你在哪里？', mine: true }, { id: 'two', speaker: '人物甲', text: '我一直在前台呀。\n如果你想问得更详细，可以直接开口。' }, { id: 'three', speaker: '你', text: '这是一段较长的中文，用于确认在放大界面和较窄视口时，转写能够自然换行，不会把旁边的操作挤出屏幕。', mine: true }]" /></section>
    <UiDialog :open="open" title="确认你的选择" @close="open = false"><p>这里是公共弹窗的假数据正文。你可以用 Tab 切换操作、按 Escape 返回。</p><UiNotice tone="error">这是内联反馈样例，不代表任何人物有罪。</UiNotice><template #actions><UiButton variant="secondary" @click="open = false">返回</UiButton><UiButton @click="open = false">确认操作</UiButton></template></UiDialog>
  </main>
</template>

<style>
body { margin: 0; background: var(--lie-canvas); color: var(--lie-ink); font: 16px/1.65 var(--lie-font); }
.demo { max-width: 1120px; margin: auto; padding: 32px; }
.demo h1 { font-size: clamp(28px, 4vw, 48px); line-height: 1.2; }
.demo h2 { font-size: 24px; }
.demo section { margin: 40px 0; }
.demo-row { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin: 24px 0; }
.demo-people { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr)); gap: 16px; }
@media (max-width: 700px) { .demo { padding: 16px; } }
</style>
